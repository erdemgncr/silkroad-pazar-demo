import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { brandCollection, listingFacts, parseListingQuery, runListing } from "@/lib/catalog";
import { requireSiteWithCatalog } from "@/lib/store-context";
import { collectionOverride, listingMetadata } from "@/lib/listing-page";
import { brandIntro, listingCopy } from "@/lib/seo/copy";
import { ListingView } from "@/components/store/listing/listing-view";
import { BrandMark } from "@/components/store/brand-icons";
import { BRAND_BY_SLUG, GENDERS } from "@/lib/taxonomy";

async function load(props: PageProps<"/s/[site]/marka/[brand]">) {
  const { brand } = await props.params;
  const { site, all } = await requireSiteWithCatalog(props.params);
  const col = brandCollection(brand);
  if (!col || !all.some(col.test)) notFound();
  const query = parseListingQuery(await props.searchParams);
  const result = runListing(all, col, query);
  const ov = await collectionOverride(site.id, col.key);
  const copy = listingCopy(site, col.key, listingFacts(`${col.label} Ayakkabı ve Giyim`, result.base), ov);
  if (!ov?.intro) copy.intro = brandIntro(site, col.label);
  return { site, all, col, query, result, copy, brand };
}

export async function generateMetadata(props: PageProps<"/s/[site]/marka/[brand]">): Promise<Metadata> {
  const { site, copy, query, result, brand } = await load(props);
  return listingMetadata(site, copy, `/marka/${brand}`, query, result);
}

export default async function BrandPage(props: PageProps<"/s/[site]/marka/[brand]">) {
  const { site, all, col, query, result, copy, brand } = await load(props);
  const def = BRAND_BY_SLUG[brand];
  const quickLinks = (["erkek", "kadin", "cocuk"] as const)
    .filter((g) => all.some((p) => p.brandSlug === brand && (g === "cocuk" ? p.gender === "cocuk" : p.gender === g)))
    .map((g) => ({ label: `${col.label} ${GENDERS[g].label}`, href: `/marka/${brand}/${GENDERS[g].slug}` }));
  const series = [...new Map(all.filter((p) => p.brandSlug === brand).map((p) => [p.seriesSlug, { label: p.model, href: `/seri/${p.seriesSlug}` }])).values()];
  return (
    <ListingView
      site={site}
      all={all}
      crumbs={col.crumbs}
      copy={copy}
      result={result}
      query={query}
      basePath={`/marka/${brand}`}
      quickLinks={[...quickLinks, ...series.slice(0, 10)]}
      hero={
        <div className="mt-6 flex items-center gap-5 rounded-theme-lg bg-soft px-6 py-8 md:px-10">
          <span className="grid h-20 w-28 shrink-0 place-items-center rounded-theme bg-bg text-fg">
            <BrandMark slug={brand} name={col.label} size={48} />
          </span>
          <div>
            <p className="font-heading text-2xl font-bold">{col.label}</p>
            {def && (
              <p className="mt-1 text-sm text-muted">
                {def.country} · {def.since} · {result.base.length} ürün
              </p>
            )}
          </div>
        </div>
      }
    />
  );
}
