import "server-only";
import { notFound } from "next/navigation";
import { resolveSite, type SiteContext } from "@/lib/site";
import { getCatalog, type CatalogProduct } from "@/lib/catalog";

/** Sayfalarda siteyi ve kataloğu yükler; site yoksa 404. */
export async function requireSite(params: Promise<{ site: string }>): Promise<SiteContext> {
  const { site: key } = await params;
  const site = await resolveSite(key);
  if (!site) notFound();
  return site;
}

export async function requireSiteWithCatalog(params: Promise<{ site: string }>): Promise<{ site: SiteContext; all: CatalogProduct[] }> {
  const site = await requireSite(params);
  const all = await getCatalog(site);
  return { site, all };
}

/** Önizleme ya da yayında olmayan sitelerde index kapatılır. */
export function indexable(site: SiteContext): boolean {
  return site.status === "active" && !site.isPreview;
}
