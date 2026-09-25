"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ilike, isNotNull, notInArray, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { requirePanel } from "@/lib/panel";
import { invalidate, invalidateAll } from "@/lib/cache";
import { importFromPool, merchantCatalogKey, POOL_KEY } from "@/lib/catalog-admin";
import { aiActionSchema, aiPrompt, AI_ACTIONS_JSON_SCHEMA, describe, parseCommand, sanitizeAiActions, type AiAction } from "@/lib/ai/commands";

export type PlannedAction = { action: AiAction; summary: string; impact?: string };
export type PlanResult = { actions: PlannedAction[]; source: "kural" | "gemini"; reply?: string; error?: string };
export type ApplyResult = { ok?: boolean; error?: string; messages?: string[] };

async function ownedSite(siteId: number) {
  const ctx = await requirePanel();
  const site = await db.query.sites.findFirst({ where: eq(schema.sites.id, siteId) });
  if (!site || (!ctx.isPlatform && site.merchantId !== ctx.merchant?.id)) throw new Error("Site bulunamadı");
  const merchant = await db.query.merchants.findFirst({ where: eq(schema.merchants.id, site.merchantId) });
  return { ctx, site, merchant: merchant ?? null };
}

const stockExpr = sql`coalesce((select sum((v->>'stock')::int) from jsonb_array_elements(${schema.products.variants}) v),0)`;

function productFilter(catalogKey: string, a: { brand?: string; category?: string }): SQL {
  const parts: SQL[] = [eq(schema.products.catalogKey, catalogKey)];
  if (a.brand) parts.push(ilike(schema.products.brand, a.brand));
  if (a.category) parts.push(eq(schema.products.category, a.category));
  return and(...parts)!;
}

async function countWhere(where: SQL) {
  const [r] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.products).where(where);
  return r?.n ?? 0;
}

async function impactOf(a: AiAction, catalogKey: string): Promise<string | undefined> {
  switch (a.kind) {
    case "price":
    case "feature":
      return `${await countWhere(productFilter(catalogKey, a))} ürün`;
    case "activate":
      return `${await countWhere(and(productFilter(catalogKey, a), eq(schema.products.active, !a.active))!)} ürün`;
    case "hideOutOfStock":
      return `${await countWhere(and(eq(schema.products.catalogKey, catalogKey), eq(schema.products.active, true), sql`${stockExpr} = 0`)!)} ürün`;
    case "importPool": {
      const owned = db.select({ id: schema.products.sourcePoolId }).from(schema.products).where(and(eq(schema.products.catalogKey, catalogKey), isNotNull(schema.products.sourcePoolId)));
      const n = await countWhere(and(productFilter(POOL_KEY, a), eq(schema.products.active, true), notInArray(schema.products.id, sql`(${owned})`))!);
      return `havuzda uygun ${n} ürün`;
    }
    default:
      return undefined;
  }
}

/** İsteği eylemlere çevirir ve etkisini hesaplar; hiçbir şey değiştirmez. */
export async function planCommand(siteId: number, text: string): Promise<PlanResult> {
  const { site, merchant } = await ownedSite(siteId);
  const input = text.trim().slice(0, 500);
  if (input.length < 3) return { actions: [], source: "kural", error: "Ne yapmak istediğini yaz." };
  let actions = parseCommand(input);
  let source: PlanResult["source"] = "kural";
  let reply: string | undefined;
  if (!actions.length) {
    try {
      const { aiJson, checkQuota, addUsage } = await import("@/lib/ai/gemini");
      if (merchant) await checkQuota(merchant);
      const raw = await aiJson(merchant, aiPrompt(input), AI_ACTIONS_JSON_SCHEMA);
      if (raw) {
        actions = sanitizeAiActions(raw);
        reply = (raw as { reply?: string }).reply;
        source = "gemini";
        if (merchant) await addUsage(merchant.id);
      }
    } catch (e) {
      return { actions: [], source: "gemini", error: e instanceof Error ? e.message : "Yapay zeka yanıt veremedi." };
    }
  }
  if (!actions.length) {
    return {
      actions: [],
      source,
      error: reply || "Bunu anlayamadım. Fiyat, kupon, kargo, duyuru, tema, renk, stok ya da havuzdan ürün ekleme gibi isteklerini yazabilirsin.",
    };
  }
  const catalogKey = merchantCatalogKey(site.merchantId);
  const planned = await Promise.all(actions.slice(0, 6).map(async (a) => ({ action: a, summary: describe(a), impact: await impactOf(a, catalogKey) })));
  return { actions: planned, source, reply };
}

const roundedPrice = (percent: number) => sql`greatest(100, (round(${schema.products.price} * ${String(1 + percent / 100)}::numeric / 1000) * 1000 - 100))::int`;

/** Önizlenen eylemleri uygular. */
export async function applyCommand(siteId: number, rawActions: unknown): Promise<ApplyResult> {
  try {
    return await applyCommandInner(siteId, rawActions);
  } catch (e) {
    console.error("applyCommand", e);
    return { error: "Değişiklik uygulanamadı. Lütfen tekrar dene." };
  }
}

async function applyCommandInner(siteId: number, rawActions: unknown): Promise<ApplyResult> {
  const { site } = await ownedSite(siteId);
  const parsed = z.array(aiActionSchema).max(6).safeParse(rawActions);
  if (!parsed.success || !parsed.data.length) return { error: "Uygulanacak geçerli bir işlem yok." };
  const catalogKey = merchantCatalogKey(site.merchantId);
  const settings = JSON.parse(JSON.stringify(site.settings)) as typeof site.settings;
  let settingsChanged = false;
  const siteUpdate: Partial<typeof schema.sites.$inferInsert> = {};
  const messages: string[] = [];

  for (const a of parsed.data) {
    switch (a.kind) {
      case "price": {
        const rows = await db.update(schema.products).set({ price: roundedPrice(a.percent), updatedAt: new Date() }).where(productFilter(catalogKey, a)).returning({ id: schema.products.id });
        messages.push(`${rows.length} ürünün fiyatı %${Math.abs(a.percent)} ${a.percent > 0 ? "artırıldı" : "düşürüldü"}.`);
        break;
      }
      case "feature": {
        const rows = await db.update(schema.products).set({ isFeatured: true, updatedAt: new Date() }).where(productFilter(catalogKey, a)).returning({ id: schema.products.id });
        messages.push(`${rows.length} ürün öne çıkarıldı.`);
        break;
      }
      case "activate": {
        const rows = await db.update(schema.products).set({ active: a.active, updatedAt: new Date() }).where(productFilter(catalogKey, a)).returning({ id: schema.products.id });
        messages.push(`${rows.length} ürün ${a.active ? "satışa açıldı" : "satıştan kaldırıldı"}.`);
        break;
      }
      case "hideOutOfStock": {
        const rows = await db
          .update(schema.products)
          .set({ active: false, updatedAt: new Date() })
          .where(and(eq(schema.products.catalogKey, catalogKey), eq(schema.products.active, true), sql`${stockExpr} = 0`))
          .returning({ id: schema.products.id });
        messages.push(`Stoğu biten ${rows.length} ürün satıştan kaldırıldı.`);
        break;
      }
      case "importPool": {
        const m = await db.query.merchants.findFirst({ where: eq(schema.merchants.id, site.merchantId) });
        const [{ n: have }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.products).where(eq(schema.products.catalogKey, catalogKey));
        const room = Math.max(0, (m?.productLimit ?? 0) - have);
        if (!room) {
          messages.push("Ürün limitin dolu; havuzdan ürün eklenemedi. Paketini yükseltebilirsin.");
          break;
        }
        const owned = db.select({ id: schema.products.sourcePoolId }).from(schema.products).where(and(eq(schema.products.catalogKey, catalogKey), isNotNull(schema.products.sourcePoolId)));
        const pool = await db
          .select({ id: schema.products.id })
          .from(schema.products)
          .where(and(productFilter(POOL_KEY, a), eq(schema.products.active, true), notInArray(schema.products.id, sql`(${owned})`)))
          .orderBy(sql`${schema.products.popularity} desc`)
          .limit(Math.min(a.limit, room));
        const r = pool.length ? await importFromPool(site.merchantId, pool.map((p) => p.id)) : { added: 0 };
        messages.push(r.added ? `Havuzdan ${r.added} ürün kataloğuna eklendi.` : "Havuzda eklenecek uygun ürün bulunamadı.");
        break;
      }
      case "coupon": {
        const clash = await db.query.coupons.findFirst({ where: and(eq(schema.coupons.merchantId, site.merchantId), eq(schema.coupons.code, a.code)) });
        if (clash) {
          await db.update(schema.coupons).set({ type: "percent", value: a.percent, active: true }).where(eq(schema.coupons.id, clash.id));
          messages.push(`${a.code} kuponu güncellendi (%${a.percent}).`);
        } else {
          await db.insert(schema.coupons).values({ merchantId: site.merchantId, siteId: site.id, code: a.code, type: "percent", value: a.percent, active: true });
          messages.push(`${a.code} kuponu oluşturuldu (%${a.percent}).`);
        }
        break;
      }
      case "theme":
        siteUpdate.theme = a.theme;
        messages.push("Tema değiştirildi.");
        break;
      case "status":
        siteUpdate.status = a.status;
        messages.push(a.status === "active" ? "Site yayına alındı." : a.status === "maintenance" ? "Site bakım moduna alındı." : "Site taslağa alındı.");
        break;
      case "color":
        settings.colors.primary = a.primary;
        settingsChanged = true;
        messages.push(`Ana renk ${a.primary} yapıldı.`);
        break;
      case "announcement":
        settings.announcements = [a.text, ...settings.announcements.filter((x) => x !== a.text)].slice(0, 5);
        settingsChanged = true;
        messages.push("Duyuru eklendi.");
        break;
      case "clearAnnouncements":
        settings.announcements = [];
        settingsChanged = true;
        messages.push("Duyurular temizlendi.");
        break;
      case "freeShipping":
        settings.shipping.freeShippingThreshold = a.threshold;
        settingsChanged = true;
        messages.push(a.threshold ? `${a.threshold.toLocaleString("tr-TR")} TL üzeri kargo artık bedava.` : "Tüm siparişlerde kargo bedava.");
        break;
      case "shippingFee":
        settings.shipping.fee = a.fee;
        settingsChanged = true;
        messages.push(`Kargo ücreti ${a.fee} TL yapıldı.`);
        break;
      case "tagline":
        settings.tagline = a.text;
        settingsChanged = true;
        messages.push("Slogan güncellendi.");
        break;
    }
  }

  if (settingsChanged) siteUpdate.settings = settings;
  await db
    .update(schema.sites)
    .set({ ...siteUpdate, updatedAt: new Date() })
    .where(eq(schema.sites.id, site.id));
  invalidate(`catalog:${catalogKey}`);
  invalidateAll();
  revalidatePath("/panel", "layout");
  return { ok: true, messages };
}

/** Özelleştir sayfasındaki merkez kartlar için özet sayılar. */
export async function hubCounts(siteId: number) {
  const { site } = await ownedSite(siteId);
  const catalogKey = merchantCatalogKey(site.merchantId);
  const [products, outOfStock, coupons, pages, posts] = await Promise.all([
    countWhere(eq(schema.products.catalogKey, catalogKey)),
    countWhere(and(eq(schema.products.catalogKey, catalogKey), eq(schema.products.active, true), sql`${stockExpr} = 0`)!),
    db.$count(schema.coupons, and(eq(schema.coupons.merchantId, site.merchantId), eq(schema.coupons.active, true), sql`(${schema.coupons.siteId} = ${site.id} or ${schema.coupons.siteId} is null)`)),
    db.$count(schema.sitePages, eq(schema.sitePages.siteId, site.id)),
    db.$count(schema.blogPosts, eq(schema.blogPosts.siteId, site.id)),
  ]);
  return { products, outOfStock, coupons, pages, posts };
}
