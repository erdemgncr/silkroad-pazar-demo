import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listingFacts, parseListingQuery, runListing, seriesCollection } from "@/lib/catalog";
import { requireSiteWithCatalog } from "@/lib/store-context";
import { collectionOverride, listingMetadata } from "@/lib/listing-page";
import { listingCopy } from "@/lib/seo/copy";
import { ListingView } from "@/components/store/listing/listing-view";

async function load(props: PageProps<"/s/[site]/seri/[slug]">) {
  const { slug } = await props.params;
  const { site, all } = await requireSiteWithCatalog(props.params);
  const col = seriesCollection(all, slug);
  if (!col) notFound();
  const query = parseListingQuery(await props.searchParams);
  const result = runListing(all, col, query);
  const copy = listingCopy(site, col.key, listingFacts(col.label, result.base), await collectionOverride(site.id, col.key));
  return { site, all, col, query, result, copy, slug };
}

export async function generateMetadata(props: PageProps<"/s/[site]/seri/[slug]">): Promise<Metadata> {
  const { site, copy, query, result, slug } = await load(props);
  return listingMetadata(site, copy, `/seri/${slug}`, query, result);
}

export default async function SeriesPage(props: PageProps<"/s/[site]/seri/[slug]">) {
  const { site, all, col, query, result, copy, slug } = await load(props);
  const sample = all.find((p) => p.seriesSlug === slug)!;
  const related = [...new Map(all.filter((p) => p.brandSlug === sample.brandSlug && p.seriesSlug !== slug).map((p) => [p.seriesSlug, { label: `${p.brand} ${p.model}`, href: `/seri/${p.seriesSlug}` }])).values()].slice(0, 8);
  return <ListingView site={site} all={all} crumbs={col.crumbs} copy={copy} result={result} query={query} basePath={`/seri/${slug}`} quickLinks={related} />;
}
