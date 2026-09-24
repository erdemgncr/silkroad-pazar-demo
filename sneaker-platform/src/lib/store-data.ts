import "server-only";
import type { CatalogProduct } from "@/lib/catalog";
import { allBrandsInCatalog, allSeries } from "@/lib/catalog";
import type { CardProduct, MenuItem, MenuColumn } from "@/lib/store-types";
import { CATEGORIES, CATEGORY_BY_KEY, GENDERS, PRODUCT_TYPES, type Gender } from "@/lib/taxonomy";

export function toCard(p: CatalogProduct, siblings?: number): CardProduct {
  const stockTotal = p.variants.reduce((a, v) => a + v.stock, 0);
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    brand: p.brand,
    model: p.model,
    colorName: p.colorName,
    colorHex: p.colorHex,
    gender: p.gender,
    categoryLabel: CATEGORY_BY_KEY[p.category]?.singular ?? "",
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    image: p.images[0]?.url ?? "",
    image2: p.images[1]?.url ?? p.images[0]?.url ?? "",
    imageAlt: p.images[0]?.alt ?? p.title,
    isNew: p.isNew,
    isBestSeller: p.isBestSeller,
    inStock: p.inStock,
    lowStock: p.inStock && stockTotal <= 4,
    sizes: p.variants.map((v) => ({ size: v.size, stock: v.stock })),
    colorCount: siblings ?? 1,
    releaseDate: p.releaseDate ? new Date(p.releaseDate).toISOString() : null,
  };
}

export function toCards(list: CatalogProduct[], all?: CatalogProduct[]): CardProduct[] {
  const counts = new Map<string, number>();
  for (const p of all ?? list) counts.set(`${p.seriesSlug}:${p.gender}`, (counts.get(`${p.seriesSlug}:${p.gender}`) ?? 0) + 1);
  return list.map((p) => toCard(p, counts.get(`${p.seriesSlug}:${p.gender}`)));
}

/** Katalogda ürünü olan kategorilerden mega menü üretir. */
export function buildMenu(all: CatalogProduct[]): MenuItem[] {
  const has = (test: (p: CatalogProduct) => boolean) => all.some(test);
  const brands = allBrandsInCatalog(all);
  const series = allSeries(all).sort((a, b) => b.count - a.count);

  const genderColumns = (g: Exclude<Gender, "unisex">): MenuColumn[] => {
    const gm = (p: CatalogProduct) => (g === "cocuk" ? p.gender === "cocuk" : p.gender === g || p.gender === "unisex");
    const gd = GENDERS[g];
    const cols: MenuColumn[] = [];
    for (const [type, td] of Object.entries(PRODUCT_TYPES)) {
      const links = CATEGORIES.filter((c) => c.type === type && has((p) => gm(p) && p.category === c.key)).map((c) => ({
        label: c.label,
        href: `/${gd.slug}-${c.slug}`,
      }));
      if (links.length) cols.push({ title: td.label, href: `/${gd.slug}-${td.slug}`, links: [{ label: `Tüm ${td.label}`, href: `/${gd.slug}-${td.slug}` }, ...links] });
    }
    cols.push({
      title: "Öne Çıkanlar",
      links: [
        { label: "Yeni Gelenler", href: `/${gd.slug}-yeni-gelenler` },
        { label: "Çok Satanlar", href: `/${gd.slug}-cok-satanlar` },
        { label: "İndirimli Ürünler", href: `/${gd.slug}-indirim` },
        { label: `Tüm ${gd.label} Ürünleri`, href: `/${gd.slug}` },
      ],
    });
    return cols;
  };

  const genderPromo = (g: Exclude<Gender, "unisex">) => {
    const p = all.find((x) => (g === "cocuk" ? x.gender === "cocuk" : x.gender === g) && x.isFeatured) ?? all.find((x) => x.gender === g);
    return p
      ? { title: `${GENDERS[g].label} Yeni Sezon`, subtitle: `${p.brand} ${p.model}`, href: `/${GENDERS[g].slug}-yeni-gelenler`, image: p.images[0]?.url ?? "" }
      : undefined;
  };

  const menu: MenuItem[] = [
    { label: "Yeni Gelenler", href: "/yeni-gelenler", tone: "new" },
    ...(["erkek", "kadin", "cocuk"] as const)
      .filter((g) => has((p) => (g === "cocuk" ? p.gender === "cocuk" : p.gender === g)))
      .map((g) => ({
        label: GENDERS[g].label,
        href: `/${GENDERS[g].slug}`,
        columns: genderColumns(g),
        brands: brands.slice(0, 6).map((b) => ({ name: b.name, slug: b.slug })),
        promo: genderPromo(g),
      })),
    {
      label: "Markalar",
      href: "/markalar",
      brands: brands.map((b) => ({ name: b.name, slug: b.slug })),
      columns: [
        {
          title: "Popüler Seriler",
          links: series.slice(0, 10).map((s) => ({ label: s.label, href: `/seri/${s.slug}` })),
        },
      ],
    },
    {
      label: "Sneaker",
      href: "/sneaker",
      columns: [
        { title: "Kategoriler", links: CATEGORIES.filter((c) => c.type === "ayakkabi" && has((p) => p.category === c.key)).map((c) => ({ label: c.label, href: `/${c.slug}` })) },
        { title: "İkonik Modeller", links: series.filter((s) => all.some((p) => p.seriesSlug === s.slug && p.category === "sneaker")).slice(0, 8).map((s) => ({ label: s.label, href: `/seri/${s.slug}` })) },
      ],
    },
  ];
  if (has((p) => p.productType === "giyim"))
    menu.push({
      label: "Giyim",
      href: "/giyim",
      columns: [{ title: "Giyim", links: CATEGORIES.filter((c) => c.type === "giyim" && has((p) => p.category === c.key)).map((c) => ({ label: c.label, href: `/${c.slug}` })) }],
    });
  if (has((p) => p.productType === "aksesuar"))
    menu.push({
      label: "Aksesuar",
      href: "/aksesuar",
      columns: [{ title: "Aksesuar", links: CATEGORIES.filter((c) => c.type === "aksesuar" && has((p) => p.category === c.key)).map((c) => ({ label: c.label, href: `/${c.slug}` })) }],
    });
  menu.push({ label: "İndirim", href: "/indirim", tone: "sale" });
  return menu;
}
