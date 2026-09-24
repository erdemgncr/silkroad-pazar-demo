"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireMerchant, requirePanel } from "@/lib/panel";
import { createSite, normalizeHostname } from "@/lib/site-factory";
import { invalidate, invalidateAll } from "@/lib/cache";
import { isThemeKey, THEMES } from "@/themes/registry";
import { slugify } from "@/lib/taxonomy";
import { siteSettingsSchema } from "@/lib/site-settings";

export type FormState = { ok?: boolean; error?: string; message?: string } | null;

async function ownedSite(siteId: number) {
  const ctx = await requirePanel();
  const site = await db.query.sites.findFirst({ where: eq(schema.sites.id, siteId) });
  if (!site || (!ctx.isPlatform && site.merchantId !== ctx.merchant?.id)) throw new Error("Site bulunamadı");
  return { ctx, site };
}

const RESERVED = new Set(["www", "panel", "api", "admin", "app", "static", "mail", "shop"]);

export async function createSiteAction(_: FormState, form: FormData): Promise<FormState> {
  const ctx = await requireMerchant();
  const name = String(form.get("name") ?? "").trim();
  const theme = String(form.get("theme") ?? "");
  const slug = slugify(String(form.get("slug") ?? "") || name);
  const domain = normalizeHostname(String(form.get("domain") ?? ""));
  const city = String(form.get("city") ?? "").trim();
  if (name.length < 2) return { error: "Site adı en az 2 karakter olmalı." };
  if (!isThemeKey(theme)) return { error: "Bir tema seçin." };
  if (!slug || slug.length < 3 || RESERVED.has(slug)) return { error: "Geçerli bir site adresi (en az 3 karakter) girin." };
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.sites).where(eq(schema.sites.merchantId, ctx.merchant.id));
  if (!ctx.isPlatform && n >= ctx.merchant.siteLimit) return { error: `Paketiniz en fazla ${ctx.merchant.siteLimit} site içeriyor. Daha fazla site için paketinizi yükseltin.` };
  if (await db.query.sites.findFirst({ where: eq(schema.sites.slug, slug) })) return { error: "Bu site adresi kullanılıyor, başka bir adres deneyin." };
  if (domain && (await db.query.siteDomains.findFirst({ where: eq(schema.siteDomains.hostname, domain) }))) return { error: "Bu alan adı başka bir siteye bağlı." };
  const site = await createSite({ merchantId: ctx.merchant.id, name, slug, theme, status: "draft", domains: domain ? [domain] : [], city: city || undefined });
  invalidate("sites:");
  redirect(`/panel/siteler/${site.id}?yeni=1`);
}

const generalSchema = z.object({
  name: z.string().trim().min(2),
  status: z.enum(["active", "draft", "maintenance"]),
  theme: z.string().refine(isThemeKey),
});

export async function updateSiteGeneral(siteId: number, _: FormState, form: FormData): Promise<FormState> {
  const { site } = await ownedSite(siteId);
  const parsed = generalSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Bilgileri kontrol edin." };
  await db
    .update(schema.sites)
    .set({ name: parsed.data.name, status: parsed.data.status, theme: parsed.data.theme as keyof typeof THEMES, updatedAt: new Date() })
    .where(eq(schema.sites.id, site.id));
  invalidateAll();
  revalidatePath(`/panel/siteler/${site.id}`);
  return { ok: true, message: "Kaydedildi." };
}

/** Site ayarlarının (JSON) bir bölümünü günceller. Form alanları "a.b.c" yolunu kullanır. */
export async function updateSiteSettings(siteId: number, _: FormState, form: FormData): Promise<FormState> {
  const { site } = await ownedSite(siteId);
  const current = JSON.parse(JSON.stringify(site.settings)) as Record<string, unknown>;
  for (const [key, raw] of form.entries()) {
    if (key.startsWith("$")) continue;
    const path = key.split(".");
    let obj = current as Record<string, unknown>;
    for (let i = 0; i < path.length - 1; i++) {
      obj[path[i]] = (obj[path[i]] as Record<string, unknown>) ?? {};
      obj = obj[path[i]] as Record<string, unknown>;
    }
    const leaf = path[path.length - 1];
    const v = String(raw);
    const kind = form.get(`$type.${key}`);
    if (kind === "number") obj[leaf] = Number(v || 0);
    else if (kind === "lines") obj[leaf] = v.split("\n").map((x) => x.trim()).filter(Boolean);
    else if (kind === "csv") obj[leaf] = v.split(",").map((x) => x.trim()).filter(Boolean);
    else if (kind === "json") {
      try {
        obj[leaf] = JSON.parse(v);
      } catch {
        return { error: `${key} alanı geçerli değil.` };
      }
    } else obj[leaf] = v;
  }
  // İşaretlenmeyen onay kutuları FormData'da gelmez; "$bool.alan" ile bildirilir.
  for (const [key] of form.entries()) {
    if (!key.startsWith("$bool.")) continue;
    const path = key.slice(6).split(".");
    let obj = current as Record<string, unknown>;
    for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]] as Record<string, unknown>;
    obj[path[path.length - 1]] = form.get(key.slice(6)) === "on";
  }
  const parsed = siteSettingsSchema.safeParse(current);
  if (!parsed.success) return { error: `Geçersiz değer: ${parsed.error.issues[0]?.path.join(".")} ${parsed.error.issues[0]?.message}` };
  await db.update(schema.sites).set({ settings: parsed.data, updatedAt: new Date() }).where(eq(schema.sites.id, site.id));
  invalidateAll();
  revalidatePath(`/panel/siteler/${site.id}`);
  return { ok: true, message: "Kaydedildi." };
}

export async function addDomain(siteId: number, _: FormState, form: FormData): Promise<FormState> {
  const { site } = await ownedSite(siteId);
  const host = normalizeHostname(String(form.get("hostname") ?? ""));
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?$/.test(host)) return { error: "Geçerli bir alan adı girin (örn. magazam.com)." };
  if (await db.query.siteDomains.findFirst({ where: eq(schema.siteDomains.hostname, host) })) return { error: "Bu alan adı zaten kullanılıyor." };
  const existing = await db.select().from(schema.siteDomains).where(eq(schema.siteDomains.siteId, site.id));
  await db.insert(schema.siteDomains).values({ siteId: site.id, hostname: host, isPrimary: existing.length === 0 });
  invalidateAll();
  revalidatePath(`/panel/siteler/${site.id}`);
  return { ok: true, message: `${host} eklendi. DNS kaydını yönlendirmeyi unutmayın.` };
}

export async function removeDomain(siteId: number, domainId: number) {
  const { site } = await ownedSite(siteId);
  await db.delete(schema.siteDomains).where(and(eq(schema.siteDomains.id, domainId), eq(schema.siteDomains.siteId, site.id)));
  const rest = await db.select().from(schema.siteDomains).where(eq(schema.siteDomains.siteId, site.id));
  if (rest.length && !rest.some((d) => d.isPrimary)) await db.update(schema.siteDomains).set({ isPrimary: true }).where(eq(schema.siteDomains.id, rest[0].id));
  invalidateAll();
  revalidatePath(`/panel/siteler/${site.id}`);
}

export async function makePrimaryDomain(siteId: number, domainId: number) {
  const { site } = await ownedSite(siteId);
  await db.update(schema.siteDomains).set({ isPrimary: false }).where(and(eq(schema.siteDomains.siteId, site.id), ne(schema.siteDomains.id, domainId)));
  await db.update(schema.siteDomains).set({ isPrimary: true }).where(and(eq(schema.siteDomains.id, domainId), eq(schema.siteDomains.siteId, site.id)));
  invalidateAll();
  revalidatePath(`/panel/siteler/${site.id}`);
}

export async function updateSitePayment(siteId: number, _: FormState, form: FormData): Promise<FormState> {
  const { site, ctx } = await ownedSite(siteId);
  const mode = String(form.get("paymentMode"));
  const accountId = Number(form.get("shopierAccountId") || 0) || null;
  const idx = Number(form.get("shopierWebsiteIndex") || 0) || null;
  if (!["module", "hosted", "demo"].includes(mode)) return { error: "Ödeme modu seçin." };
  if (accountId) {
    const acc = await db.query.shopierAccounts.findFirst({ where: eq(schema.shopierAccounts.id, accountId) });
    if (!acc || (!ctx.isPlatform && acc.merchantId !== site.merchantId)) return { error: "Shopier hesabı bulunamadı." };
    if (idx) {
      const clash = await db.query.sites.findFirst({
        where: and(eq(schema.sites.shopierAccountId, accountId), eq(schema.sites.shopierWebsiteIndex, idx), ne(schema.sites.id, site.id)),
      });
      if (clash) return { error: `Website index ${idx} bu Shopier hesabında "${clash.name}" sitesine atanmış. Boş bir index seçin (her hesapta en fazla 5 site).` };
    }
  }
  if (mode === "module" && (!accountId || !idx)) return { error: "Shopier Ödeme Modülü için hesap ve website index (1-5) seçilmeli." };
  await db.update(schema.sites).set({ paymentMode: mode as "module" | "hosted" | "demo", shopierAccountId: accountId, shopierWebsiteIndex: idx, updatedAt: new Date() }).where(eq(schema.sites.id, site.id));
  invalidateAll();
  revalidatePath(`/panel/siteler/${site.id}`);
  return { ok: true, message: "Ödeme ayarları kaydedildi." };
}

export async function duplicateSite(siteId: number) {
  const { site, ctx } = await ownedSite(siteId);
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.sites).where(eq(schema.sites.merchantId, site.merchantId));
  const merchant = await db.query.merchants.findFirst({ where: eq(schema.merchants.id, site.merchantId) });
  if (!ctx.isPlatform && merchant && n >= merchant.siteLimit) throw new Error("Site limitine ulaşıldı");
  let slug = `${site.slug}-kopya`;
  for (let i = 2; await db.query.sites.findFirst({ where: eq(schema.sites.slug, slug) }); i++) slug = `${site.slug}-kopya-${i}`;
  const copy = await createSite({ merchantId: site.merchantId, name: `${site.name} (Kopya)`, slug, theme: site.theme, status: "draft" });
  const settings = { ...site.settings, seo: { ...site.settings.seo, seed: Math.floor(Math.random() * 100000), googleVerification: "", yandexVerification: "", bingVerification: "", gaId: "", gtmId: "", metaPixelId: "" } };
  await db.update(schema.sites).set({ settings }).where(eq(schema.sites.id, copy.id));
  invalidateAll();
  redirect(`/panel/siteler/${copy.id}`);
}

export async function deleteSite(siteId: number, _: FormState, form: FormData): Promise<FormState> {
  const { site } = await ownedSite(siteId);
  if (String(form.get("confirm") ?? "") !== site.slug) return { error: `Onay için "${site.slug}" yazın.` };
  await db.delete(schema.sites).where(eq(schema.sites.id, site.id));
  invalidateAll();
  redirect("/panel/siteler");
}
