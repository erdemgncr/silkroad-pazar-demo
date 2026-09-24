"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { CircleAlert, Lock, Minus, Plus, ShieldCheck, ShoppingBag, Tag, Trash2, Truck, X } from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { ThemeKey } from "@/themes/registry";
import { useStore } from "../providers";
import { FreeShippingBar } from "../overlays";
import { usePricing } from "./use-pricing";

export function useCoupon() {
  const [coupon, setCoupon] = useState<string | null>(null);
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCoupon(window.sessionStorage.getItem("coupon"));
    } catch {
      /* yok say */
    }
  }, []);
  const set = (c: string | null) => {
    setCoupon(c);
    try {
      if (c) window.sessionStorage.setItem("coupon", c);
      else window.sessionStorage.removeItem("coupon");
    } catch {
      /* yok say */
    }
  };
  return [coupon, set] as const;
}

export function Summary({ pricing, loading, children, variant }: { pricing: ReturnType<typeof usePricing>["pricing"]; loading: boolean; children?: React.ReactNode; variant: ThemeKey }) {
  return (
    <div className={clsx("rounded-theme-lg p-5 md:p-6", variant === "neon" ? "bg-card ring-1 ring-line" : "bg-soft")}>
      <p className="mb-4 font-heading text-lg font-bold">Sipariş Özeti</p>
      <dl className={clsx("space-y-2.5 text-sm transition-opacity", loading && "opacity-50")}>
        <div className="flex justify-between">
          <dt className="text-muted">Ara toplam</dt>
          <dd className="tabular-nums">{pricing ? formatPrice(pricing.subtotal) : "—"}</dd>
        </div>
        {pricing && pricing.discount > 0 && (
          <div className="flex justify-between text-sale">
            <dt>
              İndirim ({pricing.coupon?.code})
            </dt>
            <dd className="tabular-nums">-{formatPrice(pricing.discount)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-muted">Kargo</dt>
          <dd className="tabular-nums">{pricing ? (pricing.shippingFee ? formatPrice(pricing.shippingFee) : <span className="font-semibold text-emerald-600">Ücretsiz</span>) : "—"}</dd>
        </div>
        <div className="flex justify-between border-t border-line pt-3 text-base font-bold">
          <dt>Toplam</dt>
          <dd className="tabular-nums">{pricing ? formatPrice(pricing.total) : "—"}</dd>
        </div>
        <p className="text-xs text-muted">KDV dahildir.</p>
      </dl>
      {children}
      <ul className="mt-5 space-y-2 border-t border-line pt-4 text-xs text-muted">
        <li className="flex items-center gap-2">
          <Lock size={14} /> 256-bit SSL ve 3D Secure ile güvenli ödeme
        </li>
        <li className="flex items-center gap-2">
          <ShieldCheck size={14} /> %100 orijinal ve faturalı ürün
        </li>
        <li className="flex items-center gap-2">
          <Truck size={14} /> Hızlı kargo, kolay iade
        </li>
      </ul>
    </div>
  );
}

export function CouponBox({ coupon, setCoupon, error, applied }: { coupon: string | null; setCoupon: (c: string | null) => void; error: string | null; applied: string | null }) {
  const [code, setCode] = useState("");
  if (applied) {
    return (
      <div className="mt-4 flex items-center justify-between rounded-theme border border-dashed border-emerald-500 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
        <span className="flex items-center gap-2">
          <Tag size={15} /> <b>{applied}</b> uygulandı
        </span>
        <button type="button" onClick={() => setCoupon(null)} aria-label="Kuponu kaldır">
          <X size={16} />
        </button>
      </div>
    );
  }
  const apply = () => {
    if (code.trim()) setCoupon(code.trim().toUpperCase());
  };
  // Ödeme formunun içinde kullanıldığı için <form> yerine div (iç içe form olmaz).
  return (
    <div className="mt-4">
      <label htmlFor="coupon-code" className="mb-1.5 block text-xs font-semibold">
        İndirim kodu
      </label>
      <div className="flex gap-2">
        <input
          id="coupon-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              apply();
            }
          }}
          placeholder="Kupon kodunu gir"
          className="h-11 min-w-0 flex-1 rounded-theme border border-line bg-bg px-3 text-sm uppercase outline-none focus:border-fg"
        />
        <button type="button" onClick={apply} className="h-11 rounded-theme bg-fg px-4 text-sm font-semibold text-bg">
          Uygula
        </button>
      </div>
      {coupon && error && <p className="mt-1.5 text-xs text-sale">{error}</p>}
    </div>
  );
}

export function CartPage({ variant }: { variant: ThemeKey }) {
  const { cart, setQuantity, removeFromCart, hydrated } = useStore();
  const [coupon, setCoupon] = useCoupon();
  const { pricing, loading } = usePricing(coupon);
  const rounded = variant === "pulse" ? "rounded-full" : variant === "arena" ? "rounded-theme" : "";

  if (hydrated && cart.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <ShoppingBag size={56} strokeWidth={1.2} className="text-muted" />
        <h1 className="font-heading text-3xl font-bold">Sepetin boş</h1>
        <p className="max-w-sm text-muted">Beğendiğin ürünleri sepete ekleyerek alışverişe başlayabilirsin.</p>
        <div className="mt-2 flex gap-3">
          <Link href="/yeni-gelenler" className={clsx("bg-primary px-6 py-3 text-sm font-semibold text-primary-fg", rounded)}>
            Yeni Gelenler
          </Link>
          <Link href="/indirim" className={clsx("border border-line px-6 py-3 text-sm font-semibold", rounded)}>
            İndirimler
          </Link>
        </div>
      </div>
    );
  }

  const problem = (key: string) => pricing?.lines.find((l) => `${l.productId}:${l.size}` === key)?.problem;

  return (
    <div className="grid gap-8 py-8 lg:grid-cols-[1fr_380px] lg:gap-12">
      <div>
        <h1 className="font-heading text-3xl font-bold md:text-4xl">
          Sepetim <span className="text-lg font-normal text-muted">({cart.reduce((a, l) => a + l.quantity, 0)} ürün)</span>
        </h1>
        <div className="mt-5">
          <FreeShippingBar subtotal={pricing ? pricing.subtotal - pricing.discount : 0} />
        </div>
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {cart.map((l) => {
            const pr = problem(l.key);
            return (
              <li key={l.key} className="flex gap-4 py-5">
                <Link href={`/urun/${l.slug}`} className={clsx("h-28 w-28 shrink-0 overflow-hidden bg-soft md:h-32 md:w-32", variant === "pulse" && "rounded-2xl")}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={l.image} alt={l.title} className="h-full w-full object-cover" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <p lang="en" className="text-xs font-bold uppercase text-muted">
                        {l.brand}
                      </p>
                      <Link href={`/urun/${l.slug}`} className="font-semibold hover:underline">
                        {l.title}
                      </Link>
                      <p className="text-sm text-muted">
                        {l.colorName} · Beden <b className="text-fg">{l.size}</b>
                      </p>
                    </div>
                    <div className="text-right">
                      {l.compareAtPrice && l.compareAtPrice > l.price && <p className="text-xs text-muted line-through">{formatPrice(l.compareAtPrice * l.quantity)}</p>}
                      <p className={clsx("font-semibold tabular-nums", l.compareAtPrice && l.compareAtPrice > l.price && "text-sale")}>{formatPrice(l.price * l.quantity)}</p>
                    </div>
                  </div>
                  {pr && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-sale">
                      <CircleAlert size={14} /> {pr}
                    </p>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <div className={clsx("flex items-center border border-line", rounded)}>
                      <button type="button" aria-label="Azalt" className="grid h-9 w-9 place-items-center" onClick={() => (l.quantity > 1 ? setQuantity(l.key, l.quantity - 1) : removeFromCart(l.key))}>
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center text-sm tabular-nums">{l.quantity}</span>
                      <button type="button" aria-label="Artır" className="grid h-9 w-9 place-items-center disabled:opacity-30" disabled={l.quantity >= l.maxStock} onClick={() => setQuantity(l.key, l.quantity + 1)}>
                        <Plus size={14} />
                      </button>
                    </div>
                    <button type="button" onClick={() => removeFromCart(l.key)} className="flex items-center gap-1.5 text-sm text-muted hover:text-sale">
                      <Trash2 size={15} /> Kaldır
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <Link href="/" className="mt-5 inline-block text-sm font-semibold underline underline-offset-4">
          ← Alışverişe devam et
        </Link>
      </div>
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <Summary pricing={pricing} loading={loading} variant={variant}>
          <CouponBox coupon={coupon} setCoupon={setCoupon} error={pricing?.couponError ?? null} applied={pricing?.coupon?.code ?? null} />
          <Link
            href="/odeme"
            aria-disabled={!pricing || pricing.hasProblems}
            className={clsx("mt-5 flex h-14 items-center justify-center bg-primary text-[15px] font-bold text-primary-fg", rounded || "rounded-theme", (!pricing || pricing.hasProblems) && "pointer-events-none opacity-50")}
          >
            Ödemeye Geç
          </Link>
          {pricing?.hasProblems && <p className="mt-2 text-xs text-sale">Devam etmek için stok sorunu olan ürünleri kaldır ya da bedenini değiştir.</p>}
        </Summary>
      </aside>
    </div>
  );
}
