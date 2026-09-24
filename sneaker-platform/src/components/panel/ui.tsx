import Link from "next/link";
import { clsx } from "clsx";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-1 max-w-3xl text-sm text-zinc-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className, title, description, actions }: { children: React.ReactNode; className?: string; title?: string; description?: string; actions?: React.ReactNode }) {
  return (
    <section className={clsx("rounded-xl border border-zinc-200 bg-white", className)}>
      {(title || actions) && (
        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 px-5 py-4">
          <div>
            {title && <h2 className="font-semibold">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-zinc-500">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
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
        "inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors",
        variant === "primary" ? "bg-zinc-900 text-white hover:bg-zinc-800" : "border border-zinc-300 bg-white hover:bg-zinc-50",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export const inputCls = "h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-zinc-900";
export const labelCls = "mb-1.5 block text-sm font-medium text-zinc-700";
export const btnCls = "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50";
export const btnSecondaryCls = "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-semibold hover:bg-zinc-50 disabled:opacity-50";

export function Empty({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-14 text-center">
      <p className="font-semibold">{title}</p>
      {description && <p className="max-w-md text-sm text-zinc-500">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

/** Sekme gezinmesi (?sekme= parametresiyle). Mobilde yatay kaydırılır. */
export function TabNav({ tabs, active, base }: { tabs: { key: string; label: string; badge?: number | string }[]; active: string; base: string }) {
  return (
    <div className="no-scrollbar -mx-4 mb-6 overflow-x-auto border-b border-zinc-200 px-4 md:mx-0 md:px-0">
      <nav className="flex min-w-max gap-1">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`${base}${base.includes("?") ? "&" : "?"}sekme=${t.key}`}
            scroll={false}
            className={clsx(
              "relative flex items-center gap-1.5 whitespace-nowrap px-3 py-3 text-sm font-medium transition-colors",
              active === t.key ? "text-zinc-900 after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:bg-zinc-900" : "text-zinc-500 hover:text-zinc-900",
            )}
          >
            {t.label}
            {t.badge !== undefined && t.badge !== 0 && <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold text-zinc-600">{t.badge}</span>}
          </Link>
        ))}
      </nav>
    </div>
  );
}

/** GET arama/filtre formu. */
export function FilterBar({ children, action }: { children: React.ReactNode; action?: string }) {
  return (
    <form action={action} className="mb-4 flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-3 sm:flex-row sm:flex-wrap sm:items-center">
      {children}
      <button type="submit" className="h-10 rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white">
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
          <Link key={p} href={href(p)} className={clsx("grid h-9 min-w-9 place-items-center rounded-lg border px-2 text-sm font-medium", p === page ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white hover:border-zinc-400")}>
            {p}
          </Link>
        ),
      )}
    </nav>
  );
}

/** Masaüstünde tablo, mobilde kart görünümü için tablo kabı. */
export function TableCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx("overflow-hidden rounded-xl border border-zinc-200 bg-white", className)}>{children}</div>;
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
    zinc: "border-zinc-200 bg-zinc-50 text-zinc-700",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    green: "border-emerald-200 bg-emerald-50 text-emerald-900",
    blue: "border-sky-200 bg-sky-50 text-sky-900",
    red: "border-rose-200 bg-rose-50 text-rose-900",
  }[tone];
  return <div className={clsx("rounded-xl border px-4 py-3 text-sm leading-relaxed", t)}>{children}</div>;
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
