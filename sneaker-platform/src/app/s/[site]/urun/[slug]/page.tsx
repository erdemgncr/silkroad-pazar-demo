import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { clsx } from "clsx";
import { ChevronDown } from "lucide-react";
import { colorSiblings, getCollection, relatedProducts } from "@/lib/catalog";
import { requireSiteWithCatalog, indexable } from "@/lib/store-context";
import { toCard, toCards } from "@/lib/store-data";
import { fitAdvice, productCopy } from "@/lib/seo/copy";
import { breadcrumbLd, faqLd, productLd } from "@/lib/seo/schema-org";
import { CATEGORY_BY_KEY, GENDERS, GENDER_LABEL, SIZE_CHARTS } from "@/lib/taxonomy";
import { formatPrice } from "@/lib/format";
import { Breadcrumbs } from "@/components/store/breadcrumbs";
import { Gallery } from "@/components/store/pdp/gallery";
import { BuyBox } from "@/components/store/pdp/buy-box";
import { RecentlyViewed } from "@/components/store/pdp/recently-viewed";
import { ProductRail } from "@/components/store/sections";
import { JsonLd } from "@/components/store/json-ld";
import { Tabs } from "@/components/store/interactive";
import { RichText } from "@/components/store/rich-text";
import type { CatalogProduct } from "@/lib/catalog";
import type { SiteContext } from "@/lib/site";

function addBusinessDays(from: Date, n: number): Date {
  const d = new Date(from);
  let added = 0;
  while (added < n) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) added++;
  }
  return d;
}

async function load(props: PageProps<"/s/[site]/urun/[slug]">) {
  const { slug } = await props.params;
  const { site, all } = await requireSiteWithCatalog(props.params);
  const p = all.find((x) => x.slug === slug);
  if (!p) {
    // Eski ya da değişmiş bağlantılar için: aynı ürün kimliğine sahip yeni slug'a yönlendir.
    const byId = all.find((x) => slug.endsWith(`-${x.id}`));
    if (byId) permanentRedirect(`/urun/${byId.slug}`);
    notFound();
  }
  const copy = productCopy(site, p, p.override);
  return { site, all, p, copy };
}

function crumbsFor(p: CatalogProduct, h1: string) {
  const crumbs = [{ label: "Ana Sayfa", href: "/" }];
  const cat = CATEGORY_BY_KEY[p.category];
  if (p.gender !== "unisex") {
    const g = GENDERS[p.gender];
    crumbs.push({ label: g.label, href: `/${g.slug}` });
    if (cat && getCollection(`${g.slug}-${cat.slug}`)) crumbs.push({ label: `${g.label} ${cat.label}`, href: `/${g.slug}-${cat.slug}` });
  } else if (cat) {
    crumbs.push({ label: cat.label, href: `/${cat.slug}` });
  }
  crumbs.push({ label: h1, href: `/urun/${p.slug}` });
  return crumbs;
}

export async function generateMetadata(props: PageProps<"/s/[site]/urun/[slug]">): Promise<Metadata> {
  const { site, p, copy } = await load(props);
  const url = `/urun/${p.slug}`;
  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
    alternates: { canonical: url },
    robots: indexable(site) ? undefined : { index: false, follow: false },
    openGraph: {
      type: "website",
      title: copy.metaTitle,
      description: copy.metaDescription,
      url,
      images: p.images.slice(0, 4).map((i) => ({ url: i.url, width: 900, height: 900, alt: copy.imageAlt })),
    },
    twitter: { card: "summary_large_image", title: copy.metaTitle, description: copy.metaDescription, images: p.images[0] ? [p.images[0].url] : undefined },
    other: {
      "product:price:amount": (p.price / 100).toFixed(2),
      "product:price:currency": "TRY",
      "product:availability": p.inStock ? "in stock" : "out of stock",
      "product:brand": p.brand,
      "product:condition": "new",
    },
  };
}

function Details({ site, p, copy }: { site: SiteContext; p: CatalogProduct; copy: ReturnType<typeof productCopy> }) {
  const v = site.theme;
  const s = site.settings;
  const sections = [
    {
      label: "Ürün Açıklaması",
      content: (
        <div className="prose-store">
          {copy.paragraphs.map((t, i) => (
            <p key={i}>{t}</p>
          ))}
        </div>
      ),
    },
    {
      label: "Ürün Özellikleri",
      content: (
        <dl className="grid max-w-2xl grid-cols-[140px_1fr] gap-y-2 text-sm">
          {copy.highlights.map((h) => (
            <div key={h.label} className="contents">
              <dt className="text-muted">{h.label}</dt>
              <dd className="font-medium">{h.value}</dd>
            </div>
          ))}
        </dl>
      ),
    },
    {
      label: "Kargo ve İade",
      content: (
        <RichText
          source={`${formatPrice(s.shipping.freeShippingThreshold * 100).replace(",00", "")} ve üzeri siparişlerde kargo ücretsizdir; altındaki siparişlerde ${formatPrice(s.shipping.fee * 100).replace(",00", "")} kargo ücreti uygulanır. Siparişler ${s.shipping.dispatchDays} içinde ${s.shipping.carrier} ile kargoya verilir.

Ürünü teslim aldığın tarihten itibaren ${s.shipping.returnDays} gün içinde ücretsiz iade edebilir ya da beden değişimi yapabilirsin. Ayrıntılar için [İade ve Değişim](/iade-ve-degisim) sayfasını inceleyebilirsin.`}
        />
      ),
    },
    {
      label: "Sıkça Sorulanlar",
      content: (
        <div className="space-y-4">
          {copy.faq.map((f) => (
            <div key={f.q}>
              <p className="font-semibold">{f.q}</p>
              <p className="mt-1 text-sm text-muted">{f.a}</p>
            </div>
          ))}
        </div>
      ),
    },
  ];

  if (v === "arena" || v === "pulse") {
    return (
      <section className="container-x py-10">
        <div className={clsx("border border-line p-5 md:p-8", v === "pulse" ? "rounded-theme-lg" : "rounded-theme-lg")}>
          <Tabs variant={v} tabs={sections} />
        </div>
      </section>
    );
  }
  return (
    <section className="container-x py-10">
      <div className="mx-auto max-w-4xl divide-y divide-line border-y border-line">
        {sections.map((sec, i) => (
          <details key={sec.label} className="group" open={i === 0}>
            <summary className={clsx("flex cursor-pointer list-none items-center justify-between py-5 font-semibold", v === "studio" ? "font-heading text-xl font-normal" : "text-base", v === "urban" && "uppercase tracking-wide", v === "neon" && "font-heading text-xl uppercase")}>
              {sec.label}
              <ChevronDown size={18} className="transition-transform group-open:rotate-180" />
            </summary>
            <div className="pb-6">{sec.content}</div>
          </details>
        ))}
      </div>
    </section>
  );
}

export default async function ProductPage(props: PageProps<"/s/[site]/urun/[slug]">) {
  const { site, all, p, copy } = await load(props);
  const v = site.theme;
  const s = site.settings;
  const siblings = colorSiblings(all, p);
  const related = relatedProducts(all, p, 12);
  const sameBrand = all.filter((x) => x.brandSlug === p.brandSlug && x.seriesSlug !== p.seriesSlug && (!x.releaseDate || x.releaseDate < new Date())).slice(0, 12);
  const crumbs = crumbsFor(p, copy.h1);
  const card = toCard(p, siblings.length);
  const cat = CATEGORY_BY_KEY[p.category];
  const chartKey = p.productType === "giyim" ? "giyim" : p.productType === "aksesuar" ? "aksesuar" : p.gender === "unisex" ? "erkek" : p.gender;
  const now = new Date();
  const maxDispatch = parseInt(s.shipping.dispatchDays.match(/(\d+)(?!.*\d)/)?.[1] ?? "2", 10);
  const deliveryWindow: [string, string] = [addBusinessDays(now, maxDispatch), addBusinessDays(now, maxDispatch + 3)].map((d) =>
    new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", weekday: "short" }).format(d),
  ) as [string, string];
  const images = p.images.map((im) => ({ url: im.url, alt: im.alt ? `${copy.imageAlt} - ${im.alt.split(" ").slice(-2).join(" ")}` : copy.imageAlt }));

  const gridCls =
    v === "urban"
      ? "lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]"
      : v === "studio"
        ? "lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]"
        : "lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]";

  return (
    <>
      <div className="container-x pt-5">
        <Breadcrumbs items={crumbs} />
      </div>
      <div className={clsx("container-x mt-5 grid gap-8 lg:gap-12", gridCls)}>
        <Gallery images={images} variant={v} />
        <div className="lg:sticky lg:top-28 lg:self-start">
          <BuyBox
            product={card}
            h1={copy.h1}
            subtitle={`${GENDER_LABEL[p.gender]} ${cat?.singular ?? ""} · ${p.colorName}`}
            sku={p.sku}
            brandHref={`/marka/${p.brandSlug}`}
            siblings={siblings.map((x) => ({ slug: x.slug, colorName: x.colorName, colorHex: x.colorHex, image: x.images[0]?.url ?? "", current: x.id === p.id, inStock: x.inStock }))}
            fitAdvice={p.productType === "aksesuar" ? "Ürün standart ölçüdedir." : fitAdvice(p.brand)}
            sizeChart={SIZE_CHARTS[chartKey]}
            variant={v}
            shipping={{ threshold: s.shipping.freeShippingThreshold * 100, dispatch: s.shipping.dispatchDays, returnDays: s.shipping.returnDays, carrier: s.shipping.carrier }}
            installmentText={s.installmentText}
            whatsapp={s.contact.whatsapp}
            deliveryWindow={deliveryWindow}
          />
          <div className="mt-6 flex flex-wrap gap-2 text-xs">
            <Link href={`/seri/${p.seriesSlug}`} className="rounded-full bg-soft px-3 py-1.5 hover:bg-line">
              Tüm {p.brand} {p.model} modelleri
            </Link>
            <Link href={`/marka/${p.brandSlug}`} className="rounded-full bg-soft px-3 py-1.5 hover:bg-line">
              {p.brand} ürünleri
            </Link>
            {cat && (
              <Link href={`/${cat.slug}`} className="rounded-full bg-soft px-3 py-1.5 hover:bg-line">
                {cat.label}
              </Link>
            )}
          </div>
        </div>
      </div>

      <Details site={site} p={p} copy={copy} />

      <ProductRail title="Benzer Ürünler" subtitle="Bunları da beğenebilirsin" items={toCards(related, all)} variant={v} href={cat ? `/${cat.slug}` : undefined} />
      {sameBrand.length > 3 && <ProductRail title={`Diğer ${p.brand} Modelleri`} items={toCards(sameBrand, all)} variant={v} href={`/marka/${p.brandSlug}`} />}
      <RecentlyViewed excludeId={p.id} variant={v} />

      <JsonLd data={[productLd(site, p, copy, siblings), breadcrumbLd(site, crumbs), faqLd(copy.faq)]} />
    </>
  );
}
