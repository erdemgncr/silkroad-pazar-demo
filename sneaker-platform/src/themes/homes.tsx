import Link from "next/link";
import { clsx } from "clsx";
import type { SiteContext } from "@/lib/site";
import type { CardProduct } from "@/lib/store-types";
import type { BlogPost } from "@/db/schema";
import { HeroSlider, Tabs } from "@/components/store/interactive";
import {
  BlogTeasers,
  BrandStrip,
  CategoryCircles,
  DealOfTheDay,
  EditorialSplit,
  GenderTiles,
  MarqueeBand,
  ProductRail,
  PromoBanners,
  SectionHeading,
  SeoTextBlock,
  SeriesTiles,
  USPBar,
  UpcomingDrops,
} from "@/components/store/sections";
import { ProductCard, ProductGrid } from "@/components/store/product-card";

export type HomeData = {
  site: SiteContext;
  featured: CardProduct[];
  newArrivals: CardProduct[];
  bestSellers: CardProduct[];
  sale: CardProduct[];
  upcoming: CardProduct[];
  men: CardProduct[];
  women: CardProduct[];
  kids: CardProduct[];
  running: CardProduct[];
  brands: { name: string; slug: string; count: number }[];
  series: { label: string; slug: string; image: string; count: number }[];
  categories: { label: string; href: string; image: string }[];
  posts: BlogPost[];
  seo: { heading: string; paragraphs: string[] };
};

function genderTiles(d: HomeData) {
  const pick = (list: CardProduct[]) => list[0]?.image ?? "";
  return [
    { label: "Erkek", href: "/erkek", image: pick(d.men), sub: "Yeni sezon" },
    { label: "Kadın", href: "/kadin", image: pick(d.women), sub: "Trend modeller" },
    { label: "Çocuk", href: "/cocuk", image: pick(d.kids), sub: "Minik adımlar" },
  ].filter((t) => t.image);
}

/* ------------------------------------------------------------------ */

export function UrbanHome(d: HomeData) {
  const v = "urban" as const;
  const hs = d.site.settings.homeSections;
  return (
    <>
      <HeroSlider slides={d.site.settings.heroSlides} variant={v} />
      <USPBar site={d.site} variant={v} />
      {hs.featured && <ProductRail title="Öne Çıkanlar" subtitle="Bu hafta en çok ilgi gören modeller" href="/cok-satanlar" items={d.featured} variant={v} />}
      {hs.categoryTiles && <GenderTiles tiles={genderTiles(d)} variant={v} />}
      {hs.newArrivals && (
        <section className="container-x py-10 md:py-14">
          <SectionHeading title="Yeni Gelenler" subtitle="Rafa yeni çıkan modeller" href="/yeni-gelenler" variant={v} />
          <Tabs
            variant={v}
            tabs={[
              { label: "Tümü", content: <ProductGrid items={d.newArrivals.slice(0, 8)} variant={v} /> },
              { label: "Erkek", content: <ProductGrid items={d.men.slice(0, 8)} variant={v} /> },
              { label: "Kadın", content: <ProductGrid items={d.women.slice(0, 8)} variant={v} /> },
              { label: "Çocuk", content: <ProductGrid items={d.kids.slice(0, 8)} variant={v} /> },
            ]}
          />
        </section>
      )}
      <PromoBanners banners={d.site.settings.promoBanners} variant={v} layout="2" />
      <SeriesTiles series={d.series} variant={v} />
      {hs.bestSellers && <ProductRail title="Çok Satanlar" href="/cok-satanlar" items={d.bestSellers} variant={v} />}
      {hs.brands && <BrandStrip brands={d.brands} variant={v} />}
      {hs.sale && <ProductRail title="İndirimdekiler" subtitle="Kaçırılmayacak fiyatlar" href="/indirim" items={d.sale} variant={v} />}
      {hs.upcoming && <UpcomingDrops items={d.upcoming} variant={v} />}
      {hs.blog && <BlogTeasers posts={d.posts} variant={v} />}
      {hs.seoText && <SeoTextBlock heading={d.seo.heading} paragraphs={d.seo.paragraphs} />}
    </>
  );
}

/* ------------------------------------------------------------------ */

export function ArenaHome(d: HomeData) {
  const v = "arena" as const;
  const hs = d.site.settings.homeSections;
  const [main, ...rest] = d.site.settings.heroSlides;
  const banners = d.site.settings.promoBanners;
  return (
    <>
      <section className="container-x pt-5">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="overflow-hidden rounded-theme-lg">
              <HeroSlider slides={d.site.settings.heroSlides} variant={v} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {[...rest, main].filter(Boolean).slice(0, 2).map((s) => (
              <Link key={s.title} href={s.href} className="group relative flex min-h-[200px] flex-col justify-end overflow-hidden rounded-theme-lg p-6" style={{ background: s.bg, color: s.fg }}>
                {s.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.image} alt={s.title} className="absolute inset-0 h-full w-full object-cover opacity-40 transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                )}
                <div className="relative">
                  <p className="text-xs font-bold uppercase tracking-widest opacity-80">{s.eyebrow}</p>
                  <p className="font-heading text-2xl font-extrabold">{s.title}</p>
                  <span className="mt-2 inline-block rounded bg-white px-4 py-2 text-xs font-bold text-black">{s.cta}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      {hs.categoryTiles && <CategoryCircles items={d.categories} variant={v} />}
      {hs.featured && <ProductRail title="Trend Ürünler" subtitle="Sezonun en çok aranan modelleri" href="/cok-satanlar" items={d.featured} variant={v} />}
      <PromoBanners banners={banners} variant={v} layout="4" />
      {hs.newArrivals && (
        <section className="container-x py-10 md:py-14">
          <SectionHeading title="Senin İçin Seçtiklerimiz" subtitle="Kategoriye göre en yeni ürünler" href="/yeni-gelenler" variant={v} />
          <Tabs
            variant={v}
            tabs={[
              { label: "Erkek", content: <ProductGrid items={d.men.slice(0, 10)} variant={v} cols={5} /> },
              { label: "Kadın", content: <ProductGrid items={d.women.slice(0, 10)} variant={v} cols={5} /> },
              { label: "Çocuk", content: <ProductGrid items={d.kids.slice(0, 10)} variant={v} cols={5} /> },
              { label: "Koşu", content: <ProductGrid items={d.running.slice(0, 10)} variant={v} cols={5} /> },
            ]}
          />
        </section>
      )}
      {hs.brands && <BrandStrip brands={d.brands} variant={v} title="Popüler Markalar" />}
      {hs.sale && <ProductRail title="Kampanyalı Ürünler" subtitle="Sepette ekstra indirim fırsatları" href="/indirim" items={d.sale} variant={v} />}
      {hs.bestSellers && <ProductRail title="Çok Satanlar" href="/cok-satanlar" items={d.bestSellers} variant={v} />}
      <USPBar site={d.site} variant={v} />
      {hs.blog && <BlogTeasers posts={d.posts} variant={v} />}
      {hs.seoText && <SeoTextBlock heading={d.seo.heading} paragraphs={d.seo.paragraphs} />}
    </>
  );
}

/* ------------------------------------------------------------------ */

export function NeonHome(d: HomeData) {
  const v = "neon" as const;
  const hs = d.site.settings.homeSections;
  const spotlight = d.featured[0];
  return (
    <>
      <HeroSlider slides={d.site.settings.heroSlides} variant={v} />
      <MarqueeBand words={["Limitli Seri", "Yeni Drop", "Orijinal Ürün", "Hızlı Kargo"]} variant={v} />
      {hs.upcoming && <UpcomingDrops items={d.upcoming} variant={v} />}
      {hs.newArrivals && (
        <section className="container-x py-12 md:py-16">
          <SectionHeading title="Son Düşenler" subtitle="Just dropped" href="/yeni-gelenler" variant={v} />
          <ProductGrid items={d.newArrivals.slice(0, 8)} variant={v} />
        </section>
      )}
      {spotlight && (
        <section className="container-x py-10">
          <Link href={`/urun/${spotlight.slug}`} className="group grid overflow-hidden rounded-theme-lg border border-line md:grid-cols-2">
            <div className="relative aspect-square bg-soft md:aspect-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={spotlight.image} alt={spotlight.imageAlt} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
            </div>
            <div className="flex flex-col justify-center gap-5 p-8 md:p-14">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Spotlight</p>
              <h2 className="font-heading text-5xl uppercase leading-[0.95] md:text-7xl">
                {spotlight.brand} {spotlight.model}
              </h2>
              <p className="text-muted">{spotlight.colorName} renk seçeneği sınırlı sayıda. Bedenini kaptırmadan sepete ekle.</p>
              <span className="w-fit bg-primary px-7 py-3.5 text-sm font-bold uppercase tracking-widest text-black">İncele</span>
            </div>
          </Link>
        </section>
      )}
      {hs.brands && <BrandStrip brands={d.brands} variant={v} />}
      {hs.featured && <ProductRail title="Hype Listesi" subtitle="Most wanted" href="/cok-satanlar" items={d.featured} variant={v} />}
      {hs.categoryTiles && <GenderTiles tiles={genderTiles(d)} variant={v} />}
      {hs.sale && <ProductRail title="Son Şans" subtitle="Last call" href="/indirim" items={d.sale} variant={v} />}
      {hs.blog && <BlogTeasers posts={d.posts} variant={v} />}
      <USPBar site={d.site} variant={v} />
      {hs.seoText && <SeoTextBlock heading={d.seo.heading} paragraphs={d.seo.paragraphs} />}
    </>
  );
}

/* ------------------------------------------------------------------ */

export function StudioHome(d: HomeData) {
  const v = "studio" as const;
  const hs = d.site.settings.homeSections;
  const b = d.site.settings.promoBanners;
  return (
    <>
      <HeroSlider slides={d.site.settings.heroSlides} variant={v} />
      {hs.featured && (
        <section className="container-x py-16 md:py-24">
          <SectionHeading title="Editörün Seçimi" subtitle="Sezonun rafine parçaları" href="/cok-satanlar" linkLabel="Tümünü İncele" variant={v} center />
          <ProductGrid items={d.featured.slice(0, 8)} variant={v} />
        </section>
      )}
      <EditorialSplit
        title="Zamansız tasarımın izinde"
        body={`${d.site.name} seçkisi; hızla değişen trendlerin ötesinde, yıllarca giyilecek modelleri bir araya getiriyor. Süet, deri ve el işçiliği detaylarla öne çıkan koleksiyonu keşfedin.`}
        href="/yeni-gelenler"
        cta="Koleksiyonu Keşfet"
        image={b[0]?.image ?? d.featured[0]?.image ?? ""}
      />
      {hs.newArrivals && <ProductRail title="Yeni Gelenler" href="/yeni-gelenler" items={d.newArrivals} variant={v} />}
      {hs.categoryTiles && <GenderTiles tiles={genderTiles(d)} variant={v} />}
      <EditorialSplit
        title="Toprak tonlarında süet mevsimi"
        body="Bej, kahverengi ve haki tonlarındaki terrace modelleri; kumaş pantolon ve triko ile sonbaharın en rafine kombinlerini oluşturuyor."
        href="/indirim"
        cta="Seçkiyi Gör"
        image={b[1]?.image ?? d.newArrivals[0]?.image ?? ""}
        reverse
      />
      {hs.brands && <BrandStrip brands={d.brands} variant={v} />}
      {hs.bestSellers && <ProductRail title="En Sevilenler" href="/cok-satanlar" items={d.bestSellers} variant={v} />}
      {hs.blog && <BlogTeasers posts={d.posts} variant={v} />}
      <USPBar site={d.site} variant={v} />
      {hs.seoText && <SeoTextBlock heading={d.seo.heading} paragraphs={d.seo.paragraphs} />}
    </>
  );
}

/* ------------------------------------------------------------------ */

export function PulseHome(d: HomeData) {
  const v = "pulse" as const;
  const hs = d.site.settings.homeSections;
  const deal = d.sale[0];
  const activities = [
    { label: "Koşu", href: "/kosu-ayakkabisi", tone: "bg-[#dbeafe]", emoji: "🏃" },
    { label: "Basketbol", href: "/basketbol-ayakkabisi", tone: "bg-[#ffedd5]", emoji: "🏀" },
    { label: "Outdoor", href: "/bot-outdoor", tone: "bg-[#dcfce7]", emoji: "⛰️" },
    { label: "Günlük", href: "/sneaker", tone: "bg-[#fce7f3]", emoji: "👟" },
  ];
  return (
    <>
      <section className="container-x pt-5">
        <HeroSlider slides={d.site.settings.heroSlides} variant={v} />
      </section>
      {hs.categoryTiles && <CategoryCircles items={d.categories} variant={v} />}
      <section className="container-x py-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {activities.map((a) => (
            <Link key={a.href} href={a.href} className={clsx("group flex items-center justify-between rounded-theme-lg p-5 md:p-7", a.tone)}>
              <div>
                <p className="text-xs font-semibold text-slate-600">Kategori</p>
                <p className="font-heading text-xl font-extrabold text-slate-900 md:text-2xl">{a.label}</p>
              </div>
              <span className="text-3xl transition-transform group-hover:scale-125 md:text-4xl" aria-hidden>
                {a.emoji}
              </span>
            </Link>
          ))}
        </div>
      </section>
      {deal && hs.sale && <DealOfTheDay p={deal} variant={v} />}
      {hs.featured && <ProductRail title="Popüler Ürünler" subtitle="Herkesin konuştuğu modeller" href="/cok-satanlar" items={d.featured} variant={v} />}
      {hs.newArrivals && (
        <section className="container-x py-10 md:py-14">
          <SectionHeading title="Yeni Sezon" href="/yeni-gelenler" variant={v} />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
            {d.newArrivals.slice(0, 8).map((p) => (
              <ProductCard key={p.id} p={p} variant={v} />
            ))}
          </div>
        </section>
      )}
      <PromoBanners banners={d.site.settings.promoBanners} variant={v} layout="1+2" />
      {hs.bestSellers && <ProductRail title="Koşu Ayakkabıları" subtitle="Her tempoya uygun" href="/kosu-ayakkabisi" items={d.running} variant={v} />}
      {hs.brands && <BrandStrip brands={d.brands} variant={v} />}
      {hs.sale && <ProductRail title="İndirimli Ürünler" href="/indirim" items={d.sale.slice(1)} variant={v} />}
      <USPBar site={d.site} variant={v} />
      {hs.blog && <BlogTeasers posts={d.posts} variant={v} />}
      {hs.seoText && <SeoTextBlock heading={d.seo.heading} paragraphs={d.seo.paragraphs} />}
    </>
  );
}

export const HOMES = { urban: UrbanHome, arena: ArenaHome, neon: NeonHome, studio: StudioHome, pulse: PulseHome };
