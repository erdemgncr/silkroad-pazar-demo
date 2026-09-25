import Link from "next/link";
import { clsx } from "clsx";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-[28px] font-semibold tracking-[-0.03em] md:text-[32px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-3xl text-[15px] text-zinc-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className, title, description, actions }: { children: React.ReactNode; className?: string; title?: string; description?: string; actions?: React.ReactNode }) {
  return (
    <section className={clsx("glass rounded-3xl", className)}>
      {(title || actions) && (
        <div className="flex items-start justify-between gap-4 border-b border-black/5 px-6 py-5">
          <div>
            {title && <h2 className="text-[17px] font-semibold tracking-tight">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-zinc-500">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className="p-6">{children}</div>
    </section>
  );
}

export function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="glass rounded-3xl p-5">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-zinc-400">{hint}</p>}
    </div>
  );
}

export function Badge({ children, tone = "zinc" }: { children: React.ReactNode; tone?: "zinc" | "green" | "amber" | "red" | "blue" | "violet" }) {
  const tones = {
    zinc: "bg-zinc-100 text-zinc-700",
    green: "bg-emerald-100 text-emerald-800",
    amber: "bg-amber-100 text-amber-800",
    red: "bg-rose-100 text-rose-800",
    blue: "bg-sky-100 text-sky-800",
    violet: "bg-violet-100 text-violet-800",
  };
  return <span className={clsx("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", tones[tone])}>{children}</span>;
}

export function ButtonLink({ href, children, variant = "primary", className, target }: { href: string; children: React.ReactNode; variant?: "primary" | "secondary"; className?: string; target?: string }) {
  return (
    <Link
      href={href}
      target={target}
      className={clsx(
        "inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors",
        variant === "primary" ? "bg-zinc-900 text-white shadow-[0_8px_20px_-8px_rgba(0,0,0,0.5)] hover:bg-zinc-800" : "border-[1.5px] border-zinc-900 bg-white/60 hover:bg-white",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export const inputCls = "h-11 w-full rounded-xl border border-black/10 bg-white/80 px-3.5 text-sm outline-none transition focus:border-zinc-900 focus:bg-white focus:ring-4 focus:ring-zinc-900/5";
export const labelCls = "mb-1.5 block text-sm font-medium text-zinc-700";
export const btnCls = "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-zinc-900 px-5 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_rgba(0,0,0,0.5)] hover:bg-zinc-800 disabled:opacity-50";
export const btnSecondaryCls = "inline-flex h-11 items-center justify-center gap-2 rounded-full border-[1.5px] border-zinc-900 bg-white/60 px-5 text-sm font-semibold hover:bg-white disabled:opacity-50";

export function Empty({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="glass flex flex-col items-center justify-center gap-2 rounded-3xl px-6 py-16 text-center">
      <span className="orb mb-2 h-12 w-12" />
      <p className="font-semibold">{title}</p>
      {description && <p className="max-w-md text-sm text-zinc-500">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

/** Sekme gezinmesi (?sekme= parametresiyle). Mobilde yatay kaydırılır. */
export function TabNav({ tabs, active, base }: { tabs: { key: string; label: string; badge?: number | string }[]; active: string; base: string }) {
  return (
    <div className="no-scrollbar -mx-4 mb-6 overflow-x-auto px-4 md:mx-0 md:px-0">
      <nav className="glass inline-flex min-w-max gap-1 rounded-full p-1">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`${base}${base.includes("?") ? "&" : "?"}sekme=${t.key}`}
            scroll={false}
            className={clsx(
              "flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors",
              active === t.key ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-600 hover:bg-white/80 hover:text-zinc-900",
            )}
          >
            {t.label}
            {t.badge !== undefined && t.badge !== 0 && <span className={clsx("rounded-full px-1.5 py-0.5 text-[10px] font-bold", active === t.key ? "bg-white/20 text-white" : "bg-black/5 text-zinc-600")}>{t.badge}</span>}
          </Link>
        ))}
      </nav>
    </div>
  );
}

/** GET arama/filtre formu. */
export function FilterBar({ children, action }: { children: React.ReactNode; action?: string }) {
  return (
    <form action={action} className="glass mb-4 flex flex-col gap-2 rounded-3xl p-3 sm:flex-row sm:flex-wrap sm:items-center">
      {children}
      <button type="submit" className="h-10 rounded-full bg-zinc-900 px-5 text-sm font-semibold text-white">
        Filtrele
      </button>
    </form>
  );
}

export function Pager({ page, pages, href }: { page: number; pages: number; href: (p: number) => string }) {
  if (pages < 2) return null;
  const list: (number | "…")[] = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) list.push(i);
    else if (list[list.length - 1] !== "…") list.push("…");
  }
  return (
    <nav className="mt-5 flex flex-wrap items-center justify-center gap-1" aria-label="Sayfalama">
      {list.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-2 text-zinc-400">
            …
          </span>
        ) : (
          <Link key={p} href={href(p)} className={clsx("grid h-10 min-w-10 place-items-center rounded-full border px-3 text-sm font-medium", p === page ? "border-zinc-900 bg-zinc-900 text-white" : "border-white/80 bg-white/60 hover:bg-white")}>
            {p}
          </Link>
        ),
      )}
    </nav>
  );
}

/** Masaüstünde tablo, mobilde kart görünümü için tablo kabı. */
export function TableCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx("glass overflow-hidden rounded-3xl", className)}>{children}</div>;
}

export const thCls = "px-4 py-3 text-left text-xs font-medium text-zinc-500";
export const tdCls = "px-4 py-3 align-middle";

export function KeyValue({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[minmax(110px,auto)_1fr] gap-x-4 gap-y-2 text-sm">
      {items.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-zinc-500">{k}</dt>
          <dd className="min-w-0 break-words font-medium">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Notice({ children, tone = "zinc" }: { children: React.ReactNode; tone?: "zinc" | "amber" | "green" | "blue" | "red" }) {
  const t = {
    zinc: "border-white/80 bg-white/60 text-zinc-700",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    green: "border-emerald-200 bg-emerald-50 text-emerald-900",
    blue: "border-sky-200 bg-sky-50 text-sky-900",
    red: "border-rose-200 bg-rose-50 text-rose-900",
  }[tone];
  return <div className={clsx("rounded-2xl border px-4 py-3 text-sm leading-relaxed backdrop-blur", t)}>{children}</div>;
}

export const STATUS_BADGE: Record<string, { label: string; tone: "zinc" | "green" | "amber" | "red" | "blue" | "violet" }> = {
  pending_payment: { label: "Ödeme bekleniyor", tone: "amber" },
  paid: { label: "Ödeme alındı", tone: "blue" },
  preparing: { label: "Hazırlanıyor", tone: "violet" },
  shipped: { label: "Kargoda", tone: "violet" },
  delivered: { label: "Teslim edildi", tone: "green" },
  cancelled: { label: "İptal", tone: "red" },
  refunded: { label: "İade edildi", tone: "zinc" },
};
