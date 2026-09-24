import type { Metadata } from "next";
import Link from "next/link";
import { allBrandsInCatalog } from "@/lib/catalog";
import { requireSiteWithCatalog } from "@/lib/store-context";
import { Breadcrumbs } from "@/components/store/breadcrumbs";
import { BrandMark } from "@/components/store/brand-icons";
import { JsonLd } from "@/components/store/json-ld";
import { breadcrumbLd } from "@/lib/seo/schema-org";
import { BRAND_BY_SLUG } from "@/lib/taxonomy";
import { joinTr } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/s/[site]/markalar">): Promise<Metadata> {
  const { site, all } = await requireSiteWithCatalog(params);
  const brands = allBrandsInCatalog(all).map((b) => b.name);
  return {
    title: "Tüm Markalar",
    description: `${joinTr(brands.slice(0, 6))} ve daha fazlası: ${site.name} mağazasındaki tüm sneaker ve spor giyim markaları.`,
    alternates: { canonical: "/markalar" },
  };
}

export default async function BrandsPage({ params }: PageProps<"/s/[site]/markalar">) {
  const { site, all } = await requireSiteWithCatalog(params);
  const brands = allBrandsInCatalog(all).sort((a, b) => a.name.localeCompare(b.name, "tr"));
  const letters = [...new Set(brands.map((b) => b.name[0].toLocaleUpperCase("tr-TR")))];
  const crumbs = [
    { label: "Ana Sayfa", href: "/" },
    { label: "Markalar", href: "/markalar" },
  ];
  return (
    <div className="container-x py-8 md:py-10">
      <Breadcrumbs items={crumbs} />
      <h1 className="h-display mt-4 font-heading text-3xl font-bold md:text-5xl">Tüm Markalar</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">
        {site.name} mağazasında {brands.length} markanın orijinal ürünleri yer alıyor. Markaya tıklayarak tüm modelleri inceleyebilirsin.
      </p>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {brands.map((b) => (
          <Link key={b.slug} href={`/marka/${b.slug}`} className="group flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-theme-lg border border-line bg-card p-4 transition-all hover:border-fg hover:shadow-md">
            <BrandMark slug={b.slug} name={b.name} size={48} className="transition-transform group-hover:scale-110" />
            <span className="text-xs text-muted">{b.count} ürün</span>
          </Link>
        ))}
      </div>
      <div className="mt-14">
        <div className="mb-6 flex flex-wrap gap-2">
          {letters.map((l) => (
            <a key={l} href={`#harf-${l}`} className="grid h-9 w-9 place-items-center rounded-theme border border-line text-sm font-semibold hover:border-fg">
              {l}
            </a>
          ))}
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {letters.map((l) => (
            <section key={l} id={`harf-${l}`}>
              <h2 className="mb-3 font-heading text-2xl font-bold">{l}</h2>
              <ul className="space-y-3">
                {brands
                  .filter((b) => b.name[0].toLocaleUpperCase("tr-TR") === l)
                  .map((b) => (
                    <li key={b.slug}>
                      <Link href={`/marka/${b.slug}`} className="font-semibold hover:underline">
                        {b.name}
                      </Link>
                      <p className="text-xs text-muted">{BRAND_BY_SLUG[b.slug]?.blurb}</p>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
      <JsonLd data={breadcrumbLd(site, crumbs)} />
    </div>
  );
}
