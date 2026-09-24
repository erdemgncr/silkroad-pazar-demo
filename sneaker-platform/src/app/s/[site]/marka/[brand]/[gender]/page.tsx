import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { brandCollection, listingFacts, parseListingQuery, runListing } from "@/lib/catalog";
import { requireSiteWithCatalog } from "@/lib/store-context";
import { collectionOverride, listingMetadata } from "@/lib/listing-page";
import { listingCopy } from "@/lib/seo/copy";
import { ListingView } from "@/components/store/listing/listing-view";
import { GENDERS } from "@/lib/taxonomy";

async function load(props: PageProps<"/s/[site]/marka/[brand]/[gender]">) {
  const { brand, gender } = await props.params;
  if (!(gender in GENDERS)) notFound();
  const { site, all } = await requireSiteWithCatalog(props.params);
  const g = gender as keyof typeof GENDERS;
  const col = brandCollection(brand, g);
  if (!col || !all.some(col.test)) notFound();
  const query = parseListingQuery(await props.searchParams);
  const result = runListing(all, col, query);
  const copy = listingCopy(site, col.key, listingFacts(col.label, result.base), await collectionOverride(site.id, col.key));
  return { site, all, col, query, result, copy, brand, g };
}

export async function generateMetadata(props: PageProps<"/s/[site]/marka/[brand]/[gender]">): Promise<Metadata> {
  const { site, copy, query, result, brand, g } = await load(props);
  return listingMetadata(site, copy, `/marka/${brand}/${GENDERS[g].slug}`, query, result);
}

export default async function BrandGenderPage(props: PageProps<"/s/[site]/marka/[brand]/[gender]">) {
  const { site, all, col, query, result, copy, brand, g } = await load(props);
  const brandName = col.crumbs[2].label;
  const quickLinks = (["erkek", "kadin", "cocuk"] as const)
    .filter((x) => all.some((p) => p.brandSlug === brand && (x === "cocuk" ? p.gender === "cocuk" : p.gender === x)))
    .map((x) => ({ label: `${brandName} ${GENDERS[x].label}`, href: `/marka/${brand}/${GENDERS[x].slug}`, active: x === g }));
  return (
    <ListingView site={site} all={all} crumbs={col.crumbs} copy={copy} result={result} query={query} basePath={`/marka/${brand}/${GENDERS[g].slug}`} quickLinks={quickLinks} hideGender />
  );
}
