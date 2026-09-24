import "server-only";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
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

export const PANEL_MERCHANT_COOKIE = "panel_merchant";

/** Panel sayfalarında oturumu doğrular; yoksa giriş sayfasına yönlendirir. */
export const requirePanel = cache(async (): Promise<PanelContext> => {
  const s = await getAdminSession();
  if (!s) redirect("/panel/giris");
  const user = await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.id, s.uid) });
  if (!user) redirect("/panel/giris");
  const merchant = user.merchantId ? ((await db.query.merchants.findFirst({ where: eq(schema.merchants.id, user.merchantId) })) ?? null) : null;
  if (merchant?.status === "suspended") redirect("/panel/giris?askida=1");
  return { user, merchant, isPlatform: !user.merchantId };
});

export async function requirePlatform() {
  const ctx = await requirePanel();
  if (!ctx.isPlatform) redirect("/panel");
  return ctx;
}

/** Satıcı kapsamı gerektiren işlemler (ürün, Shopier, kupon…) için satıcıyı döndürür.
 *  Platform yöneticisi üst bardaki "Satıcı" seçiciyle hangi satıcı adına çalıştığını belirler. */
export const requireMerchant = cache(async (): Promise<PanelContext & { merchant: NonNullable<PanelContext["merchant"]> }> => {
  const ctx = await requirePanel();
  if (ctx.merchant) return ctx as PanelContext & { merchant: NonNullable<PanelContext["merchant"]> };
  const chosen = Number((await cookies()).get(PANEL_MERCHANT_COOKIE)?.value ?? 0);
  const m = (chosen ? await db.query.merchants.findFirst({ where: eq(schema.merchants.id, chosen) }) : null) ?? (await db.query.merchants.findFirst({ orderBy: (t, { asc }) => asc(t.id) }));
  if (!m) redirect("/panel/saticilar");
  return { ...ctx, merchant: m };
});

/** Platform yöneticisinin seçili satıcı kimliği (satıcı kullanıcılar için kendi kimliği). */
export async function selectedMerchantId(ctx: PanelContext): Promise<number | null> {
  if (ctx.merchant) return ctx.merchant.id;
  const chosen = Number((await cookies()).get(PANEL_MERCHANT_COOKIE)?.value ?? 0);
  return chosen || null;
}

export function canManageTeam(ctx: PanelContext) {
  return ctx.isPlatform || ctx.user.role === "merchant_owner";
}

export function siteUrl(slug: string, domains: { hostname: string; isPrimary: boolean }[] = []) {
  const primary = domains.find((d) => d.isPrimary)?.hostname ?? domains[0]?.hostname;
  const host = primary ?? `${slug}.${process.env.ROOT_DOMAIN ?? "localhost:3000"}`;
  const proto = host.includes("localhost") ? "http" : "https";
  return `${proto}://${host}`;
}
