import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Product, ShopierAccount } from "@/db/schema";
import { invalidate } from "@/lib/cache";
import { merchantCatalogKey } from "@/lib/catalog-admin";
import { BRANDS, CATEGORY_BY_KEY, GENDER_LABEL, slugify, sortSizes } from "@/lib/taxonomy";
import { ShopierApiError, ShopierClient, WEBHOOK_EVENTS, type ShopierOrder, type ShopierProduct, type ShopierProductInput } from "./client";

/* ------------------------------------------------------------------ */
/* Yardımcılar                                                         */
/* ------------------------------------------------------------------ */

export async function getAccount(accountId: number) {
  return (await db.query.shopierAccounts.findFirst({ where: eq(schema.shopierAccounts.id, accountId) })) ?? null;
}

export function clientFor(account: ShopierAccount) {
  if (!account.personalAccessToken) throw new Error("Bu Shopier hesabı için Kişisel Erişim Anahtarı (PAT) girilmemiş.");
  return new ShopierClient(account.personalAccessToken);
}

async function log(account: Pick<ShopierAccount, "id" | "merchantId">, kind: string, status: "ok" | "error" | "info", message: string) {
  await db.insert(schema.syncLogs).values({ merchantId: account.merchantId, shopierAccountId: account.id, kind, status, message: message.slice(0, 1000) });
}

function errText(e: unknown) {
  return e instanceof ShopierApiError ? `${e.message} (HTTP ${e.status})` : e instanceof Error ? e.message : String(e);
}

/** Uygulamanın dışarıdan erişilen adresi (webhook ve görsel URL'leri için). */
export function platformUrl() {
  return (process.env.PLATFORM_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function absoluteImage(url: string) {
  return url.startsWith("http") ? url : `${platformUrl()}${url.startsWith("/") ? url : `/${url}`}`;
}

/* ------------------------------------------------------------------ */
/* Bağlantı testi                                                      */
/* ------------------------------------------------------------------ */

export async function testConnection(accountId: number) {
  const account = await getAccount(accountId);
  if (!account) throw new Error("Hesap bulunamadı");
  const result = { token: false, productApi: false, paymentModule: Boolean(account.apiKey && account.apiSecret), message: "" };
  try {
    const c = clientFor(account);
    await c.shopSettings().catch(async (e) => {
      // Bazı hesaplarda /shop/settings kapalı olabilir; kategori listesi ile doğrula.
      if (e instanceof ShopierApiError && e.status === 404) await c.allCategories();
      else throw e;
    });
    result.token = true;
    try {
      await c.listProducts(1);
      result.productApi = true;
    } catch (e) {
      if (e instanceof ShopierApiError && e.status === 403) result.message = "Erişim anahtarı geçerli, ancak ürün API'si mağazanız için henüz etkin değil. Shopier'den (hello@shopier.com) ürün API erişimi talep edin.";
      else throw e;
    }
    if (!result.message) result.message = "Bağlantı başarılı. Ürün, sipariş ve webhook işlemleri kullanılabilir.";
  } catch (e) {
    result.message = errText(e);
  }
  if (!result.paymentModule) result.message += " Ödeme modülü için API Key ve API Secret girilmelidir.";
  await db
    .update(schema.shopierAccounts)
    .set({ productApiEnabled: result.productApi, lastCheckAt: new Date(), lastCheckMessage: result.message })
    .where(eq(schema.shopierAccounts.id, account.id));
  await log(account, "test", result.token ? "ok" : "error", result.message);
  return result;
}

/* ------------------------------------------------------------------ */
/* Beden varyasyonu                                                    */
/* ------------------------------------------------------------------ */

const SIZE_VARIATION_TITLES = ["beden", "numara", "size", "ayakkabı numarası"];

async function ensureSelections(account: ShopierAccount, client: ShopierClient, sizes: string[]) {
  let variationId = account.sizeVariationId;
  if (!variationId) {
    const all = await client.allVariations();
    const found = all.find((v) => SIZE_VARIATION_TITLES.includes(v.title.toLocaleLowerCase("tr-TR").trim()));
    variationId = found?.id ?? (await client.createVariation("Beden")).id;
  }
  const map: Record<string, string> = { ...account.selectionMap };
  const missing = sizes.filter((s) => !map[s]);
  if (missing.length) {
    const existing = await client.allSelections(variationId);
    for (const sel of existing) map[sel.title.trim()] = sel.id;
    for (const s of missing) if (!map[s]) map[s] = (await client.createSelection(variationId, s)).id;
  }
  if (variationId !== account.sizeVariationId || missing.length) {
    await db.update(schema.shopierAccounts).set({ sizeVariationId: variationId, selectionMap: map }).where(eq(schema.shopierAccounts.id, account.id));
    account.sizeVariationId = variationId;
    account.selectionMap = map;
  }
  return map;
}

/* ------------------------------------------------------------------ */
/* Ürün aktarımı (panel → Shopier)                                     */
/* ------------------------------------------------------------------ */

export function shopierTitle(p: Product) {
  const cat = CATEGORY_BY_KEY[p.category]?.singular ?? "";
  const g = p.gender === "unisex" ? "" : GENDER_LABEL[p.gender];
  return `${p.brand} ${p.model} ${g} ${cat} ${p.colorName}`.replace(/\s+/g, " ").trim().slice(0, 120);
}

export function shopierDescription(p: Product) {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return [
    `<p>${esc(p.description)}</p>`,
    `<ul><li>Marka: ${esc(p.brand)}</li><li>Model: ${esc(p.model)}</li><li>Renk: ${esc(p.colorName)}</li>${p.material ? `<li>Materyal: ${esc(p.material)}</li>` : ""}<li>Ürün kodu: ${esc(p.sku)}</li></ul>`,
    "<p>Ürün orijinal ve faturalıdır.</p>",
  ].join("");
}

export function buildShopierInput(p: Product, selectionMap: Record<string, string>, opts: { dispatchDuration?: 1 | 2 | 3; shippingPayer?: "sellerPays" | "buyerPays" } = {}): ShopierProductInput {
  const onSale = Boolean(p.compareAtPrice && p.compareAtPrice > p.price);
  const tl = (k: number) => (k / 100).toFixed(2);
  const sizes = sortSizes(p.variants.map((v) => v.size));
  const variants =
    p.variants.length > 1 || (p.variants.length === 1 && p.variants[0].size !== "STD")
      ? sizes.map((size, i) => {
          const v = p.variants.find((x) => x.size === size)!;
          return { selectionId: [selectionMap[size]], stockQuantity: Math.max(0, v.stock), primary: i === 0 };
        })
      : undefined;
  return {
    title: shopierTitle(p),
    description: shopierDescription(p),
    type: "physical",
    media: p.images.slice(0, 5).map((im, i) => ({ type: "image", url: absoluteImage(im.url), placement: i + 1 })),
    priceData: onSale
      ? { currency: "TRY", price: tl(p.compareAtPrice!), discount: true, discountedPrice: tl(p.price) }
      : { currency: "TRY", price: tl(p.price), discount: false },
    stockQuantity: variants ? undefined : Math.max(0, p.variants.reduce((a, v) => a + v.stock, 0)),
    shippingPayer: opts.shippingPayer ?? "sellerPays",
    variants,
    dispatchDuration: opts.dispatchDuration ?? 2,
  };
}

export async function pushProduct(accountId: number, productId: number) {
  const account = await getAccount(accountId);
  if (!account) throw new Error("Hesap bulunamadı");
  const p = await db.query.products.findFirst({ where: eq(schema.products.id, productId) });
  if (!p || p.catalogKey !== merchantCatalogKey(account.merchantId)) throw new Error("Ürün bu satıcıya ait değil");
  const client = clientFor(account);
  const link = await db.query.productShopierLinks.findFirst({
    where: and(eq(schema.productShopierLinks.productId, p.id), eq(schema.productShopierLinks.shopierAccountId, account.id)),
  });
  try {
    const map = p.variants.length > 1 || p.variants[0]?.size !== "STD" ? await ensureSelections(account, client, p.variants.map((v) => v.size)) : {};
    const input = buildShopierInput(p, map);
    let result: ShopierProduct;
    if (link?.shopierProductId) {
      try {
        result = await client.updateProduct(link.shopierProductId, input);
      } catch (e) {
        if (e instanceof ShopierApiError && e.status === 404) result = await client.createProduct(input);
        else throw e;
      }
    } else {
      result = await client.createProduct(input);
    }
    await db
      .insert(schema.productShopierLinks)
      .values({ productId: p.id, shopierAccountId: account.id, shopierProductId: result.id, shopierUrl: result.url ?? null, status: "synced", lastError: null, lastSyncedAt: new Date() })
      .onConflictDoUpdate({
        target: [schema.productShopierLinks.productId, schema.productShopierLinks.shopierAccountId],
        set: { shopierProductId: result.id, shopierUrl: result.url ?? null, status: "synced", lastError: null, lastSyncedAt: new Date() },
      });
    return { ok: true as const, shopierProductId: result.id };
  } catch (e) {
    const message = errText(e);
    await db
      .insert(schema.productShopierLinks)
      .values({ productId: p.id, shopierAccountId: account.id, status: "error", lastError: message })
      .onConflictDoUpdate({ target: [schema.productShopierLinks.productId, schema.productShopierLinks.shopierAccountId], set: { status: "error", lastError: message } });
    await log(account, "push", "error", `${p.title} ${p.colorName}: ${message}`);
    return { ok: false as const, error: message };
  }
}

/** Birden çok ürünü sırayla aktarır (Shopier hız limitine takılmamak için düşük eşzamanlılık). */
export async function pushProducts(accountId: number, productIds: number[]) {
  let ok = 0;
  let failed = 0;
  const queue = [...productIds];
  const worker = async () => {
    while (queue.length) {
      const id = queue.shift()!;
      const r = await pushProduct(accountId, id);
      if (r.ok) ok++;
      else failed++;
    }
  };
  await Promise.all([worker(), worker()]);
  const account = await getAccount(accountId);
  if (account) {
    await db.update(schema.shopierAccounts).set({ lastSyncAt: new Date(), lastSyncStatus: `${ok} ürün aktarıldı, ${failed} hata` }).where(eq(schema.shopierAccounts.id, accountId));
    await log(account, "push", failed ? "error" : "ok", `${ok} ürün Shopier'e aktarıldı, ${failed} hata`);
  }
  return { ok, failed };
}

/** Sipariş sonrası ilgili ürünlerin güncel stoklarını Shopier'e yazar. */
export async function pushStockForOrder(site: { shopierAccountId: number | null }, orderId: number) {
  if (!site.shopierAccountId) return;
  const account = await getAccount(site.shopierAccountId);
  if (!account?.personalAccessToken || !account.productApiEnabled) return;
  const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, orderId));
  const ids = [...new Set(items.map((i) => i.productId).filter(Boolean) as number[])];
  if (!ids.length) return;
  const links = await db
    .select()
    .from(schema.productShopierLinks)
    .where(and(eq(schema.productShopierLinks.shopierAccountId, account.id), inArray(schema.productShopierLinks.productId, ids)));
  for (const l of links) if (l.shopierProductId) await pushProduct(account.id, l.productId);
}

/* ------------------------------------------------------------------ */
/* Shopier → panel içe aktarma                                         */
/* ------------------------------------------------------------------ */

const GENDER_WORDS: [RegExp, Product["gender"]][] = [
  [/\b(kadın|kadin|women|bayan)\b/i, "kadin"],
  [/\b(erkek|men|bay)\b/i, "erkek"],
  [/\b(çocuk|cocuk|kids|genç|gs|junior)\b/i, "cocuk"],
];

export function guessBrand(title: string) {
  const t = title.toLocaleLowerCase("tr-TR");
  return BRANDS.find((b) => t.includes(b.name.toLocaleLowerCase("tr-TR")))?.name ?? title.split(" ")[0];
}

export function mapShopierProduct(sp: ShopierProduct, catalogKey: string) {
  const brand = guessBrand(sp.title);
  const text = `${sp.title} ${(sp.categories ?? []).map((c) => c.title).join(" ")}`;
  const gender = GENDER_WORDS.find(([re]) => re.test(text))?.[1] ?? "unisex";
  const lower = text.toLocaleLowerCase("tr-TR");
  const category = /koşu|running/.test(lower) ? "kosu" : /basket/.test(lower) ? "basketbol" : /bot|outdoor|trail/.test(lower) ? "outdoor" : /terlik|slide|sandalet/.test(lower) ? "terlik" : /tişört|t-shirt|tshirt/.test(lower) ? "tisort" : /hoodie|sweat/.test(lower) ? "sweatshirt" : /eşofman|esofman|jogger/.test(lower) ? "esofman" : /mont|ceket|jacket/.test(lower) ? "mont" : /çanta|canta|bag/.test(lower) ? "canta" : /şapka|sapka|cap/.test(lower) ? "sapka" : /çorap|corap|sock/.test(lower) ? "corap" : "sneaker";
  const type = CATEGORY_BY_KEY[category].type;
  const variants = (sp.variants ?? [])
    .filter((v) => v.selectionTitle)
    .map((v, i) => ({ size: String(v.selectionTitle).trim(), stock: Math.max(0, Number(v.stockQuantity ?? 0)), sku: `${sp.id}-${i + 1}` }));
  const price = Math.round(parseFloat(sp.priceData?.discount && sp.priceData.discountedPrice ? sp.priceData.discountedPrice : sp.priceData?.price ?? "0") * 100);
  const compareAt = sp.priceData?.discount && sp.priceData.discountedPrice ? Math.round(parseFloat(sp.priceData.price) * 100) : null;
  const plain = (sp.description ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const model = sp.title.replace(new RegExp(`^${brand}\\s*`, "i"), "").trim() || sp.title;
  return {
    catalogKey,
    externalId: `shopier-${sp.id}`,
    slug: slugify(`${sp.title}-${sp.id}`),
    title: `${brand} ${model}`.trim(),
    brand,
    model,
    colorName: "Standart",
    colorHex: "#9ca3af",
    gender,
    productType: type,
    category,
    price,
    compareAtPrice: compareAt,
    description: plain.slice(0, 2000),
    material: null,
    sku: `SH-${sp.id}`,
    images: [...(sp.media ?? [])].sort((a, b) => a.placement - b.placement).map((m) => ({ url: m.url, alt: sp.title })),
    variants: variants.length ? variants : [{ size: "STD", stock: Math.max(0, Number(sp.stockQuantity ?? 0)), sku: `${sp.id}` }],
    tags: [] as string[],
    isNew: false,
    isBestSeller: false,
    isFeatured: false,
    active: true,
  };
}

export async function importFromShopier(accountId: number) {
  const account = await getAccount(accountId);
  if (!account) throw new Error("Hesap bulunamadı");
  const client = clientFor(account);
  const key = merchantCatalogKey(account.merchantId);
  try {
    const all = await client.allProducts();
    let created = 0;
    let updated = 0;
    for (const sp of all) {
      const already = await db.query.productShopierLinks.findFirst({
        where: and(eq(schema.productShopierLinks.shopierAccountId, account.id), eq(schema.productShopierLinks.shopierProductId, sp.id)),
      });
      const row = mapShopierProduct(sp, key);
      if (already) {
        await db.update(schema.products).set({ price: row.price, compareAtPrice: row.compareAtPrice, variants: row.variants, updatedAt: new Date() }).where(eq(schema.products.id, already.productId));
        updated++;
        continue;
      }
      const [p] = await db
        .insert(schema.products)
        .values(row)
        .onConflictDoUpdate({ target: [schema.products.catalogKey, schema.products.externalId], set: { price: row.price, compareAtPrice: row.compareAtPrice, variants: row.variants, images: row.images, updatedAt: new Date() } })
        .returning();
      await db
        .insert(schema.productShopierLinks)
        .values({ productId: p.id, shopierAccountId: account.id, shopierProductId: sp.id, shopierUrl: sp.url ?? null, status: "synced", lastSyncedAt: new Date() })
        .onConflictDoNothing();
      created++;
    }
    invalidate(`catalog:${key}`);
    const msg = `Shopier'den ${all.length} ürün okundu: ${created} yeni, ${updated} güncellendi`;
    await db.update(schema.shopierAccounts).set({ lastSyncAt: new Date(), lastSyncStatus: msg }).where(eq(schema.shopierAccounts.id, account.id));
    await log(account, "import", "ok", msg);
    return { total: all.length, created, updated };
  } catch (e) {
    await log(account, "import", "error", errText(e));
    throw new Error(errText(e));
  }
}

/* ------------------------------------------------------------------ */
/* Webhook                                                             */
/* ------------------------------------------------------------------ */

export function webhookUrl(accountId: number) {
  return `${platformUrl()}/api/shopier/webhook/${accountId}`;
}

export async function registerWebhooks(accountId: number) {
  const account = await getAccount(accountId);
  if (!account) throw new Error("Hesap bulunamadı");
  const client = clientFor(account);
  const url = webhookUrl(account.id);
  const existing = await client.listWebhooks();
  for (const w of existing.filter((w) => w.url === url)) await client.deleteWebhook(w.id);
  const ids: string[] = [];
  let token = account.webhookToken;
  for (const ev of WEBHOOK_EVENTS) {
    const w = await client.createWebhook(ev, url);
    ids.push(w.id);
    if (w.token) token = w.token;
  }
  await db.update(schema.shopierAccounts).set({ webhookIds: ids, webhookToken: token }).where(eq(schema.shopierAccounts.id, account.id));
  await log(account, "webhook", "ok", `${ids.length} webhook aboneliği oluşturuldu: ${url}`);
  return { count: ids.length, url, tokenReceived: Boolean(token) };
}

async function importShopierOrder(account: ShopierAccount, so: ShopierOrder) {
  const exists = await db.query.orders.findFirst({ where: eq(schema.orders.shopierOrderId, so.id) });
  if (exists) return exists;
  const site = await db.query.sites.findFirst({ where: eq(schema.sites.shopierAccountId, account.id) });
  if (!site) return null;
  const s = so.shippingInfo;
  const addr = { fullName: `${s.firstName} ${s.lastName}`, phone: s.phone, city: s.city, district: s.district, line: s.address, postcode: s.postcode };
  const b = so.billingInfo ?? s;
  const k = (v: string | undefined) => Math.round(parseFloat(v ?? "0") * 100);
  const [o] = await db
    .insert(schema.orders)
    .values({
      siteId: site.id,
      orderNo: `SH${so.id}`,
      email: s.email,
      phone: s.phone,
      firstName: s.firstName,
      lastName: s.lastName,
      shippingAddress: addr,
      billingAddress: { fullName: `${b.firstName} ${b.lastName}`, phone: b.phone, city: b.city, district: b.district, line: b.address, postcode: b.postcode },
      subtotal: k(so.totals.subtotal),
      discount: k(so.totals.discount),
      shippingFee: k(so.totals.shipping),
      total: k(so.totals.total),
      status: so.paymentStatus === "paid" || so.status === "unfulfilled" ? "paid" : "pending_payment",
      paymentProvider: "shopier",
      source: "shopier",
      shopierOrderId: so.id,
      note: so.note ?? null,
    })
    .onConflictDoNothing()
    .returning();
  if (o) {
    const links = await db.select().from(schema.productShopierLinks).where(eq(schema.productShopierLinks.shopierAccountId, account.id));
    await db.insert(schema.orderItems).values(
      so.lineItems.map((li) => ({
        orderId: o.id,
        productId: links.find((l) => l.shopierProductId === li.productId)?.productId ?? null,
        title: li.title,
        brand: guessBrand(li.title),
        size: li.selection?.map((x) => x.title).join(" / ") || "-",
        quantity: li.quantity,
        unitPrice: k(li.price),
      })),
    );
  }
  return o ?? null;
}

export async function handleWebhookEvent(accountId: number, event: string, payload: unknown) {
  const account = await getAccount(accountId);
  if (!account) return;
  const data = payload as Record<string, unknown>;
  if (event === "order.created" || event === "order.addressUpdated") {
    const o = await importShopierOrder(account, data as unknown as ShopierOrder);
    await log(account, "webhook", "info", `${event}: Shopier siparişi ${String(data.id)} ${o ? "kaydedildi" : "(bağlı site yok)"}`);
  } else if (event === "order.fulfilled") {
    await db.update(schema.orders).set({ status: "shipped", updatedAt: new Date() }).where(eq(schema.orders.shopierOrderId, String(data.id)));
    await log(account, "webhook", "info", `order.fulfilled: ${String(data.id)}`);
  } else if (event === "product.updated" || event === "product.created") {
    const sp = data as unknown as ShopierProduct;
    const link = await db.query.productShopierLinks.findFirst({
      where: and(eq(schema.productShopierLinks.shopierAccountId, account.id), eq(schema.productShopierLinks.shopierProductId, sp.id)),
    });
    if (link) {
      const mapped = mapShopierProduct(sp, merchantCatalogKey(account.merchantId));
      await db.update(schema.products).set({ price: mapped.price, compareAtPrice: mapped.compareAtPrice, variants: mapped.variants, updatedAt: new Date() }).where(eq(schema.products.id, link.productId));
      invalidate(`catalog:${merchantCatalogKey(account.merchantId)}`);
    }
    await log(account, "webhook", "info", `${event}: ${sp.title ?? sp.id}${link ? " (fiyat/stok güncellendi)" : ""}`);
  } else {
    await log(account, "webhook", "info", `${event} alındı`);
  }
}

/** Belirli tarih aralığındaki Shopier siparişlerini içe aktarır (webhook kaçırılırsa). */
export async function importRecentOrders(accountId: number, days = 7) {
  const account = await getAccount(accountId);
  if (!account) throw new Error("Hesap bulunamadı");
  const client = clientFor(account);
  const end = new Date();
  const start = new Date(end.getTime() - days * 86400000);
  const iso = (d: Date) => d.toISOString().replace(/\.\d+Z$/, "Z");
  const list = await client.listOrders(iso(start), iso(end));
  let n = 0;
  for (const so of list.items) if (await importShopierOrder(account, so)) n++;
  await log(account, "orders", "ok", `${list.items.length} Shopier siparişi okundu, ${n} kaydedildi`);
  return { read: list.items.length, saved: n };
}

/** Panelde "kargoya verildi" işaretlenen Shopier kaynaklı siparişlerin takip bilgisini Shopier'e iletir. */
export async function fulfillOnShopier(orderId: number) {
  const o = await db.query.orders.findFirst({ where: eq(schema.orders.id, orderId) });
  if (!o?.shopierOrderId || !o.trackingNo || !o.shippingCompany) return { skipped: true };
  const site = await db.query.sites.findFirst({ where: eq(schema.sites.id, o.siteId) });
  if (!site?.shopierAccountId) return { skipped: true };
  const account = await getAccount(site.shopierAccountId);
  if (!account) return { skipped: true };
  const { shippingCompanyCode } = await import("./client");
  await clientFor(account).fulfillOrder(o.shopierOrderId, { shippingCompany: shippingCompanyCode(o.shippingCompany), trackingNumber: o.trackingNo });
  await log(account, "fulfill", "ok", `${o.orderNo} kargo bilgisi Shopier'e iletildi`);
  return { skipped: false };
}
