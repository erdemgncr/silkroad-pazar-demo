import "server-only";
import { createHash } from "crypto";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { SiteContext } from "@/lib/site";

export type PaymentConfig =
  | { mode: "module"; apiKey: string; apiSecret: string; websiteIndex: number; accountId: number }
  | { mode: "hosted"; shopSlug: string; accountId: number }
  | { mode: "demo"; apiSecret: string }
  | { mode: "invalid"; reason: string };

/** Demo ödemelerde imza için kullanılan gizli anahtar (sunucuya özel). */
export function demoSecret() {
  return createHash("sha256").update(`demo-payment:${process.env.AUTH_SECRET ?? "dev"}`).digest("hex");
}

export async function paymentConfig(site: SiteContext): Promise<PaymentConfig> {
  if (site.paymentMode === "demo") return { mode: "demo", apiSecret: demoSecret() };
  if (!site.shopierAccountId) return { mode: "invalid", reason: "Siteye Shopier hesabı bağlanmamış." };
  const acc = await db.query.shopierAccounts.findFirst({ where: eq(schema.shopierAccounts.id, site.shopierAccountId) });
  if (!acc) return { mode: "invalid", reason: "Shopier hesabı bulunamadı." };
  if (site.paymentMode === "hosted") {
    if (!acc.shopSlug) return { mode: "invalid", reason: "Shopier mağaza adı (slug) girilmemiş." };
    return { mode: "hosted", shopSlug: acc.shopSlug, accountId: acc.id };
  }
  if (!acc.apiKey || !acc.apiSecret) return { mode: "invalid", reason: "Shopier ödeme modülü API anahtarları girilmemiş." };
  if (!site.shopierWebsiteIndex) return { mode: "invalid", reason: "Site için Shopier website index (1-5) seçilmemiş." };
  return { mode: "module", apiKey: acc.apiKey, apiSecret: acc.apiSecret, websiteIndex: site.shopierWebsiteIndex, accountId: acc.id };
}

/** Callback doğrulamasında kullanılacak gizli anahtar. */
export async function callbackSecret(site: SiteContext): Promise<string | null> {
  const cfg = await paymentConfig(site);
  if (cfg.mode === "module" || cfg.mode === "demo") return cfg.apiSecret;
  return null;
}
