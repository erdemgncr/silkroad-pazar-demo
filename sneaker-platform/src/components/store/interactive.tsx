"use client";

import Link from "next/link";
import { Children, useCallback, useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HeroSlide } from "@/lib/site-settings";
import { styleOf, type StyleKey, type ThemeKey } from "@/themes/registry";

/* ---------------- Yatay kaydırmalı ürün şeridi ---------------- */

export function Carousel({
  children,
  variant: theme,
  itemClass = "w-[46%] sm:w-[31%] lg:w-[23.5%]",
  arrows = "top",
}: {
  children: React.ReactNode;
  variant: ThemeKey;
  itemClass?: string;
  arrows?: "top" | "side";
}) {
  const variant = styleOf(theme);
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 });
  }, []);
  useEffect(() => {
    update();
    const el = ref.current;
    el?.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);
  const go = (dir: number) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };
  const arrowCls = clsx(
    "grid h-10 w-10 place-items-center border transition-opacity disabled:opacity-30",
    variant === "pulse" || variant === "arena" ? "rounded-full" : "",
    variant === "neon" ? "border-line bg-card text-fg hover:border-primary" : "border-line bg-bg hover:border-fg",
  );
  return (
    <div className="relative">
      {arrows === "top" && (
        <div className="absolute -top-14 right-0 hidden gap-2 md:flex">
          <button type="button" aria-label="Önceki" className={arrowCls} disabled={edge.start} onClick={() => go(-1)}>
            <ChevronLeft size={18} />
          </button>
          <button type="button" aria-label="Sonraki" className={arrowCls} disabled={edge.end} onClick={() => go(1)}>
            <ChevronRight size={18} />
          </button>
        </div>
      )}
      <div ref={ref} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 md:mx-0 md:gap-4 md:px-0">
        {Children.map(children, (child) => (
          <div className={clsx("shrink-0 snap-start", itemClass)}>{child}</div>
        ))}
      </div>
      {arrows === "side" && (
        <>
          <button type="button" aria-label="Önceki" className={clsx(arrowCls, "absolute -left-5 top-1/3 hidden shadow md:grid")} disabled={edge.start} onClick={() => go(-1)}>
            <ChevronLeft size={18} />
          </button>
          <button type="button" aria-label="Sonraki" className={clsx(arrowCls, "absolute -right-5 top-1/3 hidden shadow md:grid")} disabled={edge.end} onClick={() => go(1)}>
            <ChevronRight size={18} />
          </button>
        </>
      )}
    </div>
  );
}

/* ---------------- Hero slider ---------------- */

export function HeroSlider({ slides, variant: theme }: { slides: HeroSlide[]; variant: ThemeKey }) {
  const variant = styleOf(theme);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (slides.length < 2 || paused) return;
    const t = window.setInterval(() => setI((v) => (v + 1) % slides.length), 6000);
    return () => window.clearInterval(t);
  }, [slides.length, paused]);
  if (!slides.length) return null;

  const height =
    variant === "neon" ? "h-[78vh] min-h-[520px] max-h-[860px]" : variant === "studio" ? "h-[560px] md:h-[640px]" : variant === "pulse" ? "h-[440px] md:h-[520px]" : "h-[520px] md:h-[640px] lg:h-[720px]";

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Öne çıkan kampanyalar"
      className={clsx("relative overflow-hidden", height, variant === "pulse" && "rounded-theme-lg")}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((s, k) => (
        <div
          key={k}
          aria-hidden={k !== i}
          className={clsx("absolute inset-0 transition-opacity duration-700", k === i ? "z-10 opacity-100" : "z-0 opacity-0")}
          style={{ background: s.bg, color: s.fg }}
        >
          {variant === "studio" ? (
            <div className="grid h-full md:grid-cols-2">
              <div className="flex flex-col justify-center gap-5 px-8 py-10 md:px-16">
                {s.eyebrow && <p className="text-xs uppercase tracking-[0.3em] opacity-70">{s.eyebrow}</p>}
                <h2 className="h-display font-heading text-5xl leading-[1.05] md:text-7xl">{s.title}</h2>
                {s.subtitle && <p className="max-w-md text-base opacity-80">{s.subtitle}</p>}
                <Link href={s.href} tabIndex={k === i ? 0 : -1} className="mt-2 w-fit border-b border-current pb-1 text-sm uppercase tracking-[0.2em]">
                  {s.cta}
                </Link>
              </div>
              <div className="relative hidden md:block">
                {s.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.image} alt={s.title} className="h-full w-full object-cover" fetchPriority={k === 0 ? "high" : "auto"} />
                )}
              </div>
            </div>
          ) : (
            <>
              {s.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.image} alt={s.title} className={clsx("absolute inset-0 h-full w-full object-cover", variant === "neon" ? "opacity-45" : "opacity-60")} fetchPriority={k === 0 ? "high" : "auto"} />
              )}
              <div className={clsx("absolute inset-0", variant === "neon" ? "bg-gradient-to-t from-black via-black/30 to-transparent" : "bg-gradient-to-r from-black/55 via-black/20 to-transparent")} />
              <div className={clsx("container-x relative flex h-full flex-col justify-end pb-14 md:pb-20", variant === "neon" && "items-center text-center")}>
                {s.eyebrow && (
                  <p className={clsx("mb-3 text-xs font-bold uppercase tracking-[0.25em]", variant === "neon" ? "text-primary" : "text-white/90")}>{s.eyebrow}</p>
                )}
                <h2
                  className={clsx(
                    "h-display max-w-3xl font-heading font-black leading-[0.95] text-white",
                    variant === "neon" ? "text-6xl md:text-8xl lg:text-9xl" : variant === "pulse" ? "text-4xl md:text-6xl" : "text-5xl md:text-7xl",
                  )}
                >
                  {s.title}
                </h2>
                {s.subtitle && <p className="mt-4 max-w-xl text-base text-white/85 md:text-lg">{s.subtitle}</p>}
                <Link
                  href={s.href}
                  tabIndex={k === i ? 0 : -1}
                  className={clsx(
                    "mt-7 inline-flex w-fit items-center gap-2 px-7 py-3.5 text-sm font-bold",
                    variant === "neon" ? "bg-primary text-black uppercase tracking-widest" : variant === "pulse" ? "rounded-full bg-white text-black" : "bg-white text-black uppercase tracking-wide",
                  )}
                >
                  {s.cta} <ChevronRight size={16} />
                </Link>
              </div>
            </>
          )}
        </div>
      ))}
      {slides.length > 1 && (
        <div className={clsx("absolute bottom-5 z-20 flex gap-2", variant === "neon" ? "left-1/2 -translate-x-1/2" : "right-6 md:right-10")}>
          {slides.map((_, k) => (
            <button
              key={k}
              type="button"
              aria-label={`${k + 1}. slayt`}
              aria-current={k === i}
              onClick={() => setI(k)}
              className={clsx("h-1.5 rounded-full transition-all", k === i ? "w-8 bg-white" : "w-4 bg-white/40", variant === "studio" && (k === i ? "!bg-fg" : "!bg-fg/30"))}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/* ---------------- Geri sayım ---------------- */

export function Countdown({ to, className, compact }: { to: string; className?: string; compact?: boolean }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  const diff = now === null ? 0 : Math.max(0, new Date(to).getTime() - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const parts = [
    ["Gün", d],
    ["Saat", h],
    ["Dk", m],
    ["Sn", s],
  ] as const;
  return (
    <div className={clsx("flex gap-2", className)} aria-label="Kalan süre" suppressHydrationWarning>
      {parts.map(([label, v]) => (
        <div key={label} className={clsx("flex flex-col items-center", compact ? "min-w-9" : "min-w-12")}>
          <span className={clsx("font-heading font-bold tabular-nums", compact ? "text-lg" : "text-2xl md:text-3xl")} suppressHydrationWarning>
            {now === null ? "--" : String(v).padStart(2, "0")}
          </span>
          <span className="text-[10px] uppercase tracking-widest opacity-70">{label}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Sekmeler ---------------- */

export function Tabs({ tabs, variant: theme }: { tabs: { label: string; content: React.ReactNode }[]; variant: ThemeKey }) {
  const variant = styleOf(theme);
  const [i, setI] = useState(0);
  return (
    <div>
      <div role="tablist" className="no-scrollbar mb-6 flex gap-2 overflow-x-auto">
        {tabs.map((t, k) => (
          <button
            key={t.label}
            role="tab"
            type="button"
            aria-selected={k === i}
            onClick={() => setI(k)}
            className={clsx(
              "shrink-0 px-5 py-2.5 text-sm font-semibold transition-colors",
              variant === "arena" || variant === "pulse" ? "rounded-full" : "",
              k === i ? "bg-primary text-primary-fg" : "bg-soft text-fg hover:bg-line",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t, k) => (
        <div key={t.label} role="tabpanel" hidden={k !== i}>
          {t.content}
        </div>
      ))}
    </div>
  );
}

/* ---------------- Katlanabilir SEO metni ---------------- */

export function Collapsible({ children, collapsedHeight = 160 }: { children: React.ReactNode; collapsedHeight?: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div className="relative overflow-hidden transition-[max-height] duration-500" style={{ maxHeight: open ? 4000 : collapsedHeight }}>
        {children}
        {!open && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-bg to-transparent" />}
      </div>
      <button type="button" onClick={() => setOpen((v) => !v)} className="mt-3 text-sm font-semibold underline underline-offset-4">
        {open ? "Daha az göster" : "Devamını oku"}
      </button>
    </div>
  );
}
