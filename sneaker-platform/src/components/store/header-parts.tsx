"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { ChevronDown, Heart, Menu, Search, ShoppingBag, User } from "lucide-react";
import type { MenuItem } from "@/lib/store-types";
import type { ThemeKey } from "@/themes/registry";
import { useStore } from "./providers";
import { BrandMark } from "./brand-icons";

/* ---------------- Duyuru bandı ---------------- */

export function AnnouncementBar({ messages, variant }: { messages: string[]; variant: ThemeKey }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (messages.length < 2) return;
    const t = window.setInterval(() => setI((v) => (v + 1) % messages.length), 4000);
    return () => window.clearInterval(t);
  }, [messages.length]);
  if (!messages.length) return null;

  if (variant === "neon") {
    const row = [...messages, ...messages];
    return (
      <div className="overflow-hidden border-b border-line bg-primary py-2 text-black">
        <div className="animate-marquee flex w-max gap-10 whitespace-nowrap text-xs font-bold uppercase tracking-[0.2em]">
          {[...row, ...row].map((m, k) => (
            <span key={k} className="flex items-center gap-10">
              {m} <span aria-hidden>✦</span>
            </span>
          ))}
        </div>
      </div>
    );
  }

  const styles: Record<ThemeKey, string> = {
    urban: "bg-black text-white text-[12px] tracking-wide",
    arena: "bg-accent text-accent-fg text-[13px] font-semibold",
    neon: "",
    studio: "bg-fg text-bg text-[12px] tracking-[0.12em] uppercase",
    pulse: "bg-primary text-primary-fg text-[13px] font-semibold",
  };
  return (
    <div className={clsx("relative h-9 overflow-hidden", styles[variant])}>
      {messages.map((m, k) => (
        <p
          key={k}
          aria-hidden={k !== i}
          className={clsx(
            "absolute inset-0 flex items-center justify-center px-4 text-center transition-all duration-500",
            k === i ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
          )}
        >
          {m}
        </p>
      ))}
    </div>
  );
}

/* ---------------- Yapışkan header kabı ---------------- */

export function StickyHeader({ children, className, transparentTop }: { children: React.ReactNode; className?: string; transparentTop?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header
      data-scrolled={scrolled}
      className={clsx(
        "sticky top-0 z-40 transition-[background,box-shadow] duration-200",
        scrolled ? "shadow-[0_1px_0_var(--c-line),0_8px_24px_-18px_rgba(0,0,0,0.35)]" : "",
        transparentTop && !scrolled ? "bg-bg/0" : "bg-bg",
        className,
      )}
    >
      {children}
    </header>
  );
}

/* ---------------- Aksiyon ikonları ---------------- */

export function HeaderActions({ variant, labels }: { variant: ThemeKey; labels?: boolean }) {
  const { cartCount, favorites, setCartOpen, setSearchOpen, hydrated } = useStore();
  const btn = clsx(
    "relative grid place-items-center",
    variant === "pulse" ? "h-10 w-10 rounded-full bg-soft hover:bg-line" : "h-10 w-10 hover:opacity-70",
    labels && "h-auto w-auto gap-0.5 px-1.5",
  );
  const count = (n: number) =>
    hydrated && n > 0 ? (
      <span
        className={clsx(
          "absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 text-[10px] font-bold",
          variant === "neon" ? "bg-primary text-black" : "bg-accent text-accent-fg",
          labels && "right-2 top-0",
        )}
      >
        {n}
      </span>
    ) : null;
  const label = (t: string) => (labels ? <span className="hidden text-[11px] font-medium xl:block">{t}</span> : null);
  return (
    <div className={clsx("flex items-center", labels ? "gap-2" : "gap-0.5 md:gap-1")}>
      {!labels && (
        <button type="button" aria-label="Ara" className={btn} onClick={() => setSearchOpen(true)}>
          <Search size={21} strokeWidth={1.8} />
        </button>
      )}
      <Link href="/hesabim" aria-label="Hesabım" className={clsx(btn, "hidden sm:grid")}>
        <User size={21} strokeWidth={1.8} />
        {label("Hesabım")}
      </Link>
      <Link href="/favorilerim" aria-label="Favorilerim" className={clsx(btn, "hidden sm:grid")}>
        <Heart size={21} strokeWidth={1.8} />
        {label("Favorilerim")}
        {count(favorites.length)}
      </Link>
      <button type="button" aria-label={`Sepetim, ${cartCount} ürün`} className={btn} onClick={() => setCartOpen(true)}>
        <ShoppingBag size={21} strokeWidth={1.8} />
        {label("Sepetim")}
        {count(cartCount)}
      </button>
    </div>
  );
}

export function MenuButton({ className }: { className?: string }) {
  const { setMenuOpen } = useStore();
  return (
    <button type="button" aria-label="Menüyü aç" className={clsx("grid h-10 w-10 place-items-center lg:hidden", className)} onClick={() => setMenuOpen(true)}>
      <Menu size={22} strokeWidth={1.8} />
    </button>
  );
}

export function SearchTrigger({ variant, className }: { variant: ThemeKey; className?: string }) {
  const { setSearchOpen } = useStore();
  return (
    <button
      type="button"
      onClick={() => setSearchOpen(true)}
      className={clsx(
        "flex w-full items-center gap-3 text-left text-sm text-muted",
        variant === "pulse" ? "h-11 rounded-full bg-soft px-5" : variant === "arena" ? "h-11 rounded-theme border-2 border-primary bg-bg px-4" : "h-10 border-b border-line",
        className,
      )}
    >
      <Search size={18} className={variant === "arena" ? "text-primary" : ""} />
      <span className="truncate">Ürün, marka veya model ara…</span>
      {variant === "arena" && <span className="ml-auto hidden rounded bg-primary px-3 py-1 text-xs font-semibold text-primary-fg md:block">Ara</span>}
    </button>
  );
}

/* ---------------- Mega menü ---------------- */

export function MegaNav({ items, variant, className }: { items: MenuItem[]; variant: ThemeKey; className?: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const timer = useRef<number | null>(null);
  const enter = (i: number) => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(i), 90);
  };
  const leave = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(null), 120);
  };

  const linkCls: Record<ThemeKey, string> = {
    urban: "h-16 px-2.5 text-[13px] font-bold uppercase tracking-[0.04em] xl:px-3",
    arena: "h-12 px-4 text-[14px] font-semibold",
    neon: "h-16 px-3 text-[13px] font-semibold uppercase tracking-[0.14em]",
    studio: "h-12 px-4 text-[12px] uppercase tracking-[0.18em]",
    pulse: "my-2 h-10 rounded-full px-3 text-[14px] font-semibold hover:bg-soft xl:px-4",
  };

  return (
    <nav className={clsx("hidden lg:block", className)} aria-label="Ana menü" onMouseLeave={leave}>
      <ul className={clsx("flex items-center", variant === "arena" && "gap-1")}>
        {items.map((item, i) => {
          const hasPanel = Boolean(item.columns?.length || item.brands?.length);
          return (
            <li key={item.href} onMouseEnter={() => (hasPanel ? enter(i) : leave())}>
              <Link
                href={item.href}
                onClick={() => setOpen(null)}
                className={clsx(
                  "relative flex items-center gap-1 whitespace-nowrap transition-colors",
                  linkCls[variant],
                  item.tone === "sale" && "text-sale",
                  variant === "arena" && "text-primary-fg hover:bg-white/10",
                  variant === "arena" && item.tone === "sale" && "bg-sale text-white hover:bg-sale",
                  open === i && variant !== "arena" && "after:absolute after:inset-x-3 after:bottom-0 after:h-[2px] after:bg-fg",
                )}
              >
                {item.label}
                {hasPanel && variant === "arena" && <ChevronDown size={14} className="opacity-70" />}
              </Link>
            </li>
          );
        })}
      </ul>
      {open !== null && items[open] && (items[open].columns?.length || items[open].brands?.length) ? (
        <div
          className="animate-in absolute inset-x-0 top-full z-40 border-t border-line bg-bg shadow-[0_24px_40px_-24px_rgba(0,0,0,0.35)]"
          onMouseEnter={() => enter(open)}
          onMouseLeave={leave}
        >
          <MegaPanel item={items[open]} variant={variant} onNavigate={() => setOpen(null)} />
        </div>
      ) : null}
    </nav>
  );
}

function MegaPanel({ item, variant, onNavigate }: { item: MenuItem; variant: ThemeKey; onNavigate: () => void }) {
  const brandOnly = !item.columns?.length || item.label === "Markalar";
  return (
    <div className="container-x grid grid-cols-12 gap-8 py-8">
      <div className={clsx("grid gap-8", item.promo ? "col-span-9" : "col-span-12", "grid-cols-4")}>
        {item.columns?.map((col) => (
          <div key={col.title}>
            {col.href ? (
              <Link href={col.href} onClick={onNavigate} className="mb-3 block text-sm font-bold hover:underline">
                {col.title}
              </Link>
            ) : (
              <p className="mb-3 text-sm font-bold">{col.title}</p>
            )}
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} onClick={onNavigate} className="text-sm text-muted transition-colors hover:text-fg">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {item.brands && item.brands.length > 0 && (
          <div className={clsx(brandOnly ? "col-span-3" : "col-span-4 border-t border-line pt-6")}>
            <p className="mb-4 text-sm font-bold">{brandOnly ? "Tüm Markalar" : "Popüler Markalar"}</p>
            <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
              {item.brands.map((b) => (
                <Link
                  key={b.slug}
                  href={`/marka/${b.slug}`}
                  onClick={onNavigate}
                  className={clsx(
                    "grid h-16 place-items-center border border-line text-fg transition-colors hover:border-fg",
                    variant === "pulse" ? "rounded-2xl" : variant === "arena" ? "rounded-lg" : "",
                  )}
                >
                  <BrandMark slug={b.slug} name={b.name} size={34} />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      {item.promo && (
        <Link href={item.promo.href} onClick={onNavigate} className="group relative col-span-3 block overflow-hidden bg-soft">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.promo.image} alt={item.promo.title} className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5 text-white">
            <p className="text-xs uppercase tracking-widest opacity-80">{item.promo.subtitle}</p>
            <p className="font-heading text-xl font-bold">{item.promo.title}</p>
          </div>
        </Link>
      )}
    </div>
  );
}
