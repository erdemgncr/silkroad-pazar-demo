import type { Metadata } from "next";
import { parseListingQuery, runListing } from "@/lib/catalog";
import { requireSiteWithCatalog } from "@/lib/store-context";
import { ListingView } from "@/components/store/listing/listing-view";

export async function generateMetadata({ searchParams }: PageProps<"/s/[site]/arama">): Promise<Metadata> {
  const q = parseListingQuery(await searchParams).q;
  return { title: q ? `"${q}" arama sonuçları` : "Arama", robots: { index: false, follow: true }, alternates: { canonical: "/arama" } };
}

export default async function SearchPage({ params, searchParams }: PageProps<"/s/[site]/arama">) {
  const { site, all } = await requireSiteWithCatalog(params);
  const query = parseListingQuery(await searchParams);
  const result = runListing(all, null, query);
  const title = query.q ? `"${query.q}" için sonuçlar` : "Tüm Ürünler";
  return (
    <ListingView
      site={site}
      all={all}
      crumbs={[
        { label: "Ana Sayfa", href: "/" },
        { label: "Arama", href: "/arama" },
      ]}
      copy={{
        h1: title,
        metaTitle: title,
        metaDescription: "",
        intro: result.total ? "" : "Aramanla eşleşen ürün bulunamadı. Yazımı kontrol edebilir ya da daha genel bir kelimeyle tekrar deneyebilirsin.",
        content: [],
        faq: [],
      }}
      result={result}
      query={query}
      basePath="/arama"
      quickLinks={[
        { label: "Yeni Gelenler", href: "/yeni-gelenler" },
        { label: "Çok Satanlar", href: "/cok-satanlar" },
        { label: "İndirimli Ürünler", href: "/indirim" },
      ]}
      showSeo={false}
    />
  );
}
