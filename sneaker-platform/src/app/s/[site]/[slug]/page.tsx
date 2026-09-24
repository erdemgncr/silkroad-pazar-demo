import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCollection, listingFacts, parseListingQuery, runListing } from "@/lib/catalog";
import { requireSite, requireSiteWithCatalog, indexable } from "@/lib/store-context";
import { collectionOverride, listingMetadata, quickLinksFor } from "@/lib/listing-page";
import { listingCopy } from "@/lib/seo/copy";
import { ListingView } from "@/components/store/listing/listing-view";
import { STATIC_BY_SLUG, fillVars, pageVars } from "@/lib/content/pages";
import { StaticPageView } from "@/components/store/static-page-view";
import { activeCoupons, sitePageOverride } from "@/lib/pages-data";

export async function generateMetadata({ params, searchParams }: PageProps<"/s/[site]/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const collection = getCollection(slug);
  if (collection) {
    const { site, all } = await requireSiteWithCatalog(params);
    const query = parseListingQuery(await searchParams);
    const result = runListing(all, collection, query);
    const copy = listingCopy(site, collection.key, listingFacts(collection.label, result.base), await collectionOverride(site.id, collection.key));
    return listingMetadata(site, copy, `/${slug}`, query, result);
  }
  const page = STATIC_BY_SLUG.get(slug);
  if (!page) return {};
  const site = await requireSite(params);
  const ov = await sitePageOverride(site.id, slug);
  const title = ov?.title || page.title;
  const description = ov?.metaDescription || fillVars(page.description, pageVars(site));
  return {
    title,
    description,
    alternates: { canonical: `/${slug}` },
    robots: indexable(site) ? (page.group === "yasal" ? { index: true, follow: true } : undefined) : { index: false, follow: false },
    openGraph: { title, description, url: `/${slug}` },
  };
}

export default async function SlugPage({ params, searchParams }: PageProps<"/s/[site]/[slug]">) {
  const { slug } = await params;
  const collection = getCollection(slug);
  if (collection) {
    const { site, all } = await requireSiteWithCatalog(params);
    const query = parseListingQuery(await searchParams);
    const result = runListing(all, collection, query);
    const copy = listingCopy(site, collection.key, listingFacts(collection.label, result.base), await collectionOverride(site.id, collection.key));
    return (
      <ListingView
        site={site}
        all={all}
        crumbs={collection.crumbs}
        copy={copy}
        result={result}
        query={query}
        basePath={`/${slug}`}
        quickLinks={quickLinksFor(collection, all)}
        hideGender={Boolean(collection.gender)}
      />
    );
  }
  const page = STATIC_BY_SLUG.get(slug);
  if (!page) notFound();
  const site = await requireSite(params);
  const [ov, coupons] = await Promise.all([sitePageOverride(site.id, slug), page.kind === "campaigns" ? activeCoupons(site.id) : Promise.resolve([])]);
  return <StaticPageView site={site} page={page} override={ov ? { title: ov.title, content: ov.content } : null} coupons={coupons} />;
}
