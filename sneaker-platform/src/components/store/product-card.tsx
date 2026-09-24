import Link from "next/link";
import { clsx } from "clsx";
import type { CardProduct } from "@/lib/store-types";
import type { ThemeKey } from "@/themes/registry";
import { discountPercent, formatDateShort, formatPrice } from "@/lib/format";
import { GENDER_LABEL } from "@/lib/taxonomy";
import { FavoriteButton } from "./favorite-button";
import { QuickAdd } from "./quick-add";

function Badges({ p, variant }: { p: CardProduct; variant: ThemeKey }) {
  const pct = discountPercent(p.price, p.compareAtPrice);
  const pill = variant === "pulse" ? "rounded-full" : variant === "arena" ? "rounded" : "";
  const items: { label: string; cls: string }[] = [];
  if (p.releaseDate) items.push({ label: `Çıkış ${formatDateShort(p.releaseDate)}`, cls: "bg-accent text-accent-fg" });
  if (!p.inStock && !p.releaseDate) items.push({ label: "Tükendi", cls: "bg-muted text-white" });
  if (pct > 0) items.push({ label: `%${pct}`, cls: "bg-sale text-white" });
  if (p.isNew && !p.releaseDate) items.push({ label: "Yeni", cls: variant === "neon" ? "bg-primary text-black" : "bg-fg text-bg" });
  if (p.isBestSeller && items.length < 2) items.push({ label: "Çok Satan", cls: "bg-card text-fg ring-1 ring-line" });
  if (p.lowStock && items.length < 3) items.push({ label: "Son Ürünler", cls: "bg-accent text-accent-fg" });
  if (!items.length) return null;
  return (
    <div className="absolute left-2 top-2 z-10 flex flex-col items-start gap-1">
      {items.slice(0, 3).map((b) => (
        <span key={b.label} className={clsx("px-2 py-[3px] text-[10px] font-bold uppercase tracking-wide md:text-[11px]", b.cls, pill)}>
          {b.label}
        </span>
      ))}
    </div>
  );
}

function Img({ p, rounded }: { p: CardProduct; rounded?: string }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={p.image}
        alt={p.imageAlt}
        width={600}
        height={600}
        loading="lazy"
        decoding="async"
        className={clsx("absolute inset-0 h-full w-full object-cover transition-opacity duration-300", p.image2 !== p.image && "group-hover:opacity-0", rounded)}
      />
      {p.image2 !== p.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={p.image2}
          alt=""
          aria-hidden
          width={600}
          height={600}
          loading="lazy"
          decoding="async"
          className={clsx("absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100", rounded)}
        />
      )}
    </>
  );
}

function subtitle(p: CardProduct) {
  const g = p.gender === "unisex" ? "Unisex" : GENDER_LABEL[p.gender];
  return `${g} ${p.categoryLabel}`.trim();
}

export function ProductCard({ p, variant, priority }: { p: CardProduct; variant: ThemeKey; priority?: boolean }) {
  const href = `/urun/${p.slug}`;
  const colorLine = p.colorCount > 1 ? `${p.colorCount} Renk` : p.colorName;
  void priority;

  if (variant === "arena") {
    return (
      <Link href={href} className="group relative flex flex-col overflow-hidden rounded-theme-lg border border-line bg-card transition-shadow hover:shadow-[0_12px_32px_-12px_rgba(15,23,42,0.25)]">
        <div className="relative aspect-square overflow-hidden bg-soft">
          <Img p={p} />
          <Badges p={p} variant={variant} />
          <FavoriteButton product={p} className="absolute right-2 top-2 z-10 h-9 w-9 rounded-full bg-card/90 shadow-sm" />
          <QuickAdd product={p} variant="bar" />
        </div>
        <div className="flex flex-1 flex-col gap-1 p-3 md:p-4">
          <span lang="en" className="text-xs font-bold uppercase tracking-wide text-primary">{p.brand}</span>
          <h3 className="line-clamp-2 text-[13px] font-medium leading-snug md:text-sm">
            {p.model} {subtitle(p)}
          </h3>
          <span className="text-xs text-muted">{colorLine}</span>
          <div className="mt-auto pt-2">
            <PriceInline p={p} />
          </div>
        </div>
      </Link>
    );
  }

  if (variant === "neon") {
    return (
      <Link href={href} className="group relative flex flex-col">
        <div className="relative aspect-[4/5] overflow-hidden rounded-theme bg-soft ring-1 ring-line transition-all duration-300 group-hover:ring-primary group-hover:shadow-[0_0_40px_-10px_var(--c-primary)]">
          <Img p={p} />
          <Badges p={p} variant={variant} />
          <FavoriteButton product={p} className="absolute right-2 top-2 z-10 h-9 w-9 rounded-full bg-black/60 text-white backdrop-blur" />
        </div>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span lang="en" className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">{p.brand}</span>
            <h3 lang="en" className="mt-0.5 line-clamp-2 font-heading text-lg uppercase leading-tight tracking-wide">{p.model}</h3>
            <span className="text-xs text-muted">{subtitle(p)} · {colorLine}</span>
          </div>
        </div>
        <div className="mt-2">
          <PriceInline p={p} />
        </div>
      </Link>
    );
  }

  if (variant === "studio") {
    return (
      <Link href={href} className="group relative flex flex-col text-center">
        <div className="relative aspect-[4/5] overflow-hidden bg-soft">
          <Img p={p} />
          <Badges p={p} variant={variant} />
          <FavoriteButton product={p} className="absolute right-3 top-3 z-10 h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
        <div className="mt-4 flex flex-col items-center gap-1">
          <span lang="en" className="text-[11px] uppercase tracking-[0.2em] text-muted">{p.brand}</span>
          <h3 className="font-heading text-lg leading-snug">{p.model}</h3>
          <span className="text-xs text-muted">{p.colorName}</span>
          <PriceInline p={p} center />
        </div>
      </Link>
    );
  }

  if (variant === "pulse") {
    return (
      <Link href={href} className="group relative flex flex-col">
        <div
          className="relative aspect-square overflow-hidden rounded-theme-lg"
          style={{ background: `color-mix(in srgb, ${p.colorHex} 14%, var(--c-soft))` }}
        >
          <Img p={p} rounded="rounded-theme-lg" />
          <Badges p={p} variant={variant} />
          <FavoriteButton product={p} className="absolute right-3 top-3 z-10 h-9 w-9 rounded-full bg-white/90 shadow-sm" />
          <QuickAdd product={p} variant="round" />
        </div>
        <div className="mt-3 flex flex-col gap-0.5 px-1">
          <div className="flex items-center justify-between gap-2">
            <span lang="en" className="text-xs font-bold text-primary">{p.brand}</span>
            {p.colorCount > 1 && <span className="rounded-full bg-soft px-2 py-0.5 text-[10px] font-semibold text-muted">{p.colorCount} renk</span>}
          </div>
          <h3 className="line-clamp-1 text-[15px] font-bold">{p.model}</h3>
          <span className="text-xs text-muted">{subtitle(p)}</span>
          <div className="mt-1">
            <PriceInline p={p} />
          </div>
        </div>
      </Link>
    );
  }

  // urban (varsayılan)
  return (
    <Link href={href} className="group relative flex flex-col">
      <div className="relative aspect-square overflow-hidden bg-soft">
        <Img p={p} />
        <Badges p={p} variant={variant} />
        <FavoriteButton product={p} className="absolute right-2 top-2 z-10 h-9 w-9 rounded-full bg-white/80 text-black backdrop-blur-sm" />
      </div>
      <div className="mt-3 flex flex-col gap-0.5">
        <span lang="en" className="text-[11px] font-extrabold uppercase tracking-[0.08em]">{p.brand}</span>
        <h3 className="line-clamp-1 text-sm font-medium">{p.model}</h3>
        <span className="text-[13px] text-muted">{subtitle(p)}</span>
        <span className="text-[13px] text-muted">{colorLine}</span>
        <div className="mt-1.5">
          <PriceInline p={p} />
        </div>
      </div>
    </Link>
  );
}

function PriceInline({ p, center }: { p: CardProduct; center?: boolean }) {
  const pct = discountPercent(p.price, p.compareAtPrice);
  return (
    <div className={clsx("flex flex-wrap items-baseline gap-x-2", center && "justify-center")}>
      <span className={clsx("text-sm font-semibold tabular-nums", pct ? "text-sale" : "")}>{formatPrice(p.price)}</span>
      {pct > 0 && <span className="text-xs text-muted line-through tabular-nums">{formatPrice(p.compareAtPrice!)}</span>}
    </div>
  );
}

export function ProductGrid({ items, variant, cols = 4 }: { items: CardProduct[]; variant: ThemeKey; cols?: 3 | 4 | 5 }) {
  const grid = {
    3: "grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-3 xl:grid-cols-4",
    5: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5",
  }[cols];
  const gap = variant === "studio" ? "gap-x-5 gap-y-12" : variant === "urban" ? "gap-x-3 gap-y-8 md:gap-x-4" : "gap-3 md:gap-5";
  return (
    <div className={clsx("grid", grid, gap)}>
      {items.map((p, i) => (
        <ProductCard key={p.id} p={p} variant={variant} priority={i < 4} />
      ))}
    </div>
  );
}
