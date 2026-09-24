"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { Bell, CreditCard, MessageCircle, RotateCcw, Ruler, ShieldCheck, ShoppingBag, Truck, X } from "lucide-react";
import type { ThemeKey } from "@/themes/registry";
import type { CardProduct } from "@/lib/store-types";
import { discountPercent, formatDateShort, formatPrice } from "@/lib/format";
import { createStockAlert, type ActionState } from "@/lib/actions/store";
import { useStore } from "../providers";
import { FavoriteButton } from "../favorite-button";

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

export function BuyBox(props: Props) {
  const { product: p, variant: v } = props;
  const { addToCart, setCartOpen, pushRecent } = useStore();
  const [size, setSize] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [guide, setGuide] = useState(false);
  const [added, setAdded] = useState(false);
  const addRef = useRef<HTMLButtonElement>(null);
  const [showSticky, setShowSticky] = useState(false);
  const pct = discountPercent(p.price, p.compareAtPrice);
  const upcoming = p.releaseDate && new Date(p.releaseDate) > new Date();
  const selected = p.sizes.find((s) => s.size === size);
  const rounded = v === "pulse" ? "rounded-full" : v === "arena" ? "rounded-theme" : "";
  const single = p.sizes.length === 1;

  useEffect(() => {
    pushRecent(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.id]);

  useEffect(() => {
    if (single && p.sizes[0].stock > 0) setSize(p.sizes[0].size);
  }, [single, p.sizes]);

  useEffect(() => {
    const el = addRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShowSticky(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const add = () => {
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
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
    setCartOpen(true);
  };

  const primaryBtn = clsx(
    "flex h-14 flex-1 items-center justify-center gap-2 text-[15px] font-bold transition-all active:scale-[0.99]",
    rounded,
    v === "neon" ? "bg-primary uppercase tracking-widest text-black hover:shadow-[0_0_30px_-4px_var(--c-primary)]" : "bg-primary text-primary-fg hover:opacity-90",
    v === "urban" && "uppercase tracking-wide",
  );

  return (
    <div className={clsx(v === "pulse" && "rounded-theme-lg bg-soft p-5 md:p-7")}>
      <Link href={props.brandHref} lang="en" className={clsx("text-sm font-bold hover:underline", v === "neon" ? "uppercase tracking-[0.2em] text-primary" : v === "studio" ? "uppercase tracking-[0.25em] text-muted" : "text-primary")}>
        {p.brand}
      </Link>
      <h1
        className={clsx(
          "mt-1.5 font-heading leading-tight",
          v === "urban" && "text-2xl font-extrabold md:text-[28px]",
          v === "arena" && "text-xl font-bold md:text-2xl",
          v === "neon" && "text-3xl uppercase md:text-5xl",
          v === "studio" && "text-3xl md:text-4xl",
          v === "pulse" && "text-2xl font-extrabold md:text-3xl",
        )}
      >
        {props.h1}
      </h1>
      <p className="mt-1 text-sm text-muted">{props.subtitle}</p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <span className={clsx("text-2xl font-bold tabular-nums md:text-[28px]", pct > 0 && "text-sale")}>{formatPrice(p.price)}</span>
        {pct > 0 && (
          <>
            <span className="text-base text-muted line-through tabular-nums">{formatPrice(p.compareAtPrice!)}</span>
            <span className={clsx("bg-sale px-2 py-1 text-xs font-bold text-white", rounded || "rounded")}>%{pct} İndirim</span>
          </>
        )}
      </div>
      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
        <CreditCard size={14} /> {props.installmentText}
      </p>

      {props.siblings.length > 1 && (
        <div className="mt-6">
          <p className="mb-2 text-sm">
            Renk: <b>{p.colorName}</b>
          </p>
          <div className="flex flex-wrap gap-2">
            {props.siblings.map((s) => (
              <Link
                key={s.slug}
                href={`/urun/${s.slug}`}
                aria-label={s.colorName}
                aria-current={s.current ? "true" : undefined}
                title={s.colorName}
                className={clsx(
                  "relative h-16 w-16 overflow-hidden bg-soft ring-offset-2 ring-offset-bg",
                  v === "pulse" ? "rounded-2xl" : v === "arena" ? "rounded-theme" : "",
                  s.current ? "ring-2 ring-fg" : "ring-1 ring-line hover:ring-fg",
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
        <div id="beden-secimi" className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <p className={clsx("text-sm", error && !size && "font-semibold text-sale")}>{error && !size ? "Lütfen beden seçin" : size ? <>Beden: <b>{size}</b></> : "Beden Seçin"}</p>
            <button type="button" onClick={() => setGuide(true)} className="flex items-center gap-1.5 text-sm font-medium underline underline-offset-4">
              <Ruler size={15} /> Beden Tablosu
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
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
                  className={clsx(
                    "relative h-12 border text-sm font-medium transition-colors",
                    v === "pulse" ? "rounded-xl" : v === "arena" ? "rounded-theme" : "",
                    on ? (v === "neon" ? "border-primary bg-primary text-black" : "border-fg bg-fg text-bg") : "border-line hover:border-fg",
                    out && !on && "text-muted",
                    error && !size && "border-sale/60",
                  )}
                >
                  <span className={clsx(out && "line-through decoration-1")}>{s.size}</span>
                  {!out && s.stock <= 2 && <span className="absolute -top-1.5 right-1 rounded bg-accent px-1 text-[9px] font-bold text-accent-fg">Son {s.stock}</span>}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted">{props.fitAdvice}</p>
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
        ) : (
          <div className="flex gap-2">
            <button ref={addRef} type="button" onClick={add} className={primaryBtn}>
              <ShoppingBag size={19} /> {added ? "Sepete Eklendi" : "Sepete Ekle"}
            </button>
            <FavoriteButton product={p} size={22} className={clsx("h-14 w-14 shrink-0 border border-line hover:border-fg", rounded)} />
          </div>
        )}
        {props.whatsapp && (
          <a
            href={`https://wa.me/${props.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Merhaba, ${props.h1} (${props.sku}) hakkında bilgi almak istiyorum.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={clsx("flex h-12 w-full items-center justify-center gap-2 border border-line text-sm font-semibold hover:border-fg", rounded)}
          >
            <MessageCircle size={17} /> WhatsApp ile Sor
          </a>
        )}
      </div>

      <ul className={clsx("mt-6 divide-y divide-line border-y border-line text-sm", v === "pulse" && "rounded-theme-lg border-0 bg-bg px-4")}>
        <li className="flex gap-3 py-3.5">
          <Truck size={19} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">
              Tahmini teslimat: {props.deliveryWindow[0]} - {props.deliveryWindow[1]}
            </p>
            <p className="text-xs text-muted">
              {props.shipping.dispatch} içinde {props.shipping.carrier} ile kargoda. {formatPrice(props.shipping.threshold).replace(",00", "")} üzeri ücretsiz kargo.
            </p>
          </div>
        </li>
        <li className="flex gap-3 py-3.5">
          <RotateCcw size={19} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">{props.shipping.returnDays} gün ücretsiz iade ve değişim</p>
            <p className="text-xs text-muted">Beden uymazsa kolayca değiştir.</p>
          </div>
        </li>
        <li className="flex gap-3 py-3.5">
          <ShieldCheck size={19} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">%100 orijinal ürün</p>
            <p className="text-xs text-muted">Faturalı, marka kutusu ve etiketiyle gönderilir. Ürün kodu: {props.sku}</p>
          </div>
        </li>
      </ul>

      <SizeGuideModal open={guide} onClose={() => setGuide(false)} chart={props.sizeChart} fit={props.fitAdvice} />

      {/* Mobil yapışkan sepete ekle çubuğu */}
      {!upcoming && p.inStock && (
        <div className={clsx("fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 p-3 backdrop-blur transition-transform md:hidden", showSticky ? "visible translate-y-0" : "invisible translate-y-full")}>
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-muted">{size ? `Beden: ${size}` : "Beden seçilmedi"}</p>
              <p className={clsx("text-base font-bold", pct > 0 && "text-sale")}>{formatPrice(p.price)}</p>
            </div>
            <button type="button" onClick={add} className={clsx("h-12 bg-primary px-6 text-sm font-bold text-primary-fg", rounded)}>
              Sepete Ekle
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
