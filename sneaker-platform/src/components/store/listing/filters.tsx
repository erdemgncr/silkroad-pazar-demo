"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { clsx } from "clsx";
import { Check, ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { styleOf, type StyleKey, type ThemeKey } from "@/themes/registry";
import type { Facets } from "@/lib/catalog";
import { formatPriceShort } from "@/lib/format";

type Dim = "marka" | "beden" | "renk" | "cinsiyet" | "kategori";

const LABELS: Record<Dim | "fiyat", string> = {
  kategori: "Kategori",
  cinsiyet: "Cinsiyet",
  marka: "Marka",
  beden: "Beden",
  renk: "Renk",
  fiyat: "Fiyat",
};

export const SORT_OPTIONS = [
  { key: "onerilen", label: "Önerilen" },
  { key: "yeni", label: "En Yeniler" },
  { key: "cok-satan", label: "Çok Satanlar" },
  { key: "artan", label: "Fiyat: Düşükten Yükseğe" },
  { key: "azalan", label: "Fiyat: Yüksekten Düşüğe" },
  { key: "indirim", label: "İndirim Oranı" },
];

function useQueryState() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, start] = useTransition();
  const get = (k: string) => (sp.get(k) ?? "").split(",").filter(Boolean);
  const push = (mut: (p: URLSearchParams) => void) => {
    const p = new URLSearchParams(sp.toString());
    mut(p);
    p.delete("sayfa");
    const qs = p.toString();
    start(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };
  const toggle = (k: Dim, v: string) =>
    push((p) => {
      const cur = new Set((p.get(k) ?? "").split(",").filter(Boolean));
      if (cur.has(v)) cur.delete(v);
      else cur.add(v);
      if (cur.size) p.set(k, [...cur].join(","));
      else p.delete(k);
    });
  const set = (k: string, v: string | null) => push((p) => (v ? p.set(k, v) : p.delete(k)));
  const clear = () => push((p) => ["marka", "beden", "renk", "cinsiyet", "kategori", "fiyat", "indirim", "stok"].forEach((k) => p.delete(k)));
  return { get, toggle, set, clear, pending, sp };
}

/* ---------------- Filtre grupları ---------------- */

function OptionList({ dim, facets, variant: theme }: { dim: Dim; facets: Facets; variant: ThemeKey }) {
  const variant = styleOf(theme);
  const { get, toggle } = useQueryState();
  const selected = get(dim);
  const [q, setQ] = useState("");
  const opts = facets[dim].filter((o) => !q || o.label.toLocaleLowerCase("tr-TR").includes(q.toLocaleLowerCase("tr-TR")));
  const rounded = variant === "pulse" ? "rounded-full" : variant === "arena" ? "rounded-md" : "";

  if (dim === "beden") {
    return (
      <div className="grid grid-cols-4 gap-1.5">
        {facets.beden.map((o) => {
          const on = selected.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              disabled={!o.count && !on}
              onClick={() => toggle("beden", o.value)}
              className={clsx(
                "h-10 border text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-35",
                rounded,
                on ? "border-fg bg-fg text-bg" : "border-line hover:border-fg",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    );
  }
  if (dim === "renk") {
    return (
      <div className="grid grid-cols-2 gap-x-2 gap-y-2.5">
        {facets.renk.map((o) => {
          const on = selected.includes(o.value);
          return (
            <button key={o.value} type="button" onClick={() => toggle("renk", o.value)} disabled={!o.count && !on} className="flex items-center gap-2 text-left text-[13px] disabled:opacity-35">
              <span
                className={clsx("grid h-6 w-6 shrink-0 place-items-center rounded-full ring-1 ring-line", on && "ring-2 ring-fg ring-offset-2 ring-offset-bg")}
                style={{ background: o.hex }}
              >
                {on && <Check size={13} className={o.value === "beyaz" || o.value === "bej" || o.value === "sari" ? "text-black" : "text-white"} />}
              </span>
              {o.label} <span className="text-muted">({o.count})</span>
            </button>
          );
        })}
      </div>
    );
  }
  return (
    <div>
      {dim === "marka" && facets.marka.length > 8 && (
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Marka ara"
          className={clsx("mb-3 h-9 w-full border border-line bg-bg px-3 text-sm outline-none focus:border-fg", rounded)}
        />
      )}
      <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
        {opts.map((o) => {
          const on = selected.includes(o.value);
          return (
            <li key={o.value}>
              <label className={clsx("flex cursor-pointer items-center gap-2.5 text-sm", !o.count && !on && "opacity-40")}>
                <span className={clsx("grid h-[18px] w-[18px] shrink-0 place-items-center border", variant === "pulse" ? "rounded-md" : "rounded-[3px]", on ? "border-fg bg-fg text-bg" : "border-line")}>
                  {on && <Check size={12} strokeWidth={3} />}
                </span>
                <input type="checkbox" className="sr-only" checked={on} onChange={() => toggle(dim, o.value)} disabled={!o.count && !on} />
                <span className="flex-1">{o.label}</span>
                <span className="text-xs text-muted">{o.count}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PriceFilter({ facets, variant: theme }: { facets: Facets; variant: ThemeKey }) {
  const variant = styleOf(theme);
  const { sp, set } = useQueryState();
  const cur = (sp.get("fiyat") ?? "").split("-");
  const [min, setMin] = useState(cur[0] ?? "");
  const [max, setMax] = useState(cur[1] ?? "");
  const lo = Math.floor(facets.priceMin / 100);
  const hi = Math.ceil(facets.priceMax / 100);
  const presets = useMemo(() => {
    const steps = [0, 1000, 2000, 3000, 5000, 7500, 10000, 999999];
    const out: [number, number][] = [];
    for (let i = 0; i < steps.length - 1; i++) if (steps[i] < hi && steps[i + 1] > lo) out.push([steps[i], steps[i + 1]]);
    return out;
  }, [lo, hi]);
  const rounded = variant === "pulse" ? "rounded-full" : variant === "arena" ? "rounded-md" : "";
  return (
    <div className="space-y-3">
      <ul className="space-y-1.5">
        {presets.map(([a, b]) => {
          const val = `${a}-${b === 999999 ? "" : b}`;
          const on = sp.get("fiyat") === val;
          return (
            <li key={val}>
              <button type="button" onClick={() => set("fiyat", on ? null : val)} className={clsx("text-sm hover:underline", on && "font-bold underline")}>
                {b === 999999 ? `${formatPriceShort(a * 100)} ve üzeri` : a === 0 ? `${formatPriceShort(b * 100)} altı` : `${formatPriceShort(a * 100)} - ${formatPriceShort(b * 100)}`}
              </button>
            </li>
          );
        })}
      </ul>
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          set("fiyat", min || max ? `${min}-${max}` : null);
        }}
      >
        <input inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} placeholder={`En az`} aria-label="En düşük fiyat" className={clsx("h-9 w-full min-w-0 border border-line bg-bg px-2 text-sm outline-none focus:border-fg", rounded)} />
        <span className="text-muted">-</span>
        <input inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} placeholder={`En çok`} aria-label="En yüksek fiyat" className={clsx("h-9 w-full min-w-0 border border-line bg-bg px-2 text-sm outline-none focus:border-fg", rounded)} />
        <button type="submit" className={clsx("h-9 shrink-0 bg-fg px-3 text-xs font-semibold text-bg", rounded)}>
          Uygula
        </button>
      </form>
    </div>
  );
}

function Toggles({ facets }: { facets: Facets }) {
  const { sp, set } = useQueryState();
  const row = (k: string, label: string, disabled?: boolean) => {
    const on = sp.get(k) === "1";
    return (
      <label className={clsx("flex cursor-pointer items-center justify-between gap-3 text-sm", disabled && "opacity-40")}>
        {label}
        <button
          type="button"
          role="switch"
          aria-checked={on}
          disabled={disabled}
          onClick={() => set(k, on ? null : "1")}
          className={clsx("relative h-6 w-11 shrink-0 rounded-full transition-colors", on ? "bg-primary" : "bg-line")}
        >
          <span className={clsx("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", on ? "left-[22px]" : "left-0.5")} />
        </button>
      </label>
    );
  };
  return (
    <div className="space-y-3">
      {row("indirim", `İndirimli ürünler (${facets.saleCount})`, facets.saleCount === 0)}
      {row("stok", "Sadece stoktakiler")}
    </div>
  );
}

function Group({ title, children, defaultOpen = true, count }: { title: string; children: React.ReactNode; defaultOpen?: boolean; count?: number }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-line py-4">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-center justify-between text-left text-sm font-bold">
        <span>
          {title}
          {count ? <span className="ml-1.5 rounded-full bg-fg px-1.5 text-[10px] text-bg">{count}</span> : null}
        </span>
        <ChevronDown size={16} className={clsx("transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="animate-in mt-3.5">{children}</div>}
    </div>
  );
}

function AllGroups({ facets, variant: theme, hideGender }: { facets: Facets; variant: ThemeKey; hideGender?: boolean }) {
  const variant = styleOf(theme);
  const { get } = useQueryState();
  const dims: Dim[] = ["kategori", "cinsiyet", "marka", "beden", "renk"];
  return (
    <div>
      <div className="border-b border-line py-4">
        <Toggles facets={facets} />
      </div>
      {dims
        .filter((d) => facets[d].length > 1 || get(d).length > 0)
        .filter((d) => !(hideGender && d === "cinsiyet"))
        .map((d) => (
          <Group key={d} title={LABELS[d]} count={get(d).length} defaultOpen={d !== "renk" || variant !== "urban"}>
            <OptionList dim={d} facets={facets} variant={theme} />
          </Group>
        ))}
      <Group title="Fiyat" count={get("fiyat" as Dim).length ? 1 : 0}>
        <PriceFilter facets={facets} variant={theme} />
      </Group>
    </div>
  );
}

/* ---------------- Yerleşimler ---------------- */

export function FilterSidebar({ facets, variant: theme, hideGender }: { facets: Facets; variant: ThemeKey; hideGender?: boolean }) {
  const variant = styleOf(theme);
  return (
    <aside className="hidden lg:block" aria-label="Filtreler">
      <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pb-10 pr-2">
        <AllGroups facets={facets} variant={theme} hideGender={hideGender} />
      </div>
    </aside>
  );
}

export function FilterDrawerButton({ facets, variant: theme, total, hideGender, alwaysVisible }: { facets: Facets; variant: ThemeKey; total: number; hideGender?: boolean; alwaysVisible?: boolean }) {
  const variant = styleOf(theme);
  const [open, setOpen] = useState(false);
  const { clear, pending, sp } = useQueryState();
  const active = ["marka", "beden", "renk", "cinsiyet", "kategori", "fiyat", "indirim", "stok"].filter((k) => sp.get(k)).length;
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);
  const rounded = variant === "pulse" ? "rounded-full" : variant === "arena" ? "rounded-theme" : "";
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={clsx("flex h-11 items-center justify-center gap-2 border border-line px-4 text-sm font-semibold", rounded, !alwaysVisible && "lg:hidden", variant === "neon" && "border-primary text-primary")}
      >
        <SlidersHorizontal size={16} /> Filtrele {active > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-fg px-1 text-[11px] text-bg">{active}</span>}
      </button>
      <div className={clsx("fixed inset-0 z-50 bg-black/45 transition-opacity", open ? "opacity-100" : "pointer-events-none opacity-0")} onClick={() => setOpen(false)} aria-hidden />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Filtreler"
        className={clsx("fixed inset-y-0 left-0 z-50 flex w-full max-w-sm flex-col bg-bg text-fg shadow-2xl transition-[transform,visibility] duration-300", open ? "visible translate-x-0" : "invisible -translate-x-full")}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <p className="font-heading text-lg font-bold">Filtrele</p>
          <button type="button" onClick={() => setOpen(false)} aria-label="Kapat" className="grid h-9 w-9 place-items-center">
            <X size={22} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5">
          <AllGroups facets={facets} variant={theme} hideGender={hideGender} />
        </div>
        <div className="grid grid-cols-2 gap-2 border-t border-line p-4">
          <button type="button" onClick={clear} className={clsx("h-12 border border-line text-sm font-semibold", rounded)}>
            Temizle
          </button>
          <button type="button" onClick={() => setOpen(false)} className={clsx("h-12 bg-primary text-sm font-semibold text-primary-fg", rounded)}>
            {pending ? "Yükleniyor…" : `${total} Ürünü Gör`}
          </button>
        </div>
      </aside>
    </>
  );
}

/** Arena: yatay açılır filtre çubuğu. */
export function FilterBar({ facets, variant: theme, hideGender }: { facets: Facets; variant: ThemeKey; hideGender?: boolean }) {
  const variant = styleOf(theme);
  const [open, setOpen] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const { get, sp, set } = useQueryState();
  useEffect(() => {
    const on = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("mousedown", on);
    return () => document.removeEventListener("mousedown", on);
  }, []);
  const dims: Dim[] = (["kategori", "cinsiyet", "marka", "beden", "renk"] as Dim[]).filter((d) => facets[d].length > 1 && !(hideGender && d === "cinsiyet"));
  return (
    <div ref={ref} className="hidden flex-wrap items-center gap-2 lg:flex">
      {[...dims, "fiyat" as const].map((d) => {
        const n = d === "fiyat" ? (sp.get("fiyat") ? 1 : 0) : get(d).length;
        return (
          <div key={d} className="relative">
            <button
              type="button"
              onClick={() => setOpen(open === d ? null : d)}
              aria-expanded={open === d}
              className={clsx("flex h-10 items-center gap-1.5 rounded-theme border px-4 text-sm font-medium", n ? "border-primary bg-primary text-primary-fg" : "border-line bg-bg hover:border-fg")}
            >
              {LABELS[d]} {n > 0 && `(${n})`} <ChevronDown size={15} />
            </button>
            {open === d && (
              <div className="animate-in absolute left-0 top-12 z-30 w-80 rounded-theme-lg border border-line bg-bg p-4 shadow-xl">
                {d === "fiyat" ? <PriceFilter facets={facets} variant={theme} /> : <OptionList dim={d} facets={facets} variant={theme} />}
              </div>
            )}
          </div>
        );
      })}
      <button
        type="button"
        onClick={() => set("indirim", sp.get("indirim") === "1" ? null : "1")}
        className={clsx("h-10 rounded-theme border px-4 text-sm font-medium", sp.get("indirim") === "1" ? "border-sale bg-sale text-white" : "border-line hover:border-fg")}
      >
        İndirimli
      </button>
    </div>
  );
}

export function SortSelect({ variant: theme }: { variant: ThemeKey }) {
  const variant = styleOf(theme);
  const { sp, set } = useQueryState();
  const cur = sp.get("siralama") ?? "onerilen";
  return (
    <label className={clsx("relative flex h-11 items-center gap-2 border border-line pl-4 pr-9 text-sm", variant === "pulse" ? "rounded-full" : variant === "arena" ? "rounded-theme" : "", variant === "neon" && "bg-card")}>
      <span className="hidden text-muted sm:inline">Sırala:</span>
      <select
        value={cur}
        onChange={(e) => set("siralama", e.target.value === "onerilen" ? null : e.target.value)}
        className="cursor-pointer appearance-none bg-transparent font-semibold outline-none"
        aria-label="Sıralama"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.key} value={o.key} className="text-black">
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={15} className="pointer-events-none absolute right-3" />
    </label>
  );
}

export function ActiveFilters({ facets }: { facets: Facets }) {
  const { get, toggle, set, clear, sp } = useQueryState();
  const chips: { label: string; onRemove: () => void }[] = [];
  (["kategori", "cinsiyet", "marka", "beden", "renk"] as Dim[]).forEach((d) =>
    get(d).forEach((v) => chips.push({ label: `${LABELS[d]}: ${facets[d].find((o) => o.value === v)?.label ?? v}`, onRemove: () => toggle(d, v) })),
  );
  const f = sp.get("fiyat");
  if (f) {
    const [a, b] = f.split("-");
    chips.push({ label: `Fiyat: ${a ? `${a} TL` : "0"} - ${b ? `${b} TL` : "∞"}`, onRemove: () => set("fiyat", null) });
  }
  if (sp.get("indirim") === "1") chips.push({ label: "İndirimli", onRemove: () => set("indirim", null) });
  if (sp.get("stok") === "1") chips.push({ label: "Stoktakiler", onRemove: () => set("stok", null) });
  if (!chips.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <button key={c.label} type="button" onClick={c.onRemove} className="flex items-center gap-1.5 rounded-full bg-soft px-3 py-1.5 text-xs font-medium hover:bg-line">
          {c.label} <X size={13} />
        </button>
      ))}
      <button type="button" onClick={clear} className="px-2 text-xs font-semibold underline underline-offset-2">
        Tümünü temizle
      </button>
    </div>
  );
}

export function PendingOverlay({ children }: { children: React.ReactNode }) {
  return <div className="transition-opacity">{children}</div>;
}
