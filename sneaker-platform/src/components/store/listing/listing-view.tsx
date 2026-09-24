import Link from "next/link";
import { clsx } from "clsx";
import { ChevronLeft, ChevronRight, SearchX } from "lucide-react";
import type { SiteContext } from "@/lib/site";
import type { CatalogProduct, Crumb, ListingQuery, ListingResult } from "@/lib/catalog";
import type { ListingCopy } from "@/lib/seo/copy";
import { toCards } from "@/lib/store-data";
import { Breadcrumbs } from "../breadcrumbs";
import { ProductGrid } from "../product-card";
import { JsonLd } from "../json-ld";
import { SeoTextBlock } from "../sections";
import { ActiveFilters, FilterBar, FilterDrawerButton, FilterSidebar, SortSelect } from "./filters";
import { breadcrumbLd, faqLd, itemListLd } from "@/lib/seo/schema-org";

export type QuickLink = { label: string; href: string; active?: boolean };

function pageHref(basePath: string, q: ListingQuery, page: number): string {
  const p = new URLSearchParams();
  if (q.q) p.set("q", q.q);
  if (q.marka.length) p.set("marka", q.marka.join(","));
  if (q.beden.length) p.set("beden", q.beden.join(","));
  if (q.renk.length) p.set("renk", q.renk.join(","));
  if (q.cinsiyet.length) p.set("cinsiyet", q.cinsiyet.join(","));
  if (q.kategori.length) p.set("kategori", q.kategori.join(","));
  if (q.fiyat) p.set("fiyat", q.fiyat);
  if (q.indirim) p.set("indirim", "1");
  if (q.stok) p.set("stok", "1");
  if (q.siralama !== "onerilen") p.set("siralama", q.siralama);
  if (page > 1) p.set("sayfa", String(page));
  const s = p.toString();
  return s ? `${basePath}?${s}` : basePath;
}

function Pagination({ basePath, q, page, pageCount, variant }: { basePath: string; q: ListingQuery; page: number; pageCount: number; variant: SiteContext["theme"] }) {
  if (pageCount < 2) return null;
  const pages: (number | "…")[] = [];
  for (let i = 1; i <= pageCount; i++) {
    if (i === 1 || i === pageCount || Math.abs(i - page) <= 1) pages.push(i);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }
  const box = clsx("grid h-10 min-w-10 place-items-center border px-3 text-sm font-semibold", variant === "pulse" ? "rounded-full" : variant === "arena" ? "rounded-theme" : "");
  return (
    <nav aria-label="Sayfalama" className="mt-12 flex items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link href={pageHref(basePath, q, page - 1)} rel="prev" className={clsx(box, "border-line hover:border-fg")} aria-label="Önceki sayfa">
          <ChevronLeft size={16} />
        </Link>
      ) : (
        <span className={clsx(box, "border-line opacity-30")}>
          <ChevronLeft size={16} />
        </span>
      )}
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-1 text-muted">
            …
          </span>
        ) : (
          <Link key={p} href={pageHref(basePath, q, p)} aria-current={p === page ? "page" : undefined} className={clsx(box, p === page ? "border-fg bg-fg text-bg" : "border-line hover:border-fg")}>
            {p}
          </Link>
        ),
      )}
      {page < pageCount ? (
        <Link href={pageHref(basePath, q, page + 1)} rel="next" className={clsx(box, "border-line hover:border-fg")} aria-label="Sonraki sayfa">
          <ChevronRight size={16} />
        </Link>
      ) : (
        <span className={clsx(box, "border-line opacity-30")}>
          <ChevronRight size={16} />
        </span>
      )}
    </nav>
  );
}

export function ListingView({
  site,
  all,
  crumbs,
  copy,
  result,
  query,
  basePath,
  quickLinks = [],
  hero,
  hideGender,
  showSeo = true,
}: {
  site: SiteContext;
  all: CatalogProduct[];
  crumbs: Crumb[];
  copy: ListingCopy;
  result: ListingResult;
  query: ListingQuery;
  basePath: string;
  quickLinks?: QuickLink[];
  hero?: React.ReactNode;
  hideGender?: boolean;
  showSeo?: boolean;
}) {
  const v = site.theme;
  const cards = toCards(result.items, all);
  const layout = v === "arena" ? "bar" : v === "neon" || v === "studio" ? "drawer" : "sidebar";
  const cols = layout === "sidebar" ? 3 : v === "studio" ? 3 : 4;

  const header = (
    <div className={clsx("pb-6 pt-6 md:pt-8", v === "studio" && "text-center")}>
      <Breadcrumbs items={crumbs} className={clsx(v === "studio" && "flex justify-center")} />
      <div className={clsx("mt-4 flex flex-wrap items-end gap-x-4 gap-y-2", v === "studio" && "justify-center")}>
        <h1
          className={clsx(
            "h-display font-heading leading-none",
            v === "urban" && "text-3xl font-black md:text-5xl",
            v === "arena" && "text-2xl font-bold md:text-4xl",
            v === "neon" && "text-5xl md:text-7xl",
            v === "studio" && "text-4xl md:text-6xl",
            v === "pulse" && "text-3xl font-extrabold md:text-5xl",
          )}
        >
          {copy.h1}
        </h1>
        <span className="pb-1 text-sm text-muted">{result.total} ürün</span>
      </div>
      {copy.intro && <p className={clsx("mt-3 max-w-3xl text-sm leading-relaxed text-muted", v === "studio" && "mx-auto")}>{copy.intro}</p>}
      {quickLinks.length > 0 && (
        <div className={clsx("no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0", v === "studio" && "justify-center")}>
          {quickLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={l.active ? "page" : undefined}
              className={clsx(
                "shrink-0 border px-4 py-2 text-[13px] font-medium transition-colors",
                v === "pulse" || v === "arena" ? "rounded-full" : "",
                l.active ? "border-fg bg-fg text-bg" : "border-line hover:border-fg",
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  const toolbar = (
    <div className="mb-5 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FilterDrawerButton facets={result.facets} variant={v} total={result.total} hideGender={hideGender} alwaysVisible={layout === "drawer"} />
          {layout === "bar" && <FilterBar facets={result.facets} variant={v} hideGender={hideGender} />}
        </div>
        <SortSelect variant={v} />
      </div>
      <ActiveFilters facets={result.facets} />
    </div>
  );

  const grid =
    cards.length > 0 ? (
      <>
        <ProductGrid items={cards} variant={v} cols={cols as 3 | 4} />
        <Pagination basePath={basePath} q={query} page={result.page} pageCount={result.pageCount} variant={v} />
      </>
    ) : (
      <div className="flex flex-col items-center justify-center gap-3 rounded-theme-lg bg-soft px-6 py-20 text-center">
        <SearchX size={40} strokeWidth={1.4} className="text-muted" />
        <p className="text-lg font-semibold">Aradığın kriterlere uygun ürün bulunamadı</p>
        <p className="max-w-md text-sm text-muted">Filtreleri azaltmayı ya da farklı bir beden veya marka seçmeyi deneyebilirsin.</p>
        <Link href={basePath} className="mt-2 rounded-theme bg-primary px-6 py-3 text-sm font-semibold text-primary-fg">
          Filtreleri Temizle
        </Link>
      </div>
    );

  return (
    <div className="container-x pb-6">
      {hero}
      {header}
      {layout === "sidebar" ? (
        <div className="grid gap-8 lg:grid-cols-[260px_1fr] xl:gap-10">
          <FilterSidebar facets={result.facets} variant={v} hideGender={hideGender} />
          <div>
            {toolbar}
            {grid}
          </div>
        </div>
      ) : (
        <div>
          {toolbar}
          {grid}
        </div>
      )}
      {showSeo && (copy.content.length > 0 || copy.faq.length > 0) && (
        <div className="-mx-4 md:-mx-6 xl:-mx-10">
          <SeoTextBlock blocks={[...copy.content, ...copy.faq.map((f) => ({ heading: f.q, body: f.a }))]} />
        </div>
      )}
      <JsonLd data={[breadcrumbLd(site, crumbs), itemListLd(site, copy.h1, result.items), ...(showSeo && copy.faq.length ? [faqLd(copy.faq)] : [])]} />
    </div>
  );
}
