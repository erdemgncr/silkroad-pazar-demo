import "server-only";
import { eq } from "drizzle-orm";
import { cache as reactCache } from "react";
import { db, schema } from "@/db";
import { cached } from "@/lib/cache";
import { parseSettings, type SiteSettings } from "@/lib/site-settings";
import type { ThemeKey } from "@/themes/registry";

export type SiteContext = {
  id: number;
  slug: string;
  name: string;
  theme: ThemeKey;
  status: "active" | "draft" | "maintenance";
  merchantId: number;
  catalogKey: string;
  paymentMode: "module" | "hosted" | "demo";
  shopierAccountId: number | null;
  shopierWebsiteIndex: number | null;
  settings: SiteSettings;
  /** Kanonik adres (https://alanadi.com), sonda eğik çizgi yok. */
  baseUrl: string;
  primaryHost: string;
  /** İsteğin geldiği host (önizlemede "_preview.{slug}"). */
  requestHost: string;
  isPreview: boolean;
  shopierConnected: boolean;
};

export const PREVIEW_PREFIX = "_preview.";

export function rootDomain(): string {
  return (process.env.ROOT_DOMAIN ?? "localhost:3000").toLowerCase();
}

function protocolFor(host: string): string {
  return host.includes("localhost") || host.startsWith("127.") ? "http" : "https";
}

type SiteRow = typeof schema.sites.$inferSelect & { domains: { hostname: string; isPrimary: boolean }[] };

async function loadAllSites(): Promise<SiteRow[]> {
  return cached("sites:all", 30_000, async () => {
    const rows = await db.query.sites.findMany();
    const domains = await db.select().from(schema.siteDomains);
    return rows.map((s) => ({
      ...s,
      domains: domains.filter((d) => d.siteId === s.id).map((d) => ({ hostname: d.hostname, isPrimary: d.isPrimary })),
    }));
  });
}

function toContext(row: SiteRow, requestHost: string, isPreview: boolean): SiteContext {
  const primary = row.domains.find((d) => d.isPrimary)?.hostname ?? row.domains[0]?.hostname ?? `${row.slug}.${rootDomain()}`;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    theme: row.theme,
    status: row.status,
    merchantId: row.merchantId,
    catalogKey: `m:${row.merchantId}`,
    paymentMode: row.paymentMode,
    shopierAccountId: row.shopierAccountId,
    shopierWebsiteIndex: row.shopierWebsiteIndex,
    settings: parseSettings(row.settings),
    baseUrl: `${protocolFor(primary)}://${primary}`,
    primaryHost: primary,
    requestHost,
    isPreview,
    shopierConnected: Boolean(row.shopierAccountId && row.shopierWebsiteIndex),
  };
}

/** Host (ya da önizleme anahtarı) üzerinden siteyi bulur. */
export const resolveSite = reactCache(async (rawKey: string): Promise<SiteContext | null> => {
  const key = decodeURIComponent(rawKey).toLowerCase();
  const all = await loadAllSites();
  if (key.startsWith(PREVIEW_PREFIX)) {
    const slug = key.slice(PREVIEW_PREFIX.length);
    const row = all.find((s) => s.slug === slug);
    return row ? toContext(row, key, true) : null;
  }
  const host = key.replace(/\.$/, "");
  const byDomain = all.find((s) => s.domains.some((d) => d.hostname === host || `www.${d.hostname}` === host));
  if (byDomain) return toContext(byDomain, host, false);
  const root = rootDomain();
  if (host.endsWith(`.${root}`)) {
    const slug = host.slice(0, -(root.length + 1));
    const row = all.find((s) => s.slug === slug);
    if (row) return toContext(row, host, false);
  }
  return null;
});

export async function getSiteById(id: number) {
  const row = await db.query.sites.findFirst({ where: eq(schema.sites.id, id) });
  return row ?? null;
}

/** Vitrin içinde kullanılan kök yol: önizlemede de linkler "/" ile başlar. */
export function siteHref(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}
