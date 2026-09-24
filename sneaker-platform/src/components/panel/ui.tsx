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
