import Link from "next/link";
import { clsx } from "clsx";
import type { CardProduct } from "@/lib/store-types";
import { styleOf, type ThemeKey } from "@/themes/registry";
import { discountPercent, formatDateShort, formatPrice } from "@/lib/format";
import { GENDER_LABEL } from "@/lib/taxonomy";
import { QuickAdd } from "./quick-add";

function Badges({ p, variant: theme }: { p: CardProduct; variant: ThemeKey }) {
  const variant = styleOf(theme);
  const pct = discountPercent(p.price, p.compareAtPrice);
  const pill =
    theme === "brut" ? "border border-black" : theme === "outlet" ? "rounded-md" : theme === "luxe" ? "tracking-[0.2em] font-medium" : variant === "pulse" ? "rounded-full" : variant === "arena" ? "rounded" : "";
  const items: { label: string; cls: string }[] = [];
  if (p.releaseDate) items.push({ label: `Çıkış ${formatDateShort(p.releaseDate)}`, cls: "bg-accent text-accent-fg" });
  if (!p.inStock && !p.releaseDate) items.push({ label: "Tükendi", cls: "bg-muted text-white" });
  if (pct > 0) items.push({ label: `%${pct}`, cls: "bg-sale text-white" });
  if (p.isNew && !p.releaseDate) items.push({ label: "Yeni", cls: variant === "neon" ? "bg-primary text-black" : "bg-fg text-bg" });
  if (p.isBestSeller && items.length < 2) items.push({ label: theme === "metro" ? "Bestseller" : "Çok Satan", cls: theme === "metro" ? "bg-accent text-white" : "bg-card text-fg ring-1 ring-line" });
  if (p.lowStock && items.length < 3) items.push({ label: "Son Ürünler", cls: "bg-accent text-accent-fg" });
  if (!items.length) return null;
  if (theme === "outlet") {
    // Outlet: indirim oranı büyük rozet olarak görselin altında gösterilir.
    const rest = items.filter((b) => !b.label.startsWith("%"));
    if (!rest.length) return null;
    return (
      <div className="absolute left-2 top-2 z-10 flex flex-col items-start gap-1">
        {rest.slice(0, 2).map((b) => (
          <span key={b.label} className={clsx("px-2 py-[3px] text-[10px] font-bold uppercase tracking-wide", b.cls, pill)}>
            {b.label}
          </span>
        ))}
      </div>
    );
  }
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

  if (variant === "volt") {
    return (
      <Link href={href} className="group relative flex flex-col">
        <div className="relative aspect-square overflow-hidden bg-soft">
          <Img p={p} />
          <Badges p={p} variant={variant} />
        </div>
        <div className="mt-3 flex flex-col gap-0.5">
          <h3 className="line-clamp-1 text-[13px] font-semibold">
            <span lang="en">{p.brand}</span> {p.model}
          </h3>
          <span className="text-xs text-muted">{subtitle(p)}</span>
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <PriceInline p={p} />
            {p.colorCount > 1 && <span className="text-[11px] text-muted">+{p.colorCount - 1} renk</span>}
          </div>
        </div>
      </Link>
    );
  }

  if (variant === "metro") {
    return (
      <Link href={href} className="group relative flex flex-col">
        <div className="relative aspect-square overflow-hidden rounded-theme bg-soft">
          <Img p={p} />
          <Badges p={p} variant={variant} />
          <QuickAdd product={p} variant="bar" />
        </div>
        <div className="mt-3 flex flex-col gap-1">
          <span lang="en" className="text-[15px] font-bold">{p.brand}</span>
          <h3 className="line-clamp-2 text-[13px] leading-snug">
            {p.model} {subtitle(p)} {p.colorName}
          </h3>
          <div className="mt-1">
            <PriceInline p={p} large />
          </div>
          {p.colorCount > 1 && <span className="text-[11px] text-muted">{p.colorCount} renk seçeneği</span>}
        </div>
      </Link>
    );
  }

  if (variant === "brut") {
    return (
      <Link href={href} className="brut-box brut-box-hover group relative flex flex-col bg-card">
        <div className="relative aspect-square overflow-hidden border-b-2 border-fg bg-soft">
          <Img p={p} />
          <Badges p={p} variant={variant} />
        </div>
        <div className="flex flex-1 flex-col gap-1 p-3">
          <span lang="en" className="font-heading text-[12px] font-black uppercase">{p.brand}</span>
          <h3 className="line-clamp-2 text-[13px] leading-snug">{p.model}</h3>
          <span className="text-[11px] text-muted">{colorLine}</span>
          <div className="mt-auto flex items-center justify-between gap-2 pt-2">
            <span className={clsx("border-2 border-fg px-1.5 py-0.5 text-sm font-bold tabular-nums", discountPercent(p.price, p.compareAtPrice) ? "bg-sale text-white" : "bg-accent text-black")}>
              {formatPrice(p.price)}
            </span>
            {p.compareAtPrice && p.compareAtPrice > p.price && <span className="text-[11px] text-muted line-through tabular-nums">{formatPrice(p.compareAtPrice)}</span>}
          </div>
        </div>
      </Link>
    );
  }

  if (variant === "luxe") {
    return (
      <Link href={href} className="group relative flex flex-col text-center">
        <div className="relative aspect-[4/5] overflow-hidden bg-soft">
          <Img p={p} />
          <Badges p={p} variant={variant} />
          <span className="absolute inset-x-6 bottom-5 translate-y-3 border border-primary/70 bg-black/60 py-2.5 text-[10px] uppercase tracking-[0.3em] text-primary opacity-0 backdrop-blur transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            İncele
          </span>
        </div>
        <div className="mt-5 flex flex-col items-center gap-1.5">
          <span lang="en" className="text-[10px] uppercase tracking-[0.35em] text-primary">{p.brand}</span>
          <h3 className="font-heading text-xl leading-snug">{p.model}</h3>
          <span className="text-[11px] uppercase tracking-[0.2em] text-muted">{p.colorName}</span>
          <PriceInline p={p} center />
        </div>
      </Link>
    );
  }

  if (variant === "outlet") {
    const pct = discountPercent(p.price, p.compareAtPrice);
    return (
      <Link href={href} className="group relative flex flex-col overflow-hidden rounded-theme-lg border border-line bg-card transition-shadow hover:shadow-[0_10px_30px_-12px_rgba(0,0,0,0.25)]">
        <div className="relative aspect-square overflow-hidden bg-soft">
          <Img p={p} />
          <Badges p={p} variant={variant} />
          {pct > 0 && (
            <span className="absolute bottom-2 left-2 z-10 flex flex-col items-center rounded-lg bg-sale px-2 py-1 leading-none text-white shadow">
              <span className="text-lg font-black">%{pct}</span>
              <span className="text-[9px] font-bold uppercase">indirim</span>
            </span>
          )}
          <QuickAdd product={p} variant="round" />
        </div>
        <div className="flex flex-1 flex-col gap-0.5 p-2.5 md:p-3">
          <h3 className="line-clamp-2 text-[13px] leading-snug">
            <b lang="en">{p.brand}</b> {p.model} {subtitle(p)}
          </h3>
          <div className="mt-auto pt-2">
            {pct > 0 && <span className="block text-xs text-muted line-through tabular-nums">{formatPrice(p.compareAtPrice!)}</span>}
            <span className={clsx("text-base font-extrabold tabular-nums", pct > 0 ? "text-sale" : "text-fg")}>{formatPrice(p.price)}</span>
          </div>
          {p.lowStock && <span className="mt-1 text-[11px] font-semibold text-primary">Tükenmek üzere!</span>}
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

function PriceInline({ p, center, large }: { p: CardProduct; center?: boolean; large?: boolean }) {
  const pct = discountPercent(p.price, p.compareAtPrice);
  return (
    <div className={clsx("flex flex-wrap items-baseline gap-x-2", center && "justify-center")}>
      <span className={clsx("font-semibold tabular-nums", large ? "text-[15px] font-bold" : "text-sm", pct ? "text-sale" : "")}>{formatPrice(p.price)}</span>
      {pct > 0 && <span className="text-xs text-muted line-through tabular-nums">{formatPrice(p.compareAtPrice!)}</span>}
    </div>
  );
}

export function ProductGrid({ items, variant: theme, cols = 4 }: { items: CardProduct[]; variant: ThemeKey; cols?: 3 | 4 | 5 }) {
  const variant = styleOf(theme);
  const grid = {
    3: "grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-3 xl:grid-cols-4",
    5: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5",
  }[cols];
  const gap =
    theme === "brut"
      ? "gap-4 md:gap-5"
      : theme === "luxe"
        ? "gap-x-6 gap-y-14"
        : theme === "outlet"
          ? "gap-2 md:gap-3"
          : theme === "volt"
            ? "gap-x-1 gap-y-8"
            : variant === "studio"
              ? "gap-x-5 gap-y-12"
              : variant === "urban"
                ? "gap-x-3 gap-y-8 md:gap-x-4"
                : "gap-3 md:gap-5";
  return (
    <div className={clsx("grid", grid, gap)}>
      {items.map((p, i) => (
        <ProductCard key={p.id} p={p} variant={theme} priority={i < 4} />
      ))}
    </div>
  );
}
