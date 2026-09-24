import Link from "next/link";
import { clsx } from "clsx";
import { ArrowRight, BadgePercent, CreditCard, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { styleOf, type StyleKey, type ThemeKey } from "@/themes/registry";
import type { SiteContext } from "@/lib/site";
import type { CardProduct } from "@/lib/store-types";
import type { PromoBanner } from "@/lib/site-settings";
import type { BlogPost } from "@/db/schema";
import { formatDate, formatDateShort, formatPrice } from "@/lib/format";
import { BrandMark } from "./brand-icons";
import { Carousel, Collapsible, Countdown } from "./interactive";
import { ProductCard } from "./product-card";

export function SectionHeading({
  title,
  subtitle,
  href,
  linkLabel = "Tümünü Gör",
  variant: theme,
  center,
  withArrows,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  variant: ThemeKey;
  center?: boolean;
  withArrows?: boolean;
}) {
  const variant = styleOf(theme);
  const titleCls: Record<StyleKey, string> = {
    urban: "font-heading text-2xl font-black uppercase tracking-tight md:text-[34px]",
    arena: "font-heading text-2xl font-bold md:text-3xl",
    neon: "font-heading text-4xl uppercase md:text-6xl",
    studio: "font-heading text-3xl md:text-5xl",
    pulse: "font-heading text-2xl font-extrabold md:text-[32px]",
  };
  const themeTitle: Partial<Record<ThemeKey, string>> = {
    volt: "font-heading text-3xl font-bold uppercase md:text-[44px]",
    metro: "font-heading text-2xl font-bold md:text-[30px]",
    brut: "font-heading text-3xl font-black uppercase md:text-5xl",
    luxe: "font-heading text-4xl md:text-5xl",
    outlet: "font-heading text-xl font-extrabold md:text-[26px]",
  };
  return (
    <div className={clsx("mb-6 flex gap-4 md:mb-8", center ? "flex-col items-center text-center" : "items-end justify-between")}>
      <div className={clsx(center && "flex flex-col items-center")}>
        {variant === "neon" && subtitle && <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-primary">{subtitle}</p>}
        <h2 className={clsx("h-display leading-none", themeTitle[theme] ?? titleCls[variant])}>{title}</h2>
        {variant !== "neon" && subtitle && <p className="mt-2 text-sm text-muted md:text-base">{subtitle}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className={clsx(
            "flex shrink-0 items-center gap-1.5 text-sm font-semibold",
            variant === "urban" && theme !== "brut" && "underline underline-offset-4",
            theme === "brut" && "border-2 border-fg bg-accent px-3 py-1.5 text-black shadow-[3px_3px_0_var(--c-fg)]",
            theme === "outlet" && "rounded-full border border-line px-4 py-1.5",
            variant === "arena" && "text-primary",
            variant === "neon" && "uppercase tracking-widest text-primary",
            variant === "studio" && "border-b border-fg pb-0.5 text-xs uppercase tracking-[0.2em]",
            variant === "pulse" && "rounded-full bg-soft px-4 py-2",
            center && "mt-3",
            withArrows && "md:mr-[104px]",
          )}
        >
          {linkLabel} <ArrowRight size={15} />
        </Link>
      )}
    </div>
  );
}

export function ProductRail({
  title,
  subtitle,
  href,
  items,
  variant: theme,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  items: CardProduct[];
  variant: ThemeKey;
}) {
  const variant = styleOf(theme);
  if (!items.length) return null;
  return (
    <section className="container-x py-10 md:py-14">
      <SectionHeading title={title} subtitle={subtitle} href={href} variant={theme} withArrows />
      <Carousel variant={theme} itemClass={variant === "neon" || variant === "studio" ? "w-[62%] sm:w-[40%] lg:w-[24%]" : undefined}>
        {items.map((p) => (
          <ProductCard key={p.id} p={p} variant={theme} />
        ))}
      </Carousel>
    </section>
  );
}

/* ---------------- Kategori kutuları ---------------- */

export function GenderTiles({ tiles, variant: theme }: { tiles: { label: string; href: string; image: string; sub: string }[]; variant: ThemeKey }) {
  const variant = styleOf(theme);
  return (
    <section className="container-x py-10 md:py-14">
      <div className={clsx("grid gap-3 md:gap-4", tiles.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2")}>
        {tiles.map((t) => (
          <Link key={t.href} href={t.href} className={clsx("group relative block aspect-[4/5] overflow-hidden bg-soft md:aspect-[3/4]", variant === "pulse" && "rounded-theme-lg", variant === "arena" && "rounded-theme-lg")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={t.image} alt={t.label} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-85">{t.sub}</p>
              <p className={clsx("h-display mt-1 font-heading font-black", variant === "studio" ? "text-4xl font-normal" : "text-3xl md:text-4xl")}>{t.label}</p>
              <span className={clsx("mt-4 inline-flex items-center gap-2 bg-white px-5 py-2.5 text-sm font-bold text-black", variant === "pulse" && "rounded-full", variant === "arena" && "rounded-theme")}>
                Alışverişe Başla <ArrowRight size={15} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function CategoryCircles({ items, variant: theme }: { items: { label: string; href: string; image: string }[]; variant: ThemeKey }) {
  const variant = styleOf(theme);
  return (
    <section className="container-x py-8 md:py-10">
      <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-6 md:px-0 lg:grid-cols-12 lg:gap-3">
        {items.map((c) => (
          <Link key={c.href} href={c.href} className="group flex w-24 shrink-0 flex-col items-center gap-2 text-center md:w-auto">
            <span
              className={clsx(
                "relative block aspect-square w-full overflow-hidden ring-2 ring-transparent transition-all group-hover:ring-accent",
                variant === "pulse" ? "rounded-[28px] bg-soft" : "rounded-full bg-soft",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.image} alt={c.label} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
            </span>
            <span className="text-[13px] font-semibold leading-tight lg:text-xs">{c.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Marka şeridi ---------------- */

export function BrandStrip({ brands, variant: theme, title = "Markalar" }: { brands: { name: string; slug: string; count: number }[]; variant: ThemeKey; title?: string }) {
  const variant = styleOf(theme);
  if (!brands.length) return null;
  if (variant === "neon") {
    const row = [...brands, ...brands];
    return (
      <section className="overflow-hidden border-y border-line py-8">
        <div className="animate-marquee flex w-max items-center gap-16">
          {[...row, ...row].map((b, i) => (
            <Link key={`${b.slug}-${i}`} href={`/marka/${b.slug}`} className="text-white/60 transition-colors hover:text-primary">
              <BrandMark slug={b.slug} name={b.name} size={52} />
            </Link>
          ))}
        </div>
      </section>
    );
  }
  return (
    <section className="container-x py-10 md:py-14">
      <SectionHeading title={title} subtitle={variant === "studio" ? "Seçkimizdeki markalar" : "Dünyanın en sevilen sneaker markaları"} href="/markalar" linkLabel="Tüm Markalar" variant={theme} />
      <div className={clsx("grid grid-cols-3 gap-2 sm:grid-cols-4 md:gap-3 lg:grid-cols-7")}>
        {brands.slice(0, 14).map((b) => (
          <Link
            key={b.slug}
            href={`/marka/${b.slug}`}
            className={clsx(
              "group flex aspect-[5/3] flex-col items-center justify-center gap-1 border border-line bg-card text-fg transition-all hover:border-fg",
              variant === "pulse" && "rounded-theme",
              variant === "arena" && "rounded-theme hover:shadow-md",
            )}
          >
            <BrandMark slug={b.slug} name={b.name} size={40} className="transition-transform group-hover:scale-110" />
            <span className="text-[11px] text-muted">{b.count} ürün</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Kampanya bannerları ---------------- */

export function PromoBanners({ banners, variant: theme, layout = "2" }: { banners: PromoBanner[]; variant: ThemeKey; layout?: "2" | "4" | "1+2" }) {
  const variant = styleOf(theme);
  if (!banners.length) return null;
  const rounded = variant === "pulse" || variant === "arena" ? "rounded-theme-lg" : "";
  const card = (b: PromoBanner, cls?: string) => (
    <Link key={b.title} href={b.href} className={clsx("group relative block overflow-hidden", rounded, cls)} style={{ background: b.bg, color: b.fg }}>
      {b.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={b.image} alt={b.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-105" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-6 text-white">
        {b.subtitle && <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-85">{b.subtitle}</p>}
        <p className="h-display font-heading text-2xl font-black md:text-3xl">{b.title}</p>
        <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold underline underline-offset-4">
          {b.cta} <ArrowRight size={15} />
        </span>
      </div>
    </Link>
  );
  if (layout === "4") {
    return (
      <section className="container-x py-8">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">{banners.slice(0, 4).map((b) => card(b, "aspect-[3/4]"))}</div>
      </section>
    );
  }
  if (layout === "1+2") {
    return (
      <section className="container-x py-8">
        <div className="grid gap-3 md:grid-cols-2 md:gap-4">
          {card(banners[0], "aspect-[4/3] md:aspect-auto md:row-span-2")}
          {banners.slice(1, 3).map((b) => card(b, "aspect-[16/9]"))}
        </div>
      </section>
    );
  }
  return (
    <section className="container-x py-8">
      <div className="grid gap-3 md:grid-cols-2 md:gap-4">{banners.slice(0, 2).map((b) => card(b, "aspect-[16/10]"))}</div>
    </section>
  );
}

/* ---------------- Avantajlar ---------------- */

export function USPBar({ site, variant: theme }: { site: SiteContext; variant: ThemeKey }) {
  const variant = styleOf(theme);
  const s = site.settings;
  const items = [
    { icon: Truck, title: "Ücretsiz Kargo", body: `${formatPrice(s.shipping.freeShippingThreshold * 100).replace(",00", "")} ve üzeri siparişlerde` },
    { icon: RotateCcw, title: `${s.shipping.returnDays} Gün Kolay İade`, body: "Beden uymazsa ücretsiz değişim" },
    { icon: CreditCard, title: "Taksit İmkânı", body: s.installmentText },
    { icon: ShieldCheck, title: "%100 Orijinal", body: "Faturalı ve garantili ürünler" },
  ];
  return (
    <section className={clsx(variant === "neon" ? "border-y border-line" : variant === "studio" ? "border-y border-line" : "bg-soft", variant === "pulse" && "container-x !bg-transparent")}>
      <div className={clsx("grid grid-cols-2 gap-y-6 py-7 md:grid-cols-4", variant === "pulse" ? "rounded-theme-lg bg-soft px-4" : "container-x")}>
        {items.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex items-center gap-3 px-2">
            <span className={clsx("grid h-11 w-11 shrink-0 place-items-center", variant === "pulse" ? "rounded-2xl bg-primary text-primary-fg" : variant === "arena" ? "rounded-full bg-primary text-primary-fg" : variant === "neon" ? "text-primary" : "")}>
              <Icon size={22} strokeWidth={1.7} />
            </span>
            <div>
              <p className="text-sm font-bold">{title}</p>
              <p className="text-xs text-muted">{body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Popüler seriler ---------------- */

export function SeriesTiles({ series, variant: theme, title = "Popüler Modeller" }: { series: { label: string; slug: string; image: string; count: number }[]; variant: ThemeKey; title?: string }) {
  const variant = styleOf(theme);
  if (!series.length) return null;
  return (
    <section className="container-x py-10 md:py-14">
      <SectionHeading title={title} subtitle="En çok aranan ikonik silüetler" variant={theme} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 lg:grid-cols-6">
        {series.slice(0, 12).map((s) => (
          <Link key={s.slug} href={`/seri/${s.slug}`} className={clsx("group relative overflow-hidden bg-soft", variant === "pulse" || variant === "arena" ? "rounded-theme-lg" : "")}>
            <div className="aspect-square overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.image} alt={s.label} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            </div>
            <div className="flex items-center justify-between gap-2 p-3">
              <span className="line-clamp-1 text-sm font-semibold">{s.label}</span>
              <ArrowRight size={15} className="shrink-0 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Drop takvimi ---------------- */

export function UpcomingDrops({ items, variant: theme }: { items: CardProduct[]; variant: ThemeKey }) {
  const variant = styleOf(theme);
  if (!items.length) return null;
  return (
    <section className={clsx("py-12 md:py-16", variant === "neon" ? "bg-card" : "bg-soft")}>
      <div className="container-x">
        <SectionHeading title="Yakında Çıkacaklar" subtitle="Drop takvimi" href="/yakinda" linkLabel="Tüm Takvim" variant={theme} />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.slice(0, 3).map((p) => (
            <Link key={p.id} href={`/urun/${p.slug}`} className={clsx("group grid grid-cols-[120px_1fr] items-center gap-4 border border-line bg-bg p-3 md:grid-cols-[150px_1fr]", variant === "pulse" && "rounded-theme-lg")}>
              <div className="aspect-square overflow-hidden bg-soft">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt={p.imageAlt} loading="lazy" className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className={clsx("text-xs font-bold uppercase tracking-widest", variant === "neon" ? "text-primary" : "text-accent")}>{formatDateShort(p.releaseDate!)}</p>
                <p className="mt-1 line-clamp-2 font-semibold">
                  {p.brand} {p.model}
                </p>
                <p className="text-sm text-muted">{p.colorName}</p>
                <Countdown to={p.releaseDate!} compact className="mt-3" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Günün fırsatı ---------------- */

export function DealOfTheDay({ p, variant: theme }: { p: CardProduct; variant: ThemeKey }) {
  const variant = styleOf(theme);
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  return (
    <section className="container-x py-10">
      <div className={clsx("grid overflow-hidden md:grid-cols-2", variant === "pulse" ? "rounded-theme-lg bg-accent text-accent-fg" : "bg-primary text-primary-fg")}>
        <div className="flex flex-col justify-center gap-4 p-8 md:p-12">
          <p className="text-xs font-bold uppercase tracking-[0.25em] opacity-80">Günün Fırsatı</p>
          <h2 className="font-heading text-3xl font-extrabold md:text-5xl">
            {p.brand} {p.model}
          </h2>
          <p className="opacity-80">{p.colorName} · Stoklarla sınırlı, gece yarısı sona eriyor.</p>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-extrabold">{formatPrice(p.price)}</span>
            {p.compareAtPrice && <span className="text-lg line-through opacity-60">{formatPrice(p.compareAtPrice)}</span>}
          </div>
          <Countdown to={midnight.toISOString()} />
          <Link href={`/urun/${p.slug}`} className={clsx("mt-2 inline-flex w-fit items-center gap-2 bg-white px-7 py-3.5 text-sm font-bold text-black", variant === "pulse" && "rounded-full")}>
            Fırsatı Yakala <ArrowRight size={16} />
          </Link>
        </div>
        <div className="relative min-h-72 bg-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.image} alt={p.imageAlt} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          <span className="absolute left-5 top-5 grid h-20 w-20 place-items-center rounded-full bg-sale text-center text-white shadow-xl">
            <BadgePercent size={30} />
          </span>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Editoryal ---------------- */

export function EditorialSplit({ title, body, href, cta, image, reverse }: { title: string; body: string; href: string; cta: string; image: string; reverse?: boolean }) {
  return (
    <section className="container-x py-12 md:py-20">
      <div className={clsx("grid items-center gap-8 md:grid-cols-2 md:gap-16", reverse && "md:[&>*:first-child]:order-2")}>
        <div className="aspect-[4/5] overflow-hidden bg-soft">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={title} loading="lazy" className="h-full w-full object-cover" />
        </div>
        <div className="max-w-lg">
          <p className="text-xs uppercase tracking-[0.3em] text-muted">Editörün Notu</p>
          <h2 className="h-display mt-4 font-heading text-4xl leading-tight md:text-5xl">{title}</h2>
          <p className="mt-5 leading-relaxed text-muted">{body}</p>
          <Link href={href} className="mt-8 inline-block border-b border-fg pb-1 text-xs uppercase tracking-[0.25em]">
            {cta}
          </Link>
        </div>
      </div>
    </section>
  );
}

export function MarqueeBand({ words, variant: theme }: { words: string[]; variant: ThemeKey }) {
  const variant = styleOf(theme);
  const row = [...words, ...words, ...words];
  return (
    <div className={clsx("overflow-hidden py-5", variant === "neon" ? "bg-primary text-black" : "bg-fg text-bg")}>
      <div className="animate-marquee flex w-max gap-12 whitespace-nowrap font-heading text-4xl uppercase md:text-6xl">
        {[...row, ...row].map((w, i) => (
          <span key={i} className="flex items-center gap-12">
            {w} <span aria-hidden>✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Blog ---------------- */

export function BlogTeasers({ posts, variant: theme }: { posts: BlogPost[]; variant: ThemeKey }) {
  const variant = styleOf(theme);
  if (!posts.length) return null;
  return (
    <section className="container-x py-10 md:py-14">
      <SectionHeading title={variant === "studio" ? "Dergi" : "Blog & Rehber"} subtitle="Sneaker kültürü, bakım ve stil önerileri" href="/blog" linkLabel="Tüm Yazılar" variant={theme} />
      <div className="grid gap-6 md:grid-cols-3">
        {posts.slice(0, 3).map((p) => (
          <Link key={p.id} href={`/blog/${p.slug}`} className="group">
            <div className={clsx("aspect-[16/10] overflow-hidden bg-soft", variant === "pulse" || variant === "arena" ? "rounded-theme-lg" : "")}>
              {p.cover && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.cover} alt={p.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              )}
            </div>
            <p className="mt-3 text-xs text-muted">{formatDate(p.publishedAt)}</p>
            <h3 className={clsx("mt-1 line-clamp-2 font-semibold leading-snug group-hover:underline", variant === "studio" ? "font-heading text-xl font-normal" : "text-lg")}>{p.title}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted">{p.excerpt}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ---------------- SEO metin bloğu ---------------- */

export function SeoTextBlock({ heading, paragraphs, blocks }: { heading?: string; paragraphs?: string[]; blocks?: { heading: string; body: string }[] }) {
  return (
    <section className="container-x py-10 md:py-12">
      <div className="max-w-4xl border-t border-line pt-8">
        <Collapsible collapsedHeight={150}>
          <div className="prose-store text-sm">
            {heading && <h2 className="!mt-0">{heading}</h2>}
            {paragraphs?.map((p, i) => <p key={i}>{p}</p>)}
            {blocks?.map((b, i) => (
              <div key={i}>
                {b.heading && <h3>{b.heading}</h3>}
                <p>{b.body}</p>
              </div>
            ))}
          </div>
        </Collapsible>
      </div>
    </section>
  );
}
