import type { Metadata } from "next";
import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { allBrandsInCatalog, allSeries, pickHome } from "@/lib/catalog";
import { toCards } from "@/lib/store-data";
import { requireSiteWithCatalog } from "@/lib/store-context";
import { homeSeoText } from "@/lib/seo/copy";
import { CATEGORIES } from "@/lib/taxonomy";
import { HOMES } from "@/themes/homes";
import { cached } from "@/lib/cache";

export async function generateMetadata({ params }: PageProps<"/s/[site]">): Promise<Metadata> {
  const { site } = await requireSiteWithCatalog(params);
  const s = site.settings;
  return {
    title: { absolute: s.seo.homeTitle || `${site.name} | ${s.tagline}` },
    description: s.seo.homeDescription,
    alternates: { canonical: "/" },
  };
}

export default async function HomePage({ params, searchParams }: PageProps<"/s/[site]">) {
  const { site, all } = await requireSiteWithCatalog(params);
  const deleted = (await searchParams).hesap === "silindi";
  const h = pickHome(all);
  const posts = await cached(`posts:${site.id}:home`, 60_000, () =>
    db
      .select()
      .from(schema.blogPosts)
      .where(and(eq(schema.blogPosts.siteId, site.id), eq(schema.blogPosts.status, "published")))
      .orderBy(desc(schema.blogPosts.publishedAt))
      .limit(3),
  );
  const brands = allBrandsInCatalog(all);
  const bestBySeries = new Map<string, string>();
  for (const p of [...all].sort((a, b) => b.popularity - a.popularity)) if (!bestBySeries.has(p.seriesSlug)) bestBySeries.set(p.seriesSlug, p.images[0]?.url ?? "");
  const series = allSeries(all)
    .filter((s) => all.some((p) => p.seriesSlug === s.slug && p.productType === "ayakkabi"))
    .map((s) => ({ ...s, image: bestBySeries.get(s.slug) ?? s.image, pop: all.filter((p) => p.seriesSlug === s.slug).reduce((a, p) => a + p.popularity, 0) }))
    .sort((a, b) => b.pop - a.pop);
  const categories = CATEGORIES.filter((c) => all.some((p) => p.category === c.key)).map((c) => ({
    label: c.label,
    href: `/${c.slug}`,
    image: all.find((p) => p.category === c.key && p.isFeatured)?.images[0]?.url ?? all.find((p) => p.category === c.key)!.images[0]?.url ?? "",
  }));

  const Home = HOMES[site.theme];
  const home = (
    <Home
      site={site}
      featured={toCards(h.featured, all)}
      newArrivals={toCards(h.newArrivals, all)}
      bestSellers={toCards(h.bestSellers, all)}
      sale={toCards(h.sale, all)}
      upcoming={toCards(h.upcoming, all)}
      men={toCards(h.byGender("erkek"), all)}
      women={toCards(h.byGender("kadin"), all)}
      kids={toCards(h.byGender("cocuk"), all)}
      running={toCards(h.byCategory("kosu"), all)}
      brands={brands}
      series={series}
      categories={categories}
      posts={posts}
      seo={homeSeoText(site, brands.map((b) => b.name))}
    />
  );
  if (!deleted) return home;
  return (
    <>
      <p role="status" className="container-x mt-4 rounded-theme border border-line bg-soft px-4 py-3 text-sm">
        Hesabın ve kişisel verilerin silindi. Bizi tercih ettiğin için teşekkür ederiz.
      </p>
      {home}
    </>
  );
}
