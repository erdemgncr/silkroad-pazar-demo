"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { ArrowRight, ChevronDown, Minus, Plus, Search, ShoppingBag, Trash2, Truck, X } from "lucide-react";
import type { CardProduct, MenuItem } from "@/lib/store-types";
import { styleOf, type StyleKey, type ThemeKey } from "@/themes/registry";
import { formatPrice } from "@/lib/format";
import { useStore } from "./providers";
import { SOCIAL_ICONS, SvgIcon } from "./brand-icons";

function Backdrop({ onClose, show }: { onClose: () => void; show: boolean }) {
  return (
    <div
      aria-hidden
      onClick={onClose}
      className={clsx("fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] transition-opacity duration-300", show ? "opacity-100" : "pointer-events-none opacity-0")}
    />
  );
}

function useEsc(onClose: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const on = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [active, onClose]);
}

/* ---------------- Sepet çekmecesi ---------------- */

export function FreeShippingBar({ subtotal }: { subtotal: number }) {
  const { config } = useStore();
  const t = config.freeShippingThreshold;
  if (!t) return null;
  const left = Math.max(0, t - subtotal);
  const pct = Math.min(100, Math.round((subtotal / t) * 100));
  return (
    <div className="rounded-theme bg-soft p-3">
      <p className="flex items-center gap-2 text-[13px]">
        <Truck size={16} />
        {left > 0 ? (
          <span>
            Ücretsiz kargo için <b>{formatPrice(left)}</b> daha ekle
          </span>
        ) : (
          <span className="font-semibold">Tebrikler! Kargo ücretsiz.</span>
        )}
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function CartDrawer({ variant: theme }: { variant: ThemeKey }) {
  const variant = styleOf(theme);
  const { cart, cartOpen, setCartOpen, cartSubtotal, cartCount, setQuantity, removeFromCart } = useStore();
  const close = () => setCartOpen(false);
  useEsc(close, cartOpen);
  const btn = variant === "pulse" ? "rounded-full" : variant === "arena" ? "rounded-theme" : "";
  return (
    <>
      <Backdrop show={cartOpen} onClose={close} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Sepetim"
        className={clsx(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-[440px] flex-col bg-bg text-fg shadow-2xl transition-[transform,visibility] duration-300",
          cartOpen ? "visible translate-x-0" : "invisible translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <p className="font-heading text-lg font-bold">
            Sepetim <span className="text-sm font-normal text-muted">({cartCount} ürün)</span>
          </p>
          <button type="button" onClick={close} aria-label="Kapat" className="grid h-9 w-9 place-items-center hover:opacity-70">
            <X size={22} />
          </button>
        </div>
        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <ShoppingBag size={48} strokeWidth={1.2} className="text-muted" />
            <p className="text-lg font-semibold">Sepetin şu an boş</p>
            <p className="text-sm text-muted">Yeni sezon modellerine göz atarak alışverişe başlayabilirsin.</p>
            <Link href="/yeni-gelenler" onClick={close} className={clsx("mt-2 bg-primary px-6 py-3 text-sm font-semibold text-primary-fg", btn)}>
              Yeni Gelenleri Keşfet
            </Link>
          </div>
        ) : (
          <>
            <div className="px-5 pt-4">
              <FreeShippingBar subtotal={cartSubtotal} />
            </div>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
              {cart.map((l) => (
                <li key={l.key} className="flex gap-4 py-4">
                  <Link href={`/urun/${l.slug}`} onClick={close} className={clsx("relative h-24 w-24 shrink-0 overflow-hidden bg-soft", variant === "pulse" && "rounded-2xl")}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={l.image} alt={l.title} className="h-full w-full object-cover" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p lang="en" className="text-[11px] font-bold uppercase tracking-wide text-muted">{l.brand}</p>
                    <Link href={`/urun/${l.slug}`} onClick={close} className="line-clamp-1 text-sm font-semibold">
                      {l.title}
                    </Link>
                    <p className="text-xs text-muted">
                      {l.colorName} · Beden: <b className="text-fg">{l.size}</b>
                    </p>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className={clsx("flex items-center border border-line", variant === "pulse" && "rounded-full")}>
                        <button type="button" aria-label="Azalt" className="grid h-8 w-8 place-items-center" onClick={() => (l.quantity > 1 ? setQuantity(l.key, l.quantity - 1) : removeFromCart(l.key))}>
                          <Minus size={14} />
                        </button>
                        <span className="w-7 text-center text-sm tabular-nums">{l.quantity}</span>
                        <button type="button" aria-label="Artır" className="grid h-8 w-8 place-items-center disabled:opacity-30" disabled={l.quantity >= l.maxStock} onClick={() => setQuantity(l.key, l.quantity + 1)}>
                          <Plus size={14} />
                        </button>
                      </div>
                      <div className="text-right">
                        {l.compareAtPrice && l.compareAtPrice > l.price && <p className="text-xs text-muted line-through">{formatPrice(l.compareAtPrice * l.quantity)}</p>}
                        <p className={clsx("text-sm font-semibold", l.compareAtPrice && l.compareAtPrice > l.price && "text-sale")}>{formatPrice(l.price * l.quantity)}</p>
                      </div>
                    </div>
                  </div>
                  <button type="button" aria-label="Ürünü kaldır" onClick={() => removeFromCart(l.key)} className="self-start p-1 text-muted hover:text-sale">
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
            <div className="space-y-3 border-t border-line p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Ara toplam</span>
                <span className="text-lg font-bold">{formatPrice(cartSubtotal)}</span>
              </div>
              <p className="text-xs text-muted">Kargo ve indirimler ödeme adımında hesaplanır.</p>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/sepet" onClick={close} className={clsx("border border-fg py-3 text-center text-sm font-semibold", btn)}>
                  Sepete Git
                </Link>
                <Link href="/odeme" onClick={close} className={clsx("bg-primary py-3 text-center text-sm font-semibold text-primary-fg", btn)}>
                  Ödemeye Geç
                </Link>
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

/* ---------------- Arama ---------------- */

type SearchResponse = { products: CardProduct[]; brands: { name: string; slug: string }[]; collections: { label: string; href: string }[] };

export function SearchOverlay({ popular, variant: theme }: { popular: { label: string; href: string }[]; variant: ThemeKey }) {
  const variant = styleOf(theme);
  const { searchOpen, setSearchOpen } = useStore();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [resRaw, setRes] = useState<SearchResponse | null>(null);
  const res = q.trim().length >= 2 ? resRaw : null;
  const [loading, setLoading] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const close = () => setSearchOpen(false);
  useEsc(close, searchOpen);

  useEffect(() => {
    if (searchOpen) window.setTimeout(() => input.current?.focus(), 50);
  }, [searchOpen]);

  useEffect(() => {
    if (q.trim().length < 2) return;
    const ctrl = new AbortController();
    const t = window.setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`, { signal: ctrl.signal });
        if (r.ok) setRes((await r.json()) as SearchResponse);
      } catch {
        /* iptal */
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => {
      ctrl.abort();
      window.clearTimeout(t);
    };
  }, [q]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    close();
    router.push(`/arama?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <>
      <Backdrop show={searchOpen} onClose={close} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Arama"
        className={clsx(
          "fixed inset-x-0 top-0 z-50 max-h-[92vh] overflow-y-auto bg-bg text-fg shadow-2xl transition-[transform,visibility] duration-300",
          searchOpen ? "visible translate-y-0" : "invisible -translate-y-full",
        )}
      >
        <div className="container-x py-5">
          <form onSubmit={submit} className="flex items-center gap-3 border-b-2 border-fg pb-3">
            <Search size={24} />
            <input
              ref={input}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              type="search"
              name="q"
              placeholder="Ürün, marka veya model ara…"
              aria-label="Arama"
              className="h-12 flex-1 bg-transparent text-lg outline-none placeholder:text-muted md:text-2xl"
              autoComplete="off"
            />
            <button type="button" onClick={close} aria-label="Aramayı kapat" className="grid h-10 w-10 place-items-center">
              <X size={24} />
            </button>
          </form>
          <div className="grid gap-8 py-6 md:grid-cols-12">
            <div className="md:col-span-3">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted">{res ? "Kategoriler ve Markalar" : "Popüler Aramalar"}</p>
              <ul className="flex flex-wrap gap-2 md:flex-col md:gap-2.5">
                {(res ? [...res.collections, ...res.brands.map((b) => ({ label: b.name, href: `/marka/${b.slug}` }))] : popular).map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      onClick={close}
                      className={clsx("inline-block text-sm hover:underline", "rounded-full border border-line px-3 py-1.5 md:rounded-none md:border-0 md:p-0")}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:col-span-9">
              {loading && !res && <p className="text-sm text-muted">Aranıyor…</p>}
              {res && res.products.length === 0 && (
                <p className="text-sm text-muted">
                  &quot;{q}&quot; için sonuç bulunamadı. Farklı bir kelime deneyebilir ya da popüler kategorilere göz atabilirsin.
                </p>
              )}
              {res && res.products.length > 0 && (
                <>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted">Ürünler</p>
                    <button type="button" onClick={submit} className="flex items-center gap-1 text-sm font-semibold hover:underline">
                      Tüm sonuçları gör <ArrowRight size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                    {res.products.map((p) => (
                      <Link key={p.id} href={`/urun/${p.slug}`} onClick={close} className="group">
                        <div className={clsx("aspect-square overflow-hidden bg-soft", variant === "pulse" && "rounded-2xl")}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.image} alt={p.imageAlt} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                        </div>
                        <p className="mt-2 text-[11px] font-bold uppercase text-muted">{p.brand}</p>
                        <p className="line-clamp-1 text-sm font-medium">{p.model}</p>
                        <p className="text-sm font-semibold">{formatPrice(p.price)}</p>
                      </Link>
                    ))}
                  </div>
                </>
              )}
              {!res && !loading && (
                <p className="text-sm text-muted">Aramaya başlamak için en az 2 karakter yaz. Türkçe karakterli ya da karaktersiz yazabilirsin (örn. &quot;kosu&quot; ya da &quot;koşu&quot;).</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------------- Mobil menü ---------------- */

export function MobileMenu({ items, social, siteName }: { items: MenuItem[]; social: Record<string, string>; siteName: string }) {
  const { menuOpen, setMenuOpen, setSearchOpen } = useStore();
  const [expanded, setExpanded] = useState<string | null>(null);
  const close = () => setMenuOpen(false);
  useEsc(close, menuOpen);
  return (
    <>
      <Backdrop show={menuOpen} onClose={close} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menü"
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex w-[88%] max-w-[380px] flex-col bg-bg text-fg shadow-2xl transition-[transform,visibility] duration-300 lg:hidden",
          menuOpen ? "visible translate-x-0" : "invisible -translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <span className="font-heading text-lg font-bold">{siteName}</span>
          <button type="button" onClick={close} aria-label="Menüyü kapat" className="grid h-10 w-10 place-items-center">
            <X size={22} />
          </button>
        </div>
        <div className="px-4 py-3">
          <button
            type="button"
            onClick={() => {
              close();
              setSearchOpen(true);
            }}
            className="flex h-11 w-full items-center gap-2 rounded-theme bg-soft px-4 text-sm text-muted"
          >
            <Search size={18} /> Ürün, marka veya model ara…
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-2">
          <ul>
            {items.map((item) => {
              const hasSub = Boolean(item.columns?.length);
              const isOpen = expanded === item.href;
              return (
                <li key={item.href} className="border-b border-line">
                  <div className="flex items-center">
                    <Link href={item.href} onClick={close} className={clsx("flex-1 px-2 py-3.5 text-[15px] font-semibold", item.tone === "sale" && "text-sale")}>
                      {item.label}
                    </Link>
                    {hasSub && (
                      <button type="button" aria-label={`${item.label} alt menüsü`} aria-expanded={isOpen} className="grid h-12 w-12 place-items-center" onClick={() => setExpanded(isOpen ? null : item.href)}>
                        <ChevronDown size={18} className={clsx("transition-transform", isOpen && "rotate-180")} />
                      </button>
                    )}
                  </div>
                  {hasSub && isOpen && (
                    <div className="animate-in space-y-4 px-2 pb-4">
                      {item.columns!.map((col) => (
                        <div key={col.title}>
                          <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted">{col.title}</p>
                          <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                            {col.links.map((l) => (
                              <li key={l.href}>
                                <Link href={l.href} onClick={close} className="text-sm">
                                  {l.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <ul className="space-y-1 px-2 py-4 text-sm">
            {[
              ["Hesabım", "/hesabim"],
              ["Sipariş Takibi", "/siparis-takip"],
              ["Markalar", "/markalar"],
              ["Blog", "/blog"],
              ["Yardım & SSS", "/sss"],
              ["İletişim", "/iletisim"],
            ].map(([l, h]) => (
              <li key={h}>
                <Link href={h} onClick={close} className="block py-1.5 text-muted">
                  {l}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex gap-3 border-t border-line px-4 py-4">
          {Object.entries(social)
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <a key={k} href={v} target="_blank" rel="noopener noreferrer" aria-label={k} className="grid h-9 w-9 place-items-center rounded-full bg-soft">
                <SvgIcon icon={SOCIAL_ICONS[k as keyof typeof SOCIAL_ICONS]} size={16} />
              </a>
            ))}
        </div>
      </aside>
    </>
  );
}

/* ---------------- Bildirim, çerez, WhatsApp ---------------- */

export function Toaster() {
  const { toast } = useStore();
  if (!toast) return null;
  return (
    <div role="status" className="animate-in fixed bottom-5 left-1/2 z-[60] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-theme bg-fg p-3 text-bg shadow-2xl">
      {toast.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={toast.image} alt="" className="h-12 w-12 rounded object-cover" />
      )}
      <div className="min-w-0">
        <p className="text-sm font-semibold">{toast.title}</p>
        {toast.body && <p className="truncate text-xs opacity-80">{toast.body}</p>}
      </div>
    </div>
  );
}

export function CookieConsent() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (!window.localStorage.getItem("cookie-consent")) setShow(true);
    } catch {
      /* yok say */
    }
  }, []);
  if (!show) return null;
  const save = (v: string) => {
    try {
      window.localStorage.setItem("cookie-consent", v);
    } catch {
      /* yok say */
    }
    setShow(false);
  };
  return (
    <div className="animate-in fixed inset-x-3 bottom-3 z-[55] mx-auto max-w-3xl rounded-theme bg-card p-4 text-fg shadow-2xl ring-1 ring-line md:flex md:items-center md:gap-5">
      <p className="text-[13px] leading-relaxed text-muted">
        Size daha iyi bir alışveriş deneyimi sunmak için çerezler kullanıyoruz. Detaylar için{" "}
        <Link href="/cerez-politikasi" className="font-semibold text-fg underline">
          Çerez Politikası
        </Link>{" "}
        ve{" "}
        <Link href="/kvkk-aydinlatma-metni" className="font-semibold text-fg underline">
          KVKK Aydınlatma Metni
        </Link>
        &apos;ni inceleyebilirsiniz.
      </p>
      <div className="mt-3 flex shrink-0 gap-2 md:mt-0">
        <button type="button" onClick={() => save("necessary")} className="rounded-theme border border-line px-4 py-2 text-xs font-semibold">
          Sadece Zorunlu
        </button>
        <button type="button" onClick={() => save("all")} className="rounded-theme bg-primary px-4 py-2 text-xs font-semibold text-primary-fg">
          Tümünü Kabul Et
        </button>
      </div>
    </div>
  );
}

export function WhatsAppButton({ phone }: { phone: string }) {
  if (!phone) return null;
  return (
    <a
      href={`https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent("Merhaba, bir ürün hakkında bilgi almak istiyorum.")}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp ile yaz"
      className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#25d366] text-white shadow-xl transition-transform hover:scale-105"
    >
      <SvgIcon icon={SOCIAL_ICONS.whatsapp} size={28} />
    </a>
  );
}
