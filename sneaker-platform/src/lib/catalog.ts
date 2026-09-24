import "server-only";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Product } from "@/db/schema";
import { cached } from "@/lib/cache";
import type { SiteContext } from "@/lib/site";
import {
  BRAND_BY_SLUG,
  CATEGORIES,
  CATEGORY_BY_KEY,
  COLOR_FAMILIES,
  GENDERS,
  GENDER_LABEL,
  PRODUCT_TYPES,
  brandSlug,
  colorFamilyOf,
  normalizeSearch,
  slugify,
  sortSizes,
  type Gender,
} from "@/lib/taxonomy";

export type CatalogProduct = Product & {
  brandSlug: string;
  seriesSlug: string;
  colorFamily: string;
  inStock: boolean;
  sizes: string[];
  searchText: string;
  override: {
    title: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
    description: string | null;
  } | null;
};

async function loadCatalogRaw(catalogKey: string): Promise<Product[]> {
  return cached(`catalog:${catalogKey}`, 60_000, () =>
    db.select().from(schema.products).where(and(eq(schema.products.catalogKey, catalogKey), eq(schema.products.active, true))),
  );
}

async function loadOverrides(siteId: number) {
  return cached(`overrides:${siteId}`, 60_000, () =>
    db.select().from(schema.productSiteOverrides).where(eq(schema.productSiteOverrides.siteId, siteId)),
  );
}

function adjust(price: number, pct: number) {
  if (!pct) return price;
  // 9'la biten psikolojik fiyat
  const tl = Math.round((price / 100) * (1 + pct / 100));
  return (Math.round(tl / 10) * 10 - 1) * 100;
}

export async function getCatalog(site: SiteContext): Promise<CatalogProduct[]> {
  const [raw, overrides] = await Promise.all([loadCatalogRaw(site.catalogKey), loadOverrides(site.id)]);
  const ov = new Map(overrides.map((o) => [o.productId, o]));
  const pct = site.settings.priceAdjustPercent;
  const out: CatalogProduct[] = [];
  for (const p of raw) {
    const o = ov.get(p.id);
    if (o?.hidden) continue;
    const sizes = sortSizes(p.variants.map((v) => v.size));
    out.push({
      ...p,
      price: adjust(p.price, pct),
      compareAtPrice: p.compareAtPrice ? adjust(p.compareAtPrice, pct) : null,
      brandSlug: brandSlug(p.brand),
      seriesSlug: slugify(`${p.brand} ${p.model}`),
      colorFamily: colorFamilyOf(p.colorName),
      inStock: p.variants.some((v) => v.stock > 0),
      sizes,
      searchText: normalizeSearch(`${p.title} ${p.brand} ${p.model} ${p.colorName} ${GENDER_LABEL[p.gender]} ${CATEGORY_BY_KEY[p.category]?.label ?? ""}`),
      override: o ? { title: o.title, metaTitle: o.metaTitle, metaDescription: o.metaDescription, description: o.description } : null,
    });
  }
  return out;
}

export async function getProductBySlug(site: SiteContext, slug: string) {
  const all = await getCatalog(site);
  return all.find((p) => p.slug === slug) ?? null;
}

/* ------------------------------------------------------------------ */
/* Koleksiyonlar                                                       */
/* ------------------------------------------------------------------ */

export type Crumb = { label: string; href: string };
export type CollectionDef = {
  key: string;
  slug: string;
  label: string;
  crumbs: Crumb[];
  gender?: Exclude<Gender, "unisex">;
  test: (p: CatalogProduct) => boolean;
};

const genderMatch = (g: Exclude<Gender, "unisex">) => (p: CatalogProduct) =>
  g === "cocuk" ? p.gender === "cocuk" : p.gender === g || p.gender === "unisex";

const onSale = (p: CatalogProduct) => Boolean(p.compareAtPrice && p.compareAtPrice > p.price);
const isNewP = (p: CatalogProduct) => p.isNew && !p.releaseDate;

function buildCollections(): CollectionDef[] {
  const list: CollectionDef[] = [];
  const home = { label: "Ana Sayfa", href: "/" };
  const specials: [string, string, (p: CatalogProduct) => boolean][] = [
    ["yeni-gelenler", "Yeni Gelenler", isNewP],
    ["cok-satanlar", "Çok Satanlar", (p) => p.isBestSeller],
    ["indirim", "İndirimli Ürünler", onSale],
    ["tum-urunler", "Tüm Ürünler", () => true],
  ];
  for (const [slug, label, test] of specials) list.push({ key: slug, slug, label, crumbs: [home, { label, href: `/${slug}` }], test });

  for (const [type, def] of Object.entries(PRODUCT_TYPES)) {
    list.push({ key: def.slug, slug: def.slug, label: def.label, crumbs: [home, { label: def.label, href: `/${def.slug}` }], test: (p) => p.productType === type });
  }
  for (const c of CATEGORIES) {
    list.push({
      key: c.slug,
      slug: c.slug,
      label: c.label,
      crumbs: [home, { label: PRODUCT_TYPES[c.type].label, href: `/${PRODUCT_TYPES[c.type].slug}` }, { label: c.label, href: `/${c.slug}` }],
      test: (p) => p.category === c.key,
    });
  }
  for (const [g, gd] of Object.entries(GENDERS) as [Exclude<Gender, "unisex">, { label: string; slug: string }][]) {
    const gm = genderMatch(g);
    const gCrumb = { label: gd.label, href: `/${gd.slug}` };
    list.push({ key: gd.slug, slug: gd.slug, label: gd.label, gender: g, crumbs: [home, gCrumb], test: gm });
    for (const [type, def] of Object.entries(PRODUCT_TYPES)) {
      const slug = `${gd.slug}-${def.slug}`;
      const label = `${gd.label} ${def.label}`;
      list.push({ key: slug, slug, label, gender: g, crumbs: [home, gCrumb, { label, href: `/${slug}` }], test: (p) => gm(p) && p.productType === type });
    }
    for (const c of CATEGORIES) {
      const slug = `${gd.slug}-${c.slug}`;
      const label = `${gd.label} ${c.label}`;
      list.push({
        key: slug,
        slug,
        label,
        gender: g,
        crumbs: [home, gCrumb, { label: `${gd.label} ${PRODUCT_TYPES[c.type].label}`, href: `/${gd.slug}-${PRODUCT_TYPES[c.type].slug}` }, { label, href: `/${slug}` }],
        test: (p) => gm(p) && p.category === c.key,
      });
    }
    for (const [slugPart, labelPart, test] of specials.slice(0, 3)) {
      const slug = `${gd.slug}-${slugPart}`;
      const label = `${gd.label} ${labelPart}`;
      list.push({ key: slug, slug, label, gender: g, crumbs: [home, gCrumb, { label, href: `/${slug}` }], test: (p) => gm(p) && test(p) });
    }
  }
  return list;
}

const COLLECTIONS = buildCollections();
const COLLECTION_BY_SLUG = new Map(COLLECTIONS.map((c) => [c.slug, c]));

export function getCollection(slug: string): CollectionDef | null {
  return COLLECTION_BY_SLUG.get(slug) ?? null;
}

export function allCollections(): CollectionDef[] {
  return COLLECTIONS;
}

export function brandCollection(brandSlugValue: string, gender?: Exclude<Gender, "unisex">): CollectionDef | null {
  const b = BRAND_BY_SLUG[brandSlugValue];
  const name = b?.name;
  if (!name) return null;
  const home = { label: "Ana Sayfa", href: "/" };
  const base: Crumb[] = [home, { label: "Markalar", href: "/markalar" }, { label: name, href: `/marka/${brandSlugValue}` }];
  if (!gender) return { key: `marka:${brandSlugValue}`, slug: brandSlugValue, label: name, crumbs: base, test: (p) => p.brandSlug === brandSlugValue };
  const gd = GENDERS[gender];
  return {
    key: `marka:${brandSlugValue}:${gender}`,
    slug: `${brandSlugValue}/${gd.slug}`,
    label: `${name} ${gd.label}`,
    gender,
    crumbs: [...base, { label: `${name} ${gd.label}`, href: `/marka/${brandSlugValue}/${gd.slug}` }],
    test: (p) => p.brandSlug === brandSlugValue && genderMatch(gender)(p),
  };
}

export function seriesCollection(all: CatalogProduct[], seriesSlug: string): CollectionDef | null {
  const sample = all.find((p) => p.seriesSlug === seriesSlug);
  if (!sample) return null;
  const label = `${sample.brand} ${sample.model}`;
  return {
    key: `seri:${seriesSlug}`,
    slug: seriesSlug,
    label,
    crumbs: [
      { label: "Ana Sayfa", href: "/" },
      { label: sample.brand, href: `/marka/${sample.brandSlug}` },
      { label, href: `/seri/${seriesSlug}` },
    ],
    test: (p) => p.seriesSlug === seriesSlug,
  };
}

/* ------------------------------------------------------------------ */
/* Filtreleme                                                          */
/* ------------------------------------------------------------------ */

export const SORTS = [
  { key: "onerilen", label: "Önerilen" },
  { key: "yeni", label: "En Yeniler" },
  { key: "cok-satan", label: "Çok Satanlar" },
  { key: "artan", label: "Fiyat: Artan" },
  { key: "azalan", label: "Fiyat: Azalan" },
  { key: "indirim", label: "İndirim Oranı" },
] as const;

export type ListingQuery = {
  marka: string[];
  beden: string[];
  renk: string[];
  cinsiyet: string[];
  kategori: string[];
  fiyat: string | null;
  indirim: boolean;
  stok: boolean;
  siralama: string;
  sayfa: number;
  q: string;
};

export const PAGE_SIZE = 24;

function arr(v: string | string[] | undefined): string[] {
  if (!v) return [];
  const s = Array.isArray(v) ? v.join(",") : v;
  return s.split(",").map((x) => x.trim()).filter(Boolean);
}

export function parseListingQuery(sp: Record<string, string | string[] | undefined>): ListingQuery {
  const one = (k: string) => (Array.isArray(sp[k]) ? (sp[k] as string[])[0] : (sp[k] as string | undefined));
  return {
    marka: arr(sp.marka),
    beden: arr(sp.beden),
    renk: arr(sp.renk),
    cinsiyet: arr(sp.cinsiyet),
    kategori: arr(sp.kategori),
    fiyat: one("fiyat") ?? null,
    indirim: one("indirim") === "1",
    stok: one("stok") === "1",
    siralama: one("siralama") ?? "onerilen",
    sayfa: Math.max(1, parseInt(one("sayfa") ?? "1", 10) || 1),
    q: (one("q") ?? "").trim(),
  };
}

/** Filtre veya sıralama içeren URL'ler index'e alınmaz (faceted navigation). */
export function hasFacetFilters(q: ListingQuery): boolean {
  return Boolean(q.marka.length || q.beden.length || q.renk.length || q.cinsiyet.length || q.kategori.length || q.fiyat || q.indirim || q.stok || q.siralama !== "onerilen");
}

type Dim = "marka" | "beden" | "renk" | "cinsiyet" | "kategori" | "fiyat" | "indirim" | "stok";

function passes(p: CatalogProduct, q: ListingQuery, skip?: Dim): boolean {
  if (skip !== "marka" && q.marka.length && !q.marka.includes(p.brandSlug)) return false;
  if (skip !== "beden" && q.beden.length && !p.variants.some((v) => v.stock > 0 && q.beden.includes(v.size))) return false;
  if (skip !== "renk" && q.renk.length && !q.renk.includes(p.colorFamily)) return false;
  if (skip !== "cinsiyet" && q.cinsiyet.length && !q.cinsiyet.some((g) => (g === "cocuk" ? p.gender === "cocuk" : p.gender === g || p.gender === "unisex"))) return false;
  if (skip !== "kategori" && q.kategori.length && !q.kategori.includes(CATEGORY_BY_KEY[p.category]?.slug ?? "")) return false;
  if (skip !== "fiyat" && q.fiyat) {
    const [min, max] = q.fiyat.split("-").map((x) => (x ? parseInt(x, 10) * 100 : NaN));
    if (!Number.isNaN(min) && p.price < min) return false;
    if (!Number.isNaN(max) && p.price > max) return false;
  }
  if (skip !== "indirim" && q.indirim && !onSale(p)) return false;
  if (skip !== "stok" && q.stok && !p.inStock) return false;
  if (q.q) {
    const terms = normalizeSearch(q.q).split(" ").filter(Boolean);
    if (!terms.every((t) => p.searchText.includes(t))) return false;
  }
  return true;
}

function sortProducts(list: CatalogProduct[], sort: string): CatalogProduct[] {
  const a = [...list];
  switch (sort) {
    case "yeni":
      return a.sort((x, y) => Number(y.isNew) - Number(x.isNew) || +new Date(y.createdAt) - +new Date(x.createdAt) || y.id - x.id);
    case "cok-satan":
      return a.sort((x, y) => Number(y.isBestSeller) - Number(x.isBestSeller) || y.popularity - x.popularity);
    case "artan":
      return a.sort((x, y) => x.price - y.price);
    case "azalan":
      return a.sort((x, y) => y.price - x.price);
    case "indirim": {
      const d = (p: CatalogProduct) => (p.compareAtPrice ? (p.compareAtPrice - p.price) / p.compareAtPrice : 0);
      return a.sort((x, y) => d(y) - d(x));
    }
    default:
      return a.sort((x, y) => Number(y.inStock) - Number(x.inStock) || Number(y.isFeatured) - Number(x.isFeatured) || y.popularity - x.popularity);
  }
}

export type FacetOption = { value: string; label: string; count: number; hex?: string };
export type Facets = {
  marka: FacetOption[];
  beden: FacetOption[];
  renk: FacetOption[];
  cinsiyet: FacetOption[];
  kategori: FacetOption[];
  priceMin: number;
  priceMax: number;
  saleCount: number;
};

export type ListingResult = {
  items: CatalogProduct[];
  total: number;
  page: number;
  pageCount: number;
  facets: Facets;
  base: CatalogProduct[];
};

export function runListing(all: CatalogProduct[], collection: CollectionDef | null, q: ListingQuery): ListingResult {
  const base = all.filter((p) => !p.releaseDate || p.releaseDate < new Date()).filter((p) => (collection ? collection.test(p) : true));
  const filtered = sortProducts(base.filter((p) => passes(p, q)), q.siralama);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(q.sayfa, pageCount);

  const count = (dim: Dim, key: (p: CatalogProduct) => string[]) => {
    const m = new Map<string, number>();
    for (const p of base) if (passes(p, q, dim)) for (const k of key(p)) m.set(k, (m.get(k) ?? 0) + 1);
    return m;
  };
  const brandCounts = count("marka", (p) => [p.brandSlug]);
  const sizeCounts = count("beden", (p) => p.variants.filter((v) => v.stock > 0).map((v) => v.size));
  const colorCounts = count("renk", (p) => [p.colorFamily]);
  const genderCounts = count("cinsiyet", (p) => (p.gender === "unisex" ? ["erkek", "kadin"] : [p.gender]));
  const catCounts = count("kategori", (p) => [CATEGORY_BY_KEY[p.category]?.slug ?? ""]);

  const brandNames = new Map(base.map((p) => [p.brandSlug, p.brand]));
  const prices = base.map((p) => p.price);

  return {
    items: filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    total: filtered.length,
    page,
    pageCount,
    base,
    facets: {
      marka: [...brandNames.entries()]
        .map(([value, label]) => ({ value, label, count: brandCounts.get(value) ?? 0 }))
        .sort((a, b) => a.label.localeCompare(b.label, "tr")),
      beden: sortSizes([...new Set(base.flatMap((p) => p.variants.map((v) => v.size)))]).map((s) => ({ value: s, label: s, count: sizeCounts.get(s) ?? 0 })),
      renk: COLOR_FAMILIES.filter((c) => base.some((p) => p.colorFamily === c.key)).map((c) => ({ value: c.key, label: c.label, hex: c.hex, count: colorCounts.get(c.key) ?? 0 })),
      cinsiyet: (["erkek", "kadin", "cocuk"] as const)
        .filter((g) => base.some((p) => (g === "cocuk" ? p.gender === "cocuk" : p.gender === g || p.gender === "unisex")))
        .map((g) => ({ value: g, label: GENDER_LABEL[g], count: genderCounts.get(g) ?? 0 })),
      kategori: CATEGORIES.filter((c) => base.some((p) => p.category === c.key)).map((c) => ({ value: c.slug, label: c.label, count: catCounts.get(c.slug) ?? 0 })),
      priceMin: prices.length ? Math.min(...prices) : 0,
      priceMax: prices.length ? Math.max(...prices) : 0,
      saleCount: base.filter(onSale).length,
    },
  };
}

export function listingFacts(label: string, base: CatalogProduct[]) {
  const brandCount = new Map<string, number>();
  const modelCount = new Map<string, number>();
  for (const p of base) {
    brandCount.set(p.brand, (brandCount.get(p.brand) ?? 0) + 1);
    modelCount.set(`${p.brand} ${p.model}`, (modelCount.get(`${p.brand} ${p.model}`) ?? 0) + p.popularity);
  }
  const prices = base.map((p) => p.price);
  return {
    label,
    count: base.length,
    minPrice: prices.length ? Math.min(...prices) : 0,
    maxPrice: prices.length ? Math.max(...prices) : 0,
    topBrands: [...brandCount.entries()].sort((a, b) => b[1] - a[1]).map(([b]) => b),
    topModels: [...modelCount.entries()].sort((a, b) => b[1] - a[1]).map(([m]) => m),
  };
}

/* ------------------------------------------------------------------ */
/* Ana sayfa ve öneri yardımcıları                                    */
/* ------------------------------------------------------------------ */

export function pickHome(all: CatalogProduct[]) {
  const live = all.filter((p) => !p.releaseDate || p.releaseDate < new Date());
  const byPop = [...live].sort((a, b) => b.popularity - a.popularity);
  const uniqueSeries = (list: CatalogProduct[], n: number) => {
    const seen = new Set<string>();
    const out: CatalogProduct[] = [];
    for (const p of list) {
      const k = `${p.seriesSlug}:${p.gender}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(p);
      if (out.length >= n) break;
    }
    return out;
  };
  return {
    featured: uniqueSeries(byPop.filter((p) => p.isFeatured), 12),
    newArrivals: uniqueSeries(byPop.filter(isNewP), 16),
    bestSellers: uniqueSeries(byPop.filter((p) => p.isBestSeller), 16),
    sale: uniqueSeries(byPop.filter(onSale), 16),
    upcoming: all.filter((p) => p.releaseDate && p.releaseDate > new Date()).sort((a, b) => +a.releaseDate! - +b.releaseDate!),
    byGender: (g: Exclude<Gender, "unisex">) => uniqueSeries(byPop.filter(genderMatch(g)).filter((p) => p.productType === "ayakkabi"), 12),
    byCategory: (key: string) => uniqueSeries(byPop.filter((p) => p.category === key), 12),
  };
}

export function relatedProducts(all: CatalogProduct[], p: CatalogProduct, n = 12): CatalogProduct[] {
  const score = (x: CatalogProduct) =>
    (x.category === p.category ? 3 : 0) + (x.brand === p.brand ? 2 : 0) + (x.gender === p.gender ? 2 : 0) + (x.seriesSlug === p.seriesSlug ? -4 : 0) + x.popularity / 2000;
  return all
    .filter((x) => x.id !== p.id && (!x.releaseDate || x.releaseDate < new Date()))
    .sort((a, b) => score(b) - score(a))
    .slice(0, n);
}

export function colorSiblings(all: CatalogProduct[], p: CatalogProduct): CatalogProduct[] {
  return all.filter((x) => x.seriesSlug === p.seriesSlug && x.gender === p.gender);
}

export function allBrandsInCatalog(all: CatalogProduct[]) {
  const m = new Map<string, { name: string; slug: string; count: number }>();
  for (const p of all) {
    const e = m.get(p.brandSlug) ?? { name: p.brand, slug: p.brandSlug, count: 0 };
    e.count++;
    m.set(p.brandSlug, e);
  }
  return [...m.values()].sort((a, b) => b.count - a.count);
}

export function allSeries(all: CatalogProduct[]) {
  const m = new Map<string, { label: string; slug: string; brand: string; count: number; image: string }>();
  for (const p of all) {
    const e = m.get(p.seriesSlug) ?? { label: `${p.brand} ${p.model}`, slug: p.seriesSlug, brand: p.brand, count: 0, image: p.images[0]?.url ?? "" };
    e.count++;
    m.set(p.seriesSlug, e);
  }
  return [...m.values()];
}

export { onSale, genderMatch };
