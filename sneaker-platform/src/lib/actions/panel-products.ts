"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { ProductImage, ProductVariant } from "@/db/schema";
import { requireMerchant, requirePlatform } from "@/lib/panel";
import { POOL_KEY, importFromPool, merchantCatalogKey } from "@/lib/catalog-admin";
import { invalidate, invalidateAll } from "@/lib/cache";
import { CATEGORY_BY_KEY, slugify, sortSizes } from "@/lib/taxonomy";
import { AiError, generateProductCopy } from "@/lib/ai/gemini";
import { sendStockAlerts } from "@/lib/stock-alerts";
import { pushProducts } from "@/lib/shopier/sync";

export type FormState = { ok?: boolean; error?: string; message?: string } | null;
export type Scope = "merchant" | "pool";

async function scopeCtx(scope: Scope) {
  if (scope === "pool") {
    await requirePlatform();
    return { catalogKey: POOL_KEY, merchant: null, base: "/panel/havuz" };
  }
  const ctx = await requireMerchant();
  return { catalogKey: merchantCatalogKey(ctx.merchant.id), merchant: ctx.merchant, base: "/panel/urunler" };
}

async function ownedProduct(scope: Scope, id: number) {
  const s = await scopeCtx(scope);
  const p = await db.query.products.findFirst({ where: and(eq(schema.products.id, id), eq(schema.products.catalogKey, s.catalogKey)) });
  if (!p) throw new Error("Ürün bulunamadı");
  return { ...s, product: p };
}

function tl(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim().replace(/\./g, "").replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
}

export async function saveProduct(scope: Scope, productId: number | null, _: FormState, form: FormData): Promise<FormState> {
  const s = await scopeCtx(scope);
  const str = (k: string) => String(form.get(k) ?? "").trim();
  const title = str("title");
  const brand = str("brand");
  const model = str("model");
  if (title.length < 3 || !brand || !model) return { error: "Ürün adı, marka ve model zorunludur." };
  const category = str("category");
  if (!CATEGORY_BY_KEY[category]) return { error: "Kategori seçin." };
  const price = tl(form.get("price"));
  if (!price) return { error: "Geçerli bir satış fiyatı girin." };
  const compareAtPrice = tl(form.get("compareAtPrice"));
  if (compareAtPrice && compareAtPrice <= price) return { error: "İndirim öncesi fiyat, satış fiyatından büyük olmalı." };
  let images: ProductImage[] = [];
  let variants: ProductVariant[] = [];
  try {
    images = (JSON.parse(str("images") || "[]") as ProductImage[]).filter((i) => i.url);
    variants = (JSON.parse(str("variants") || "[]") as ProductVariant[])
      .map((v) => ({ size: String(v.size).trim(), stock: Math.max(0, Math.floor(Number(v.stock) || 0)), sku: v.sku?.trim() || undefined }))
      .filter((v) => v.size);
  } catch {
    return { error: "Görsel veya beden bilgisi okunamadı." };
  }
  if (!variants.length) return { error: "En az bir beden (veya 'Standart') ekleyin." };
  const order = sortSizes(variants.map((v) => v.size));
  variants.sort((a, b) => order.indexOf(a.size) - order.indexOf(b.size));
  const cat = CATEGORY_BY_KEY[category];
  const releaseDate = str("releaseDate") ? new Date(str("releaseDate")) : null;
  const slugBase = slugify(str("slug") || `${title}`);
  const values = {
    title,
    brand,
    model,
    colorName: str("colorName") || "Standart",
    colorHex: /^#[0-9a-f]{6}$/i.test(str("colorHex")) ? str("colorHex") : "#111111",
    gender: (["erkek", "kadin", "cocuk", "unisex"].includes(str("gender")) ? str("gender") : "unisex") as "erkek" | "kadin" | "cocuk" | "unisex",
    productType: cat.type,
    category,
    price,
    compareAtPrice,
    description: str("description"),
    material: str("material") || null,
    sku: str("sku") || `SKU-${Date.now().toString(36).toUpperCase()}`,
    images,
    variants,
    tags: str("tags")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    isNew: form.get("isNew") === "on",
    isBestSeller: form.get("isBestSeller") === "on",
    isFeatured: form.get("isFeatured") === "on",
    active: form.get("active") === "on",
    releaseDate: releaseDate && !Number.isNaN(releaseDate.getTime()) ? releaseDate : null,
    updatedAt: new Date(),
  };

  // Aynı katalogda benzersiz adres
  let slug = slugBase;
  for (let i = 2; ; i++) {
    const clash = await db.query.products.findFirst({ where: and(eq(schema.products.catalogKey, s.catalogKey), eq(schema.products.slug, slug)) });
    if (!clash || clash.id === productId) break;
    slug = `${slugBase}-${i}`;
  }

  if (productId) {
    const before = await db.query.products.findFirst({ where: and(eq(schema.products.id, productId), eq(schema.products.catalogKey, s.catalogKey)) });
    if (!before) return { error: "Ürün bulunamadı." };
    await db.update(schema.products).set({ ...values, slug }).where(eq(schema.products.id, productId));
    invalidate(`catalog:${s.catalogKey}`);
    // Tükenen bedenler yeniden stoğa girdiyse "gelince haber ver" listesine e-posta gönder.
    const restocked = variants.filter((v) => v.stock > 0 && (before.variants.find((b) => b.size === v.size)?.stock ?? 0) < 1).map((v) => v.size);
    const sent = restocked.length ? await sendStockAlerts(productId, restocked) : 0;
    revalidatePath(`${s.base}/${productId}`);
    return { ok: true, message: sent ? `Kaydedildi. ${sent} müşteriye "stoğa girdi" e-postası gönderildi.` : "Kaydedildi." };
  }

  if (s.merchant) {
    const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.products).where(eq(schema.products.catalogKey, s.catalogKey));
    if (n >= s.merchant.productLimit) return { error: `Paketinizdeki ürün limitine (${s.merchant.productLimit}) ulaştınız.` };
  }
  const [row] = await db
    .insert(schema.products)
    .values({ ...values, slug, catalogKey: s.catalogKey, externalId: `${scope === "pool" ? "pool" : "m"}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}` })
    .returning();
  invalidate(`catalog:${s.catalogKey}`);
  redirect(`${s.base}/${row.id}?yeni=1`);
}

export async function bulkProducts(scope: Scope, ids: number[], op: "activate" | "deactivate" | "delete" | "new-on" | "new-off" | "featured-on" | "featured-off") {
  const s = await scopeCtx(scope);
  if (!ids.length) return { error: "Ürün seçilmedi." };
  const where = and(eq(schema.products.catalogKey, s.catalogKey), inArray(schema.products.id, ids));
  if (op === "delete") await db.delete(schema.products).where(where);
  else {
    const set =
      op === "activate"
        ? { active: true }
        : op === "deactivate"
          ? { active: false }
          : op === "new-on"
            ? { isNew: true }
            : op === "new-off"
              ? { isNew: false }
              : op === "featured-on"
                ? { isFeatured: true }
                : { isFeatured: false };
    await db.update(schema.products).set({ ...set, updatedAt: new Date() }).where(where);
  }
  invalidate(`catalog:${s.catalogKey}`);
  revalidatePath(s.base);
  return { ok: true, message: `${ids.length} ürün güncellendi.` };
}

export async function bulkPrice(scope: Scope, ids: number[], percent: number) {
  const s = await scopeCtx(scope);
  if (!ids.length || !Number.isFinite(percent) || percent === 0 || Math.abs(percent) > 90) return { error: "Geçerli bir yüzde girin (-90 ile 90 arası)." };
  await db
    .update(schema.products)
    .set({ price: sql`(round(${schema.products.price} * ${1 + percent / 100} / 1000) * 1000 - 100)::int`, updatedAt: new Date() })
    .where(and(eq(schema.products.catalogKey, s.catalogKey), inArray(schema.products.id, ids)));
  invalidate(`catalog:${s.catalogKey}`);
  revalidatePath(s.base);
  return { ok: true, message: `${ids.length} ürünün fiyatı %${percent} güncellendi.` };
}

export async function deleteProduct(scope: Scope, id: number) {
  const { catalogKey, base } = await ownedProduct(scope, id);
  await db.delete(schema.products).where(eq(schema.products.id, id));
  invalidate(`catalog:${catalogKey}`);
  redirect(base);
}

export async function duplicateProduct(scope: Scope, id: number) {
  const { product, catalogKey, base } = await ownedProduct(scope, id);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, createdAt, updatedAt, ...rest } = product;
  const [row] = await db
    .insert(schema.products)
    .values({ ...rest, title: `${product.title} (Kopya)`, slug: `${product.slug}-kopya-${Date.now().toString(36)}`, externalId: `copy-${Date.now().toString(36)}`, sourcePoolId: null, active: false })
    .returning();
  invalidate(`catalog:${catalogKey}`);
  redirect(`${base}/${row.id}`);
}

/* ------------------------------------------------------------------ */
/* Site bazlı SEO / görünürlük                                          */
/* ------------------------------------------------------------------ */

async function ownedSiteForProduct(productId: number, siteId: number) {
  const { product, merchant } = await ownedProduct("merchant", productId);
  const site = await db.query.sites.findFirst({ where: and(eq(schema.sites.id, siteId), eq(schema.sites.merchantId, merchant!.id)) });
  if (!site) throw new Error("Site bulunamadı");
  return { product, merchant: merchant!, site };
}

export async function saveProductOverride(productId: number, siteId: number, _: FormState, form: FormData): Promise<FormState> {
  const { site } = await ownedSiteForProduct(productId, siteId);
  const v = (k: string) => String(form.get(k) ?? "").trim() || null;
  const row = { hidden: form.get("hidden") === "on", title: v("title"), metaTitle: v("metaTitle"), metaDescription: v("metaDescription"), description: v("description"), updatedAt: new Date() };
  await db
    .insert(schema.productSiteOverrides)
    .values({ siteId: site.id, productId, ...row })
    .onConflictDoUpdate({ target: [schema.productSiteOverrides.siteId, schema.productSiteOverrides.productId], set: row });
  invalidate(`overrides:${site.id}`);
  revalidatePath(`/panel/urunler/${productId}`);
  return { ok: true, message: `${site.name} için kaydedildi.` };
}

export async function clearProductOverride(productId: number, siteId: number) {
  const { site } = await ownedSiteForProduct(productId, siteId);
  await db.delete(schema.productSiteOverrides).where(and(eq(schema.productSiteOverrides.siteId, site.id), eq(schema.productSiteOverrides.productId, productId)));
  invalidate(`overrides:${site.id}`);
  revalidatePath(`/panel/urunler/${productId}`);
  return { ok: true, message: "Otomatik metne dönüldü." };
}

/** Seçili site için Gemini ile özgün ürün metni üretir ve siteye özel olarak kaydeder. */
export async function aiForSite(productId: number, siteId: number): Promise<FormState> {
  const { product, merchant, site } = await ownedSiteForProduct(productId, siteId);
  try {
    const copy = await generateProductCopy({
      product,
      merchant,
      site: { name: site.name, city: site.settings.seo.targetCity || site.settings.contact.city, shipping: site.settings.shipping },
    });
    const row = { title: copy.title, metaTitle: copy.metaTitle, metaDescription: copy.metaDescription, description: copy.description, aiGeneratedAt: new Date(), updatedAt: new Date() };
    await db
      .insert(schema.productSiteOverrides)
      .values({ siteId: site.id, productId, hidden: false, ...row })
      .onConflictDoUpdate({ target: [schema.productSiteOverrides.siteId, schema.productSiteOverrides.productId], set: row });
    invalidate(`overrides:${site.id}`);
    revalidatePath(`/panel/urunler/${productId}`);
    return { ok: true, message: `${site.name} için AI metni üretildi.` };
  } catch (e) {
    return { error: e instanceof AiError ? e.message : `AI metni üretilemedi: ${(e as Error).message}` };
  }
}

/** Seçili ürünler için, seçili sitede toplu AI metni (en fazla 20). */
export async function aiBulk(siteId: number, ids: number[]): Promise<FormState> {
  const ctx = await requireMerchant();
  const list = ids.slice(0, 20);
  let ok = 0;
  let last = "";
  for (const id of list) {
    const r = await aiForSite(id, siteId);
    if (r?.ok) ok++;
    else {
      last = r?.error ?? "";
      if (last.includes("hakkınız doldu") || last.includes("anahtarı tanımlı değil")) break;
    }
  }
  void ctx;
  revalidatePath("/panel/urunler");
  if (!ok) return { error: last || "Hiçbir ürün için metin üretilemedi." };
  return { ok: true, message: `${ok} ürün için AI metni üretildi${ids.length > 20 ? " (tek seferde en fazla 20 ürün)" : ""}.${last ? ` Son hata: ${last}` : ""}` };
}

/** Ürünün genel (katalog) açıklamasını AI ile yazar ve forma döndürür. */
export async function aiBaseDescription(scope: Scope, productId: number): Promise<FormState & { description?: string }> {
  const { product, merchant } = await ownedProduct(scope, productId);
  const m = merchant ?? (await db.query.merchants.findFirst({ orderBy: (t, { asc }) => asc(t.id) }));
  if (!m) return { error: "AI kotası için satıcı bulunamadı." };
  try {
    const copy = await generateProductCopy({ product, merchant: scope === "pool" ? { ...m, geminiApiKey: null, aiMonthlyLimit: 1_000_000 } : m, site: null });
    return { ok: true, message: "Açıklama üretildi; kaydetmeyi unutmayın.", description: copy.description };
  } catch (e) {
    return { error: e instanceof AiError ? e.message : (e as Error).message };
  }
}

/* ------------------------------------------------------------------ */
/* Stok alarmları ve Shopier                                            */
/* ------------------------------------------------------------------ */

export async function notifyRestock(productId: number): Promise<FormState> {
  await ownedProduct("merchant", productId);
  const n = await sendStockAlerts(productId);
  revalidatePath(`/panel/urunler/${productId}`);
  return n ? { ok: true, message: `${n} müşteriye e-posta gönderildi.` } : { error: "Stokta olan beden için bekleyen talep yok." };
}

export async function pushToShopier(accountId: number, ids: number[]): Promise<FormState> {
  const ctx = await requireMerchant();
  const acc = await db.query.shopierAccounts.findFirst({ where: and(eq(schema.shopierAccounts.id, accountId), eq(schema.shopierAccounts.merchantId, ctx.merchant.id)) });
  if (!acc) return { error: "Shopier hesabı bulunamadı." };
  try {
    const r = await pushProducts(acc.id, ids);
    revalidatePath("/panel/urunler");
    return { ok: true, message: `Shopier'e gönderildi: ${r.ok} başarılı, ${r.failed} hatalı.` };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

/* ------------------------------------------------------------------ */
/* Katalog havuzundan içe aktarma                                       */
/* ------------------------------------------------------------------ */

export async function importPool(ids: number[] | "all"): Promise<FormState> {
  const ctx = await requireMerchant();
  const current = await db.$count(schema.products, eq(schema.products.catalogKey, merchantCatalogKey(ctx.merchant.id)));
  const room = ctx.merchant.productLimit - current;
  if (room <= 0) return { error: `Ürün limitinize (${ctx.merchant.productLimit}) ulaştınız. Paketinizi yükseltin.` };
  let list = ids;
  if (list === "all") {
    const pool = await db.select({ id: schema.products.id }).from(schema.products).where(and(eq(schema.products.catalogKey, POOL_KEY), eq(schema.products.active, true)));
    list = pool.map((p) => p.id);
  }
  const r = await importFromPool(ctx.merchant.id, list.slice(0, room));
  invalidateAll();
  revalidatePath("/panel/katalog");
  revalidatePath("/panel/urunler");
  const cut = list.length > room ? ` Limit nedeniyle ${list.length - room} ürün eklenmedi.` : "";
  return { ok: true, message: `${r.added} ürün kataloğunuza eklendi${r.skipped ? `, ${r.skipped} ürün zaten vardı` : ""}.${cut}` };
}

/** Havuzdaki güncel bilgileri (görsel, açıklama, fiyat) satıcının kopyasına yeniden uygular. */
export async function resyncFromPool(productId: number): Promise<FormState> {
  const { product, catalogKey } = await ownedProduct("merchant", productId);
  if (!product.sourcePoolId) return { error: "Bu ürün havuzdan eklenmemiş." };
  const src = await db.query.products.findFirst({ where: and(eq(schema.products.id, product.sourcePoolId), eq(schema.products.catalogKey, POOL_KEY)) });
  if (!src) return { error: "Havuzdaki kaynak ürün bulunamadı." };
  await db
    .update(schema.products)
    .set({ images: src.images, description: src.description, material: src.material, tags: src.tags, updatedAt: new Date() })
    .where(eq(schema.products.id, productId));
  invalidate(`catalog:${catalogKey}`);
  revalidatePath(`/panel/urunler/${productId}`);
  return { ok: true, message: "Görseller ve açıklama havuzdaki güncel haliyle yenilendi (fiyat ve stok korunur)." };
}
