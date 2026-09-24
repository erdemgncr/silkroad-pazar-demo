import Link from "next/link";
import { ArrowRight, Award, Package, ShieldCheck } from "lucide-react";
import { clsx } from "clsx";
import type { SiteContext } from "@/lib/site";
import type { ThemeKey } from "@/themes/registry";
import { discountPercent } from "@/lib/format";
import type { CardProduct } from "@/lib/store-types";
import type { BlogPost } from "@/db/schema";
import { Countdown, HeroSlider, Tabs } from "@/components/store/interactive";
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


/* ------------------------------------------------------------------ */
/* Volt: tam ekran kampanya görselleri, dar büyük harf başlıklar        */
/* ------------------------------------------------------------------ */

function VoltBanner({ title, eyebrow, cta, href, image, className }: { title: string; eyebrow?: string; cta: string; href: string; image: string; className?: string }) {
  return (
    <Link href={href} className={clsx("group relative block overflow-hidden bg-soft", className)}>
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.03]" loading="lazy" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-6 text-white md:p-10">
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-90">{eyebrow}</p>}
        <p className="mt-1 font-heading text-4xl font-bold uppercase leading-[0.95] md:text-6xl">{title}</p>
        <span className="mt-5 inline-flex h-11 items-center bg-white px-6 font-heading text-sm font-bold uppercase tracking-wide text-black transition-colors group-hover:bg-primary group-hover:text-primary-fg">{cta}</span>
      </div>
    </Link>
  );
}

export function VoltHome(d: HomeData) {
  const v = "volt" as const;
  const hs = d.site.settings.homeSections;
  const slides = d.site.settings.heroSlides;
  const banners = d.site.settings.promoBanners;
  const tiles = genderTiles(d);
  return (
    <>
      <section className="lg:px-4 lg:pt-3">
        {slides.length > 1 ? (
          <HeroSlider slides={slides} variant={v} />
        ) : slides[0] ? (
          <VoltBanner title={slides[0].title} eyebrow={slides[0].eyebrow} cta={slides[0].cta} href={slides[0].href} image={slides[0].image || d.featured[0]?.image || ""} className="h-[70vh] min-h-[460px]" />
        ) : null}
      </section>
      {hs.categoryTiles && tiles.length > 0 && (
        <section className="grid gap-1 pt-1 md:grid-cols-3 lg:px-4">
          {tiles.map((t) => (
            <Link key={t.href} href={t.href} className="group relative block aspect-[4/5] overflow-hidden bg-soft md:aspect-[3/4]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.image} alt={t.label} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
              <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/35" />
              <div className="absolute inset-0 grid place-items-center text-white">
                <p className="font-heading text-5xl font-bold uppercase tracking-tight md:text-6xl">{t.label}</p>
              </div>
            </Link>
          ))}
        </section>
      )}
      {hs.newArrivals && <ProductRail title="Yeni Gelenler" href="/yeni-gelenler" items={d.newArrivals} variant={v} />}
      {banners.length > 0 && (
        <section className="grid gap-1 md:grid-cols-2 lg:px-4">
          {banners.slice(0, 2).map((b) => (
            <VoltBanner key={b.title} title={b.title} eyebrow={b.subtitle} cta={b.cta} href={b.href} image={b.image || d.sale[0]?.image || ""} className="aspect-[4/5] md:aspect-[5/6]" />
          ))}
        </section>
      )}
      {hs.featured && <ProductRail title="Trend Modeller" subtitle="Bu hafta en çok bakılanlar" href="/cok-satanlar" items={d.featured} variant={v} />}
      <section className="container-x py-10 md:py-14">
        <SectionHeading title="İkonik Silüetler" href="/markalar" linkLabel="Tüm Markalar" variant={v} />
        <div className="no-scrollbar -mx-4 flex snap-x gap-1 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-4 md:px-0">
          {d.series.slice(0, 8).map((s) => (
            <Link key={s.slug} href={`/seri/${s.slug}`} className="group relative w-[72%] shrink-0 snap-start overflow-hidden bg-soft md:w-auto">
              <div className="aspect-[3/4]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.image} alt={s.label} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
                <p className="font-heading text-2xl font-bold uppercase leading-none">{s.label}</p>
                <p className="mt-1 text-xs opacity-80">{s.count} ürün</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
      {hs.bestSellers && <ProductRail title="Çok Satanlar" href="/cok-satanlar" items={d.bestSellers} variant={v} />}
      {hs.brands && <BrandStrip brands={d.brands} variant={v} />}
      {hs.sale && <ProductRail title="İndirim" subtitle="Seçili modellerde sezon sonu fiyatları" href="/indirim" items={d.sale} variant={v} />}
      {hs.upcoming && <UpcomingDrops items={d.upcoming} variant={v} />}
      {hs.blog && <BlogTeasers posts={d.posts} variant={v} />}
      <USPBar site={d.site} variant={v} />
      {hs.seoText && <SeoTextBlock heading={d.seo.heading} paragraphs={d.seo.paragraphs} />}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Metro: AVM mağazası; kategori baloncukları, sekmeli trend modeller   */
/* ------------------------------------------------------------------ */

export function MetroHome(d: HomeData) {
  const v = "metro" as const;
  const hs = d.site.settings.homeSections;
  const tiles = genderTiles(d);
  return (
    <>
      <HeroSlider slides={d.site.settings.heroSlides} variant={v} />
      {hs.categoryTiles && tiles.length > 0 && (
        <section className="container-x pt-8">
          <div className="grid grid-cols-3 gap-2 md:gap-4">
            {tiles.map((t) => (
              <Link key={t.href} href={t.href} className="group relative overflow-hidden rounded-theme-lg bg-soft">
                <div className="aspect-[4/5] md:aspect-[16/10]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.image} alt={t.label} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                </div>
                <span className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-black shadow md:bottom-5 md:px-6 md:text-sm">
                  {t.label}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
      {hs.categoryTiles && <CategoryCircles items={d.categories} variant={v} />}
      {hs.newArrivals && (
        <section className="container-x py-10 md:py-14">
          <SectionHeading title="Trend Modeller" subtitle="Sezonun en çok tercih edilenleri" href="/cok-satanlar" variant={v} center />
          <Tabs
            variant={v}
            tabs={[
              { label: "Kadın", content: <ProductGrid items={d.women.slice(0, 8)} variant={v} /> },
              { label: "Erkek", content: <ProductGrid items={d.men.slice(0, 8)} variant={v} /> },
              { label: "Çocuk", content: <ProductGrid items={d.kids.slice(0, 8)} variant={v} /> },
            ]}
          />
        </section>
      )}
      <PromoBanners banners={d.site.settings.promoBanners} variant={v} layout="2" />
      {hs.bestSellers && <ProductRail title="Çok Satanlar" href="/cok-satanlar" items={d.bestSellers} variant={v} />}
      <section className="container-x py-6">
        <div className="flex flex-col items-start justify-between gap-5 rounded-theme-lg bg-accent px-6 py-8 text-white md:flex-row md:items-center md:px-12">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-80">{d.site.name} Üyelik</p>
            <p className="mt-1 text-2xl font-extrabold md:text-3xl">Üye ol, kampanyaları ilk sen yakala</p>
            <p className="mt-1 text-sm opacity-85">Siparişlerini takip et, adreslerini kaydet, stok gelince haber al.</p>
          </div>
          <Link href="/hesabim/giris" className="inline-flex h-12 shrink-0 items-center rounded-full bg-white px-8 text-sm font-bold text-black">
            Hemen Üye Ol
          </Link>
        </div>
      </section>
      {hs.brands && <BrandStrip brands={d.brands} variant={v} title="Markalar" />}
      {hs.sale && <ProductRail title="İndirimli Ürünler" href="/indirim" items={d.sale} variant={v} />}
      {hs.featured && <ProductRail title="Senin İçin Seçtiklerimiz" href="/yeni-gelenler" items={d.featured} variant={v} />}
      <USPBar site={d.site} variant={v} />
      {hs.blog && <BlogTeasers posts={d.posts} variant={v} />}
      {hs.seoText && <SeoTextBlock heading={d.seo.heading} paragraphs={d.seo.paragraphs} />}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Brut: kalın çerçeveler, sarı bloklar, kayan başlıklar               */
/* ------------------------------------------------------------------ */

export function BrutHome(d: HomeData) {
  const v = "brut" as const;
  const hs = d.site.settings.homeSections;
  const hero = d.site.settings.heroSlides[0];
  const heroImg = hero?.image || d.featured[0]?.image || "";
  return (
    <>
      {hero && (
        <section className="container-x pt-6">
          <div className="brut-box grid bg-card md:grid-cols-[1.1fr_1fr]">
            <div className="flex flex-col justify-between gap-8 border-b-2 border-fg bg-accent p-6 text-black md:border-b-0 md:border-r-2 md:p-10">
              <p className="w-fit border-2 border-black bg-white px-2 py-1 text-xs font-bold uppercase">{hero.eyebrow || "Yeni Sezon"}</p>
              <h1 className="font-heading text-5xl font-black uppercase leading-[0.9] tracking-tight md:text-7xl xl:text-8xl">{hero.title}</h1>
              <div className="flex flex-wrap items-center gap-4">
                <Link href={hero.href} className="inline-flex h-12 items-center gap-2 border-2 border-black bg-black px-6 text-sm font-bold uppercase text-white shadow-[4px_4px_0_#fff] transition-transform hover:-translate-y-0.5">
                  {hero.cta} <ArrowRight size={16} />
                </Link>
                {hero.subtitle && <p className="max-w-xs text-sm">{hero.subtitle}</p>}
              </div>
            </div>
            <div className="relative aspect-square md:aspect-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={heroImg} alt={hero.title} className="absolute inset-0 h-full w-full object-cover" />
            </div>
          </div>
        </section>
      )}
      <div className="mt-8 border-y-2 border-fg">
        <MarqueeBand words={["Yeni Drop", "Orijinal Ürün", "Hızlı Kargo", "Kolay İade", "Streetwear"]} variant={v} />
      </div>
      {hs.categoryTiles && (
        <section className="container-x py-10 md:py-14">
          <SectionHeading title="Kategoriler" variant={v} />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {d.categories.slice(0, 8).map((c) => (
              <Link key={c.href} href={c.href} className="brut-box brut-box-hover group flex items-center justify-between gap-3 bg-card p-3">
                <span className="font-heading text-lg font-black uppercase leading-none md:text-xl">{c.label}</span>
                <span className="h-16 w-16 shrink-0 overflow-hidden border-2 border-fg bg-soft md:h-20 md:w-20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
      {hs.newArrivals && (
        <section className="container-x py-10 md:py-14">
          <SectionHeading title="Yeni Drop" subtitle="Rafa yeni düşenler" href="/yeni-gelenler" variant={v} />
          <ProductGrid items={d.newArrivals.slice(0, 8)} variant={v} />
        </section>
      )}
      <PromoBanners banners={d.site.settings.promoBanners} variant={v} layout="2" />
      {hs.bestSellers && <ProductRail title="Çok Satanlar" href="/cok-satanlar" items={d.bestSellers} variant={v} />}
      {hs.upcoming && <UpcomingDrops items={d.upcoming} variant={v} />}
      {hs.brands && <BrandStrip brands={d.brands} variant={v} />}
      {hs.sale && <ProductRail title="Son Şans" subtitle="İndirimde, stoklar sınırlı" href="/indirim" items={d.sale} variant={v} />}
      {hs.blog && <BlogTeasers posts={d.posts} variant={v} />}
      <USPBar site={d.site} variant={v} />
      {hs.seoText && <SeoTextBlock heading={d.seo.heading} paragraphs={d.seo.paragraphs} />}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Luxe: siyah & altın, geniş boşluklar, ince serif başlıklar           */
/* ------------------------------------------------------------------ */

function LuxeHeading({ eyebrow, title, href, cta }: { eyebrow: string; title: string; href?: string; cta?: string }) {
  return (
    <div className="mb-10 text-center md:mb-14">
      <p className="text-[11px] uppercase tracking-[0.4em] text-primary">{eyebrow}</p>
      <h2 className="h-display mt-3 font-heading text-4xl md:text-5xl">{title}</h2>
      {href && (
        <Link href={href} className="mt-5 inline-block border-b border-primary pb-1 text-[11px] uppercase tracking-[0.3em] text-muted hover:text-fg">
          {cta ?? "Tümünü Gör"}
        </Link>
      )}
    </div>
  );
}

export function LuxeHome(d: HomeData) {
  const v = "luxe" as const;
  const hs = d.site.settings.homeSections;
  const hero = d.site.settings.heroSlides[0];
  const heroImg = hero?.image || d.featured[0]?.image || "";
  return (
    <>
      {hero && (
        <section className="relative h-[82vh] min-h-[520px] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroImg} alt={hero.title} className="absolute inset-0 h-full w-full object-cover opacity-55" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-[var(--c-bg)]" />
          <div className="container-x relative flex h-full flex-col items-center justify-center text-center">
            <p className="text-[11px] uppercase tracking-[0.5em] text-primary">{hero.eyebrow || "Koleksiyon"}</p>
            <h1 className="h-display mt-5 max-w-4xl font-heading text-5xl leading-[1.02] md:text-7xl lg:text-8xl">{hero.title}</h1>
            {hero.subtitle && <p className="mt-6 max-w-xl text-sm leading-relaxed text-fg/75 md:text-base">{hero.subtitle}</p>}
            <Link href={hero.href} className="mt-10 inline-flex h-12 items-center border border-primary px-10 text-[11px] uppercase tracking-[0.35em] text-primary transition-colors hover:bg-primary hover:text-black">
              {hero.cta}
            </Link>
          </div>
        </section>
      )}
      {hs.featured && (
        <section className="container-x py-16 md:py-24">
          <LuxeHeading eyebrow="The Edit" title="Seçkinin En Özelleri" href="/cok-satanlar" />
          <ProductGrid items={d.featured.slice(0, 6)} variant={v} cols={3} />
        </section>
      )}
      <section className="border-y border-line">
        <div className="container-x grid gap-8 py-12 text-center md:grid-cols-3 md:py-16">
          {[
            [ShieldCheck, "Orijinallik Garantisi", "Her ürün uzman kontrolünden geçer, faturalı gönderilir."],
            [Package, "Özel Paketleme", "Marka kutusu korunarak özel koruyucu kutuda teslim."],
            [Award, `${d.site.settings.shipping.returnDays} Gün Koşulsuz İade`, "Beden uymazsa ücretsiz değişim ve iade."],
          ].map(([Icon, t, b]) => {
            const I = Icon as typeof ShieldCheck;
            return (
              <div key={t as string} className="flex flex-col items-center gap-3">
                <I size={26} strokeWidth={1.2} className="text-primary" />
                <p className="font-heading text-xl">{t as string}</p>
                <p className="max-w-xs text-sm text-muted">{b as string}</p>
              </div>
            );
          })}
        </div>
      </section>
      {hs.categoryTiles && (
        <section className="container-x py-16 md:py-24">
          <LuxeHeading eyebrow="Koleksiyonlar" title="İkonik Modeller" href="/markalar" cta="Tüm Markalar" />
          <div className="grid gap-4 md:grid-cols-3">
            {d.series.slice(0, 3).map((s, i) => (
              <Link key={s.slug} href={`/seri/${s.slug}`} className={clsx("group relative overflow-hidden bg-soft", i === 0 && "md:row-span-2")}>
                <div className={clsx(i === 0 ? "aspect-[3/4] md:aspect-auto md:h-full" : "aspect-[4/3]")}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.image} alt={s.label} className="h-full w-full object-cover opacity-85 transition-all duration-700 group-hover:scale-105 group-hover:opacity-100" loading="lazy" />
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                  <p className="font-heading text-3xl">{s.label}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.3em] text-primary">Keşfet</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
      {hs.newArrivals && <ProductRail title="Yeni Gelenler" subtitle="Rafa yeni eklenenler" href="/yeni-gelenler" items={d.newArrivals} variant={v} />}
      <EditorialSplit
        title="Nadir olanın peşinde"
        body={`${d.site.name}, dünyanın dört bir yanından sınırlı sayıdaki modelleri tek tek seçerek koleksiyonuna ekliyor. Her çift, orijinalliği doğrulanmış ve özenle paketlenmiş olarak kapına geliyor.`}
        href="/yeni-gelenler"
        cta="Koleksiyonu Keşfet"
        image={d.site.settings.promoBanners[0]?.image || d.bestSellers[0]?.image || ""}
      />
      {hs.bestSellers && <ProductRail title="En Çok Tercih Edilenler" href="/cok-satanlar" items={d.bestSellers} variant={v} />}
      {hs.brands && <BrandStrip brands={d.brands} variant={v} />}
      {hs.upcoming && <UpcomingDrops items={d.upcoming} variant={v} />}
      {hs.blog && <BlogTeasers posts={d.posts} variant={v} />}
      {hs.seoText && <SeoTextBlock heading={d.seo.heading} paragraphs={d.seo.paragraphs} />}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Outlet: yoğun fırsat pazarı                                          */
/* ------------------------------------------------------------------ */

function endOfDayIso() {
  const d = new Date();
  d.setHours(23, 59, 59, 0);
  return d.toISOString();
}

export function OutletHome(d: HomeData) {
  const v = "outlet" as const;
  const hs = d.site.settings.homeSections;
  const slides = d.site.settings.heroSlides;
  const flash = [...d.sale].sort((a, b) => discountPercent(b.price, b.compareAtPrice) - discountPercent(a.price, a.compareAtPrice));
  const tiers = [
    { label: "%30'a varan", sub: "indirim", tone: "bg-[#fff1e6] text-[#b34700]" },
    { label: "%50'ye varan", sub: "indirim", tone: "bg-[#ffe3e3] text-[#b0001a]" },
    { label: "%70'e varan", sub: "son şans", tone: "bg-[#1b1b1b] text-white" },
  ];
  return (
    <>
      {hs.categoryTiles && (
        <section className="container-x pt-4">
          <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 py-1 md:justify-center">
            {[{ label: "Fırsatlar", href: "/indirim", image: flash[0]?.image ?? "" }, ...d.categories].slice(0, 12).map((c) => (
              <Link key={c.href} href={c.href} className="flex w-[74px] shrink-0 flex-col items-center gap-1.5 text-center md:w-[84px]">
                <span className="rounded-full bg-gradient-to-tr from-primary via-sale to-accent p-[2.5px]">
                  <span className="block h-[66px] w-[66px] overflow-hidden rounded-full border-2 border-bg bg-soft md:h-[76px] md:w-[76px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                  </span>
                </span>
                <span className="line-clamp-1 text-[11px] font-medium">{c.label}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
      <section className="container-x pt-4">
        <div className="grid gap-3 lg:grid-cols-3">
          <div className="overflow-hidden rounded-theme-lg lg:col-span-2">
            <HeroSlider slides={slides} variant={v} />
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            {tiers.slice(0, 2).map((t) => (
              <Link key={t.label} href="/indirim" className={clsx("flex flex-col justify-center rounded-theme-lg p-5 md:p-7", t.tone)}>
                <span className="text-xs font-bold uppercase tracking-widest opacity-75">Sezon sonu</span>
                <span className="font-heading text-2xl font-extrabold leading-tight md:text-4xl">{t.label}</span>
                <span className="text-sm font-semibold">{t.sub}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      {hs.sale && flash.length > 0 && (
        <section className="container-x py-8">
          <div className="rounded-theme-lg bg-gradient-to-r from-sale to-primary p-4 text-white md:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-xl font-black text-sale" aria-hidden>
                  ⚡
                </span>
                <div>
                  <p className="font-heading text-2xl font-extrabold leading-none">Flaş Fırsatlar</p>
                  <p className="text-sm opacity-90">Gün sonuna kadar geçerli fiyatlar</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Countdown to={endOfDayIso()} compact className="rounded-theme bg-black/20 px-3 py-1.5" />
                <Link href="/indirim" className="hidden rounded-full bg-white px-4 py-2 text-sm font-bold text-sale md:inline-flex">
                  Tümü
                </Link>
              </div>
            </div>
            <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
              {flash.slice(0, 10).map((p) => (
                <div key={p.id} className="w-[46%] shrink-0 text-fg sm:w-[30%] lg:w-[18.6%]">
                  <ProductCard p={p} variant={v} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      {hs.featured && (
        <section className="container-x py-8">
          <SectionHeading title="Sana Özel Fırsatlar" subtitle="En çok beğenilen indirimli ürünler" href="/indirim" variant={v} />
          <ProductGrid items={[...d.featured, ...d.bestSellers].filter((p, i, a) => a.findIndex((x) => x.id === p.id) === i).slice(0, 10)} variant={v} cols={5} />
        </section>
      )}
      <PromoBanners banners={d.site.settings.promoBanners} variant={v} layout="4" />
      {hs.brands && <BrandStrip brands={d.brands} variant={v} title="Markaların Outlet Fiyatları" />}
      {hs.newArrivals && (
        <section className="container-x py-8">
          <SectionHeading title="Yeni Eklenenler" href="/yeni-gelenler" variant={v} />
          <Tabs
            variant={v}
            tabs={[
              { label: "Tümü", content: <ProductGrid items={d.newArrivals.slice(0, 10)} variant={v} cols={5} /> },
              { label: "Erkek", content: <ProductGrid items={d.men.slice(0, 10)} variant={v} cols={5} /> },
              { label: "Kadın", content: <ProductGrid items={d.women.slice(0, 10)} variant={v} cols={5} /> },
              { label: "Çocuk", content: <ProductGrid items={d.kids.slice(0, 10)} variant={v} cols={5} /> },
            ]}
          />
        </section>
      )}
      {hs.bestSellers && <ProductRail title="Çok Satanlar" href="/cok-satanlar" items={d.bestSellers} variant={v} />}
      <USPBar site={d.site} variant={v} />
      {hs.blog && <BlogTeasers posts={d.posts} variant={v} />}
      {hs.seoText && <SeoTextBlock heading={d.seo.heading} paragraphs={d.seo.paragraphs} />}
    </>
  );
}

export const HOMES: Record<ThemeKey, (d: HomeData) => React.ReactNode> = {
  urban: UrbanHome,
  arena: ArenaHome,
  neon: NeonHome,
  studio: StudioHome,
  pulse: PulseHome,
  volt: VoltHome,
  metro: MetroHome,
  brut: BrutHome,
  luxe: LuxeHome,
  outlet: OutletHome,
};
