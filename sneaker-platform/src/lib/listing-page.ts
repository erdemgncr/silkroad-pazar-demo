import "server-only";
import type { Metadata } from "next";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { cached } from "@/lib/cache";
import type { SiteContext } from "@/lib/site";
import { allCollections, getCollection, hasFacetFilters, type CatalogProduct, type CollectionDef, type ListingQuery, type ListingResult } from "@/lib/catalog";
import type { ListingCopy } from "@/lib/seo/copy";
import { CATEGORIES, GENDERS, PRODUCT_TYPES } from "@/lib/taxonomy";
import { indexable } from "@/lib/store-context";

export async function collectionOverride(siteId: number, key: string) {
  return cached(`colseo:${siteId}:${key}`, 60_000, async () => {
    const row = await db.query.collectionSeo.findFirst({ where: and(eq(schema.collectionSeo.siteId, siteId), eq(schema.collectionSeo.key, key)) });
    return row ?? null;
  });
}

export function listingMetadata(site: SiteContext, copy: ListingCopy, basePath: string, query: ListingQuery, result: ListingResult): Metadata {
  const filtered = hasFacetFilters(query) || Boolean(query.q);
  const canonical = result.page > 1 && !filtered ? `${basePath}?sayfa=${result.page}` : basePath;
  const title = result.page > 1 ? `${copy.metaTitle} - Sayfa ${result.page}` : copy.metaTitle;
  const image = result.items[0]?.images[0]?.url;
  return {
    title,
    description: copy.metaDescription,
    alternates: { canonical },
    robots: !indexable(site) || filtered || result.total === 0 ? { index: false, follow: true } : undefined,
    openGraph: { title, description: copy.metaDescription, url: canonical, images: image ? [{ url: image, width: 900, height: 900, alt: copy.h1 }] : undefined },
  };
}

/** Kategori sayfasının üstündeki hızlı bağlantılar (iç linkleme için de önemli). */
export function quickLinksFor(c: CollectionDef, all: CatalogProduct[]) {
  const has = (slug: string) => {
    const col = getCollection(slug);
    return col ? all.some(col.test) : false;
  };
  const make = (slugs: string[]) =>
    slugs
      .filter(has)
      .map((s) => ({ label: getCollection(s)!.label, href: `/${s}`, active: s === c.slug }));
  const g = Object.values(GENDERS).find((x) => c.slug === x.slug || c.slug.startsWith(`${x.slug}-`));
  if (g) {
    const rest = c.slug === g.slug ? "" : c.slug.slice(g.slug.length + 1);
    const type = Object.values(PRODUCT_TYPES).find((t) => t.slug === rest);
    const cat = CATEGORIES.find((x) => x.slug === rest);
    if (!rest) return make([...CATEGORIES.map((x) => `${g.slug}-${x.slug}`), `${g.slug}-yeni-gelenler`, `${g.slug}-indirim`]);
    if (type) {
      const key = Object.entries(PRODUCT_TYPES).find(([, v]) => v.slug === rest)![0];
      return make(CATEGORIES.filter((x) => x.type === key).map((x) => `${g.slug}-${x.slug}`));
    }
    if (cat) return make(CATEGORIES.filter((x) => x.type === cat.type).map((x) => `${g.slug}-${x.slug}`));
    return make(["yeni-gelenler", "cok-satanlar", "indirim"].map((s) => `${g.slug}-${s}`));
  }
  const type = Object.entries(PRODUCT_TYPES).find(([, v]) => v.slug === c.slug);
  if (type) return make(CATEGORIES.filter((x) => x.type === type[0]).map((x) => x.slug));
  const cat = CATEGORIES.find((x) => x.slug === c.slug);
  if (cat) return make(Object.values(GENDERS).map((x) => `${x.slug}-${cat.slug}`));
  if (["yeni-gelenler", "cok-satanlar", "indirim"].includes(c.slug)) return make(Object.values(GENDERS).map((x) => `${x.slug}-${c.slug}`));
  return [];
}

/** Sitemap için ürünü olan koleksiyon yolları. */
export function nonEmptyCollections(all: CatalogProduct[]) {
  return allCollections().filter((c) => all.some(c.test));
}
