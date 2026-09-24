import "server-only";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { cache } from "react";
import { db, schema } from "@/db";
import { getAdminSession } from "@/lib/auth";

export type PanelContext = {
  user: typeof schema.adminUsers.$inferSelect;
  merchant: typeof schema.merchants.$inferSelect | null;
  /** Platform (süper admin) personeli mi? */
  isPlatform: boolean;
};

/** Panel sayfalarında oturumu doğrular; yoksa giriş sayfasına yönlendirir. */
export const requirePanel = cache(async (): Promise<PanelContext> => {
  const s = await getAdminSession();
  if (!s) redirect("/panel/giris");
  const user = await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.id, s.uid) });
  if (!user) redirect("/panel/giris");
  const merchant = user.merchantId ? ((await db.query.merchants.findFirst({ where: eq(schema.merchants.id, user.merchantId) })) ?? null) : null;
  return { user, merchant, isPlatform: !user.merchantId };
});

export async function requirePlatform() {
  const ctx = await requirePanel();
  if (!ctx.isPlatform) redirect("/panel");
  return ctx;
}

/** Satıcı işlemleri için: platform yöneticisi ise ?satici= ile seçilen satıcı adına işlem yapabilir. */
export async function requireMerchant(): Promise<PanelContext & { merchant: NonNullable<PanelContext["merchant"]> }> {
  const ctx = await requirePanel();
  if (ctx.merchant) return ctx as PanelContext & { merchant: NonNullable<PanelContext["merchant"]> };
  // Platform yöneticisi: ilk satıcıyı (demo) bağlam olarak kullan.
  const m = await db.query.merchants.findFirst();
  if (!m) redirect("/panel/saticilar");
  return { ...ctx, merchant: m };
}

export function siteUrl(slug: string, domains: { hostname: string; isPrimary: boolean }[] = []) {
  const primary = domains.find((d) => d.isPrimary)?.hostname ?? domains[0]?.hostname;
  const host = primary ?? `${slug}.${process.env.ROOT_DOMAIN ?? "localhost:3000"}`;
  const proto = host.includes("localhost") ? "http" : "https";
  return `${proto}://${host}`;
}
