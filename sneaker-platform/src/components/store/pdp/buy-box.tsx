"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { Bell, CreditCard, Footprints, MessageCircle, RotateCcw, Ruler, Share2, ShieldCheck, ShoppingBag, Truck, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { styleOf, type ThemeKey } from "@/themes/registry";
import type { CardProduct } from "@/lib/store-types";
import { discountPercent, formatDateShort, formatPrice } from "@/lib/format";
import { createStockAlert, type ActionState } from "@/lib/actions/store";
import { useStore } from "../providers";

export type Sibling = { slug: string; colorName: string; colorHex: string; image: string; current: boolean; inStock: boolean };

type Props = {
  product: CardProduct;
  h1: string;
  subtitle: string;
  sku: string;
  brandHref: string;
  siblings: Sibling[];
  fitAdvice: string;
  sizeChart: { head: string[]; rows: string[][] };
  variant: ThemeKey;
  shipping: { threshold: number; dispatch: string; returnDays: number; carrier: string };
  installmentText: string;
  whatsapp: string;
  deliveryWindow: [string, string];
};

function SizeGuideModal({ open, onClose, chart, fit }: { open: boolean; onClose: () => void; chart: Props["sizeChart"]; fit: string }) {
  useEffect(() => {
    if (!open) return;
    const on = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Beden tablosu" className="animate-in max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-theme-lg bg-bg p-6 text-fg shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <p className="font-heading text-xl font-bold">Beden Tablosu</p>
          <button type="button" onClick={onClose} aria-label="Kapat" className="grid h-9 w-9 place-items-center">
            <X size={22} />
          </button>
        </div>
        <p className="mb-4 rounded-theme bg-soft p-3 text-sm">{fit}</p>
        <div className="prose-store">
          <table>
            <thead>
              <tr>
                {chart.head.map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chart.rows.map((r, i) => (
                <tr key={i}>
                  {r.map((c, j) => (
                    <td key={j}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Link href="/beden-rehberi" className="mt-2 inline-block text-sm font-semibold underline">
          Ayak ölçüsü nasıl alınır?
        </Link>
      </div>
    </div>
  );
}

function StockAlertForm({ productId, size, rounded }: { productId: number; size: string | null; rounded: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createStockAlert, null);
  if (state?.ok) return <p className="rounded-theme bg-soft p-4 text-sm">{state.message}</p>;
  return (
    <form action={action} className="space-y-2 rounded-theme-lg border border-line p-4">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Bell size={16} /> {size ? `${size} numara stoğa girince haber ver` : "Satışa çıkınca haber ver"}
      </p>
      <input type="hidden" name="productId" value={productId} />
      {size && <input type="hidden" name="size" value={size} />}
      <div className="flex gap-2">
        <input type="email" name="email" required placeholder="E-posta adresin" className={clsx("h-11 min-w-0 flex-1 border border-line bg-bg px-3 text-sm outline-none focus:border-fg", rounded)} />
        <button type="submit" disabled={pending} className={clsx("h-11 shrink-0 bg-fg px-4 text-sm font-semibold text-bg", rounded)}>
          {pending ? "…" : "Haber Ver"}
        </button>
      </div>
      {state && !state.ok && <p className="text-xs text-sale">{state.message}</p>}
    </form>
  );
}

function ShareButton({ title }: { title: string }) {
  const { showToast } = useStore();
  return (
    <button
      type="button"
      aria-label="Paylaş"
      onClick={async () => {
        const url = window.location.href;
        try {
          if (navigator.share) await navigator.share({ title, url });
          else {
            await navigator.clipboard.writeText(url);
            showToast({ title: "Bağlantı kopyalandı" });
          }
        } catch {
          /* kullanıcı paylaşımı iptal etti */
        }
      }}
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-soft"
    >
      <Share2 size={19} strokeWidth={1.8} />
    </button>
  );
}

export function BuyBox(props: Props) {
  const { product: p } = props;
  const theme = props.variant;
  const v = styleOf(theme);
  const router = useRouter();
  const { addToCart, setCartOpen, pushRecent } = useStore();
  const [size, setSize] = useState<string | null>(() => (p.sizes.length === 1 && p.sizes[0].stock > 0 ? p.sizes[0].size : null));
  const [error, setError] = useState(false);
  const [guide, setGuide] = useState(false);
  const [added, setAdded] = useState(false);
  const addRef = useRef<HTMLButtonElement>(null);
  const [showSticky, setShowSticky] = useState(false);
  const pct = discountPercent(p.price, p.compareAtPrice);
  const upcoming = p.releaseDate && new Date(p.releaseDate) > new Date();
  const selected = p.sizes.find((s) => s.size === size);
  const rounded = theme === "metro" ? "rounded-full" : v === "pulse" ? "rounded-full" : v === "arena" ? "rounded-theme" : "";
  const single = p.sizes.length === 1;

  useEffect(() => {
    pushRecent(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.id]);

  useEffect(() => {
    const el = addRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShowSticky(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const add = (buyNow?: boolean) => {
    if (!size || !selected || selected.stock < 1) {
      setError(true);
      document.getElementById("beden-secimi")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    addToCart({
      productId: p.id,
      slug: p.slug,
      title: p.title,
      brand: p.brand,
      colorName: p.colorName,
      image: p.image,
      size,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      maxStock: selected.stock,
    });
    if (buyNow) {
      router.push("/sepet");
      return;
    }
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
    setCartOpen(true);
  };

  const primaryBtn = clsx(
    "flex h-14 w-full items-center justify-center gap-2 text-[15px] font-bold transition-all active:scale-[0.99]",
    theme === "volt"
      ? "bg-primary font-heading text-lg uppercase tracking-wide text-primary-fg hover:brightness-110"
      : theme === "metro"
        ? "h-12 rounded-full bg-fg text-bg hover:opacity-90 sm:inline-flex sm:w-auto sm:min-w-[260px] sm:px-12"
        : theme === "brut"
          ? "border-2 border-fg bg-accent uppercase text-black shadow-[4px_4px_0_var(--c-fg)] hover:-translate-y-0.5"
          : theme === "luxe"
            ? "bg-primary text-[12px] uppercase tracking-[0.3em] text-black hover:opacity-90"
            : theme === "outlet"
              ? "rounded-theme bg-primary text-primary-fg hover:brightness-105"
              : clsx(rounded, v === "neon" ? "bg-primary uppercase tracking-widest text-black hover:shadow-[0_0_30px_-4px_var(--c-primary)]" : "bg-primary text-primary-fg hover:opacity-90", v === "urban" && "uppercase tracking-wide"),
  );

  const sizeBtn = (on: boolean, out: boolean) =>
    clsx(
      "relative border text-sm font-medium transition-colors",
      theme === "volt" ? "h-9 rounded-md font-semibold" : theme === "metro" ? "h-11 rounded-theme" : theme === "brut" ? "h-12 border-2 font-bold" : theme === "luxe" ? "h-12 text-[13px] tracking-wider" : "h-12",
      theme !== "volt" && theme !== "metro" && (v === "pulse" ? "rounded-xl" : v === "arena" ? "rounded-theme" : ""),
      on
        ? theme === "luxe"
          ? "border-primary text-primary"
          : theme === "volt"
            ? "border-fg bg-fg text-bg"
            : theme === "brut"
              ? "border-fg bg-accent text-black"
              : v === "neon"
                ? "border-primary bg-primary text-black"
                : "border-fg bg-fg text-bg"
        : out
          ? theme === "metro"
            ? "border-soft bg-soft text-muted"
            : "border-line text-muted"
          : theme === "brut"
            ? "border-fg bg-card hover:bg-soft"
            : "border-line hover:border-fg",
      error && !size && "border-sale/60",
    );

  const priceRow = (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className={clsx("font-bold tabular-nums", theme === "volt" ? "text-base" : theme === "metro" ? "text-xl" : theme === "luxe" ? "text-2xl font-light" : "text-2xl md:text-[28px]", pct > 0 && "text-sale")}>
        {formatPrice(p.price)}
      </span>
      {pct > 0 && (
        <>
          <span className="text-base text-muted line-through tabular-nums">{formatPrice(p.compareAtPrice!)}</span>
          <span className={clsx("bg-sale px-2 py-1 text-xs font-bold text-white", theme === "brut" ? "border-2 border-fg" : rounded || "rounded")}>%{pct} İndirim</span>
        </>
      )}
    </div>
  );

  let head: React.ReactNode;
  if (theme === "volt") {
    head = (
      <>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[15px] font-semibold leading-snug">{props.h1}</h1>
            <p className="mt-0.5 text-xs text-muted">{props.subtitle}</p>
          </div>
          <span className="shrink-0 text-[10px] text-muted">{props.sku}</span>
        </div>
        <div className="mt-3">{priceRow}</div>
        <p className="mt-1 text-[11px] text-muted">{props.installmentText}</p>
      </>
    );
  } else if (theme === "metro") {
    head = (
      <>
        <Link href={props.brandHref} lang="en" className="text-lg font-bold hover:underline">
          {p.brand}
        </Link>
        <h1 className="mt-1 text-[17px] leading-snug">{props.h1}</h1>
        <div className="mt-4 flex items-center justify-between gap-3">
          {priceRow}
          <ShareButton title={props.h1} />
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
          <CreditCard size={14} /> {props.installmentText}
        </p>
      </>
    );
  } else if (theme === "outlet") {
    head = (
      <>
        <Link href={props.brandHref} lang="en" className="text-sm font-bold text-primary hover:underline">
          {p.brand}
        </Link>
        <h1 className="mt-1 text-xl font-semibold leading-snug md:text-2xl">{props.h1}</h1>
        <p className="mt-1 text-sm text-muted">{props.subtitle}</p>
        <div className="mt-4 rounded-theme-lg bg-soft p-4">
          {pct > 0 && (
            <div className="mb-1 flex items-center gap-2">
              <span className="text-sm text-muted line-through tabular-nums">{formatPrice(p.compareAtPrice!)}</span>
              <span className="rounded-md bg-sale px-2 py-0.5 text-xs font-extrabold text-white">%{pct}</span>
            </div>
          )}
          <p className={clsx("text-3xl font-extrabold tabular-nums", pct > 0 ? "text-sale" : "text-fg")}>{formatPrice(p.price)}</p>
          {pct > 0 && <p className="mt-1 text-sm font-semibold text-emerald-700">Bu üründe {formatPrice(p.compareAtPrice! - p.price)} kazancın var</p>}
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
            <CreditCard size={14} /> {props.installmentText}
          </p>
        </div>
      </>
    );
  } else {
    head = (
      <>
        <Link
          href={props.brandHref}
          lang="en"
          className={clsx(
            "text-sm font-bold hover:underline",
            theme === "luxe" ? "text-[11px] font-normal uppercase tracking-[0.4em] text-primary" : theme === "brut" ? "inline-block border-2 border-fg bg-fg px-2 py-0.5 uppercase text-accent" : v === "neon" ? "uppercase tracking-[0.2em] text-primary" : v === "studio" ? "uppercase tracking-[0.25em] text-muted" : "text-primary",
          )}
        >
          {p.brand}
        </Link>
        <h1
          className={clsx(
            "mt-1.5 font-heading leading-tight",
            theme === "brut" && "mt-3 text-3xl font-black tracking-tight md:text-4xl",
            theme === "luxe" && "mt-3 text-4xl font-medium md:text-5xl",
            theme === "urban" && "text-2xl font-extrabold md:text-[28px]",
            theme === "arena" && "text-xl font-bold md:text-2xl",
            theme === "neon" && "text-3xl uppercase md:text-5xl",
            theme === "studio" && "text-3xl md:text-4xl",
            theme === "pulse" && "text-2xl font-extrabold md:text-3xl",
          )}
        >
          {props.h1}
        </h1>
        <p className={clsx("mt-1 text-sm text-muted", theme === "luxe" && "mt-3 text-[12px] uppercase tracking-[0.2em]")}>{props.subtitle}</p>
        <div className={clsx("mt-5", theme === "luxe" && "mt-6 border-y border-line py-5")}>{priceRow}</div>
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
          <CreditCard size={14} /> {props.installmentText}
        </p>
      </>
    );
  }

  const colorLabel =
    theme === "metro" ? (
      <div className="mb-3 flex items-center justify-between gap-3 text-[13px]">
        <p className="font-bold uppercase">
          Renk({props.siblings.length}) · <span className="font-normal normal-case text-muted">{p.colorName}</span>
        </p>
        <p className="text-muted">
          <span className="font-semibold uppercase">Model Numarası :</span> {props.sku}
        </p>
      </div>
    ) : theme === "volt" ? (
      <p className="mb-2 text-sm font-semibold">
        Renk: <span className="uppercase">{p.colorName}</span>
      </p>
    ) : (
      <p className={clsx("mb-2 text-sm", theme === "luxe" && "text-[12px] uppercase tracking-[0.2em] text-muted")}>
        Renk: <b className={clsx(theme === "luxe" && "font-normal text-fg")}>{p.colorName}</b>
      </p>
    );

  return (
    <div className={clsx(v === "pulse" && theme === "pulse" && "rounded-theme-lg bg-soft p-5 md:p-7", theme === "brut" && "brut-box bg-card p-5 md:p-6")}>
      {head}

      {(props.siblings.length > 1 || theme === "metro" || theme === "volt") && (
        <div className={clsx("mt-6", theme === "volt" && "border-t border-line pt-5")}>
          {colorLabel}
          <div className="flex flex-wrap gap-2">
            {props.siblings.map((s) => (
              <Link
                key={s.slug}
                href={`/urun/${s.slug}`}
                aria-label={s.colorName}
                aria-current={s.current ? "true" : undefined}
                title={s.colorName}
                className={clsx(
                  "relative overflow-hidden bg-soft ring-offset-2 ring-offset-bg",
                  theme === "metro" ? "h-[66px] w-[66px] border" : theme === "volt" ? "h-[60px] w-[60px] border-2" : "h-16 w-16",
                  theme === "metro" ? (s.current ? "border-fg" : "border-line hover:border-fg") : theme === "volt" ? (s.current ? "border-fg" : "border-transparent hover:border-muted") : s.current ? "ring-2 ring-fg" : "ring-1 ring-line hover:ring-fg",
                  theme !== "metro" && theme !== "volt" && (v === "pulse" ? "rounded-2xl" : v === "arena" ? "rounded-theme" : theme === "brut" ? "border-2 border-fg ring-0" : ""),
                  !s.inStock && "opacity-50",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.image} alt={s.colorName} className="h-full w-full object-cover" loading="lazy" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {!single && !upcoming && (
        <div id="beden-secimi" className={clsx("mt-6", theme === "volt" && "border-t border-line pt-5")}>
          <div className="mb-2 flex items-center justify-between">
            <p className={clsx("text-sm", theme === "metro" && "font-bold uppercase", theme === "volt" && "font-semibold", error && !size && "font-semibold text-sale")}>
              {error && !size ? "Lütfen beden seçin" : size ? <>Beden: <b>{size}</b></> : theme === "metro" ? "Beden" : theme === "volt" ? "Beden:" : "Beden Seçin"}
            </p>
            <button
              type="button"
              onClick={() => setGuide(true)}
              className={clsx("flex items-center gap-1.5 text-sm", theme === "metro" ? "text-muted hover:text-fg" : "font-medium underline underline-offset-4")}
            >
              <Ruler size={15} /> Beden Tablosu
            </button>
          </div>
          {theme === "metro" && (
            <p className="mb-3 flex items-center gap-1.5 text-[13px]">
              <Footprints size={15} /> {props.fitAdvice}
            </p>
          )}
          <div className={clsx("grid gap-2", theme === "volt" ? "grid-cols-4" : theme === "metro" ? "grid-cols-4 sm:grid-cols-6" : "grid-cols-4 sm:grid-cols-5")}>
            {p.sizes.map((s) => {
              const out = s.stock < 1;
              const on = size === s.size;
              return (
                <button
                  key={s.size}
                  type="button"
                  onClick={() => {
                    setSize(s.size);
                    setError(false);
                  }}
                  aria-pressed={on}
                  className={sizeBtn(on, out)}
                >
                  <span className={clsx(out && theme !== "metro" && "line-through decoration-1")}>{s.size}</span>
                  {out && theme === "metro" && <Bell size={10} className="absolute right-1 top-1 text-muted" aria-label="Stokta yok" />}
                  {!out && s.stock <= 2 && <span className="absolute -top-1.5 right-1 rounded bg-accent px-1 text-[9px] font-bold text-accent-fg">Son {s.stock}</span>}
                </button>
              );
            })}
          </div>
          {theme !== "metro" && <p className="mt-2 text-xs text-muted">{props.fitAdvice}</p>}
        </div>
      )}

      <div className="mt-6 space-y-3">
        {upcoming ? (
          <>
            <div className="rounded-theme-lg bg-soft p-4 text-sm">
              <b>{formatDateShort(p.releaseDate!)}</b> tarihinde satışa çıkacak. Stoklar sınırlı olacağı için haber listesine katılmanı öneririz.
            </div>
            <StockAlertForm productId={p.id} size={null} rounded={rounded} />
          </>
        ) : selected && selected.stock < 1 ? (
          <StockAlertForm productId={p.id} size={size} rounded={rounded} />
        ) : !p.inStock ? (
          <StockAlertForm productId={p.id} size={null} rounded={rounded} />
        ) : theme === "outlet" ? (
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => add(true)} className="flex h-14 items-center justify-center rounded-theme border-2 border-primary text-[15px] font-bold text-primary hover:bg-primary/5">
              Hemen Al
            </button>
            <button ref={addRef} type="button" onClick={() => add()} className={primaryBtn}>
              <ShoppingBag size={19} /> {added ? "Eklendi" : "Sepete Ekle"}
            </button>
          </div>
        ) : (
          <button ref={addRef} type="button" onClick={() => add()} className={primaryBtn}>
            {theme !== "volt" && theme !== "metro" && <ShoppingBag size={19} />} {added ? "Sepete Eklendi" : "Sepete Ekle"}
          </button>
        )}
        {props.whatsapp && theme !== "volt" && (
          <a
            href={`https://wa.me/${props.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Merhaba, ${props.h1} (${props.sku}) hakkında bilgi almak istiyorum.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={clsx("flex h-12 w-full items-center justify-center gap-2 border text-sm font-semibold", theme === "brut" ? "border-2 border-fg" : "border-line hover:border-fg", theme === "metro" ? "rounded-full sm:inline-flex sm:w-auto sm:min-w-[260px] sm:px-10" : rounded)}
          >
            <MessageCircle size={17} /> WhatsApp ile Sor
          </a>
        )}
      </div>

      <ul
        className={clsx(
          "mt-6 divide-y divide-line border-y border-line text-sm",
          theme === "pulse" && "rounded-theme-lg border-0 bg-bg px-4",
          theme === "outlet" && "rounded-theme-lg border px-4",
          theme === "brut" && "border-y-2 border-fg",
          theme === "volt" && "text-[13px]",
        )}
      >
        <li className="flex gap-3 py-3.5">
          <Truck size={19} className={clsx("mt-0.5 shrink-0", theme === "outlet" && "text-emerald-600", theme === "luxe" && "text-primary")} />
          <div>
            <p className={clsx("font-semibold", theme === "outlet" && "text-emerald-700")}>
              Tahmini teslimat: {props.deliveryWindow[0]} - {props.deliveryWindow[1]}
            </p>
            <p className="text-xs text-muted">
              {props.shipping.dispatch} içinde {props.shipping.carrier} ile kargoda. {formatPrice(props.shipping.threshold).replace(",00", "")} üzeri ücretsiz kargo.
            </p>
          </div>
        </li>
        <li className="flex gap-3 py-3.5">
          <RotateCcw size={19} className={clsx("mt-0.5 shrink-0", theme === "luxe" && "text-primary")} />
          <div>
            <p className="font-semibold">{props.shipping.returnDays} gün ücretsiz iade ve değişim</p>
            <p className="text-xs text-muted">Beden uymazsa kolayca değiştir.</p>
          </div>
        </li>
        <li className="flex gap-3 py-3.5">
          <ShieldCheck size={19} className={clsx("mt-0.5 shrink-0", theme === "luxe" && "text-primary")} />
          <div>
            <p className="font-semibold">%100 orijinal ürün</p>
            <p className="text-xs text-muted">Faturalı, marka kutusu ve etiketiyle gönderilir. Ürün kodu: {props.sku}</p>
          </div>
        </li>
      </ul>

      <SizeGuideModal open={guide} onClose={() => setGuide(false)} chart={props.sizeChart} fit={props.fitAdvice} />

      {/* Mobil yapışkan sepete ekle çubuğu */}
      {!upcoming && p.inStock && (
        <div className={clsx("fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 p-3 text-fg backdrop-blur transition-transform md:hidden", showSticky ? "visible translate-y-0" : "invisible translate-y-full")}>
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-muted">{size ? `Beden: ${size}` : "Beden seçilmedi"}</p>
              <p className={clsx("text-base font-bold", pct > 0 && "text-sale")}>{formatPrice(p.price)}</p>
            </div>
            <button type="button" onClick={() => add()} className={clsx("h-12 bg-primary px-6 text-sm font-bold text-primary-fg", theme === "luxe" && "text-black", rounded)}>
              Sepete Ekle
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
