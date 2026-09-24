import Link from "next/link";
import { clsx } from "clsx";
import type { SiteContext } from "@/lib/site";

export function Logo({ site, className, size = "md" }: { site: SiteContext; className?: string; size?: "sm" | "md" | "lg" }) {
  const text = site.settings.logoText || site.name;
  const theme = site.theme;
  if (site.settings.logoUrl) {
    return (
      <Link href="/" className={clsx("inline-flex items-center", className)} aria-label={`${site.name} ana sayfa`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={site.settings.logoUrl} alt={site.name} className={clsx(size === "lg" ? "h-10" : size === "sm" ? "h-6" : "h-8", "w-auto")} />
      </Link>
    );
  }
  const s = { sm: 0.8, md: 1, lg: 1.3 }[size];
  const inner = (() => {
    switch (theme) {
      case "arena":
        return (
          <span className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary font-heading text-lg font-extrabold text-accent" style={{ transform: `scale(${s})` }}>
              {text.charAt(0)}
            </span>
            <span className="font-heading font-extrabold tracking-tight text-primary" style={{ fontSize: 24 * s }}>
              {text}
            </span>
          </span>
        );
      case "neon":
        return (
          <span className="font-heading uppercase tracking-[0.06em] text-primary drop-shadow-[0_0_14px_var(--c-primary)]" style={{ fontSize: 30 * s }}>
            {text}
          </span>
        );
      case "studio":
        return (
          <span className="font-heading italic tracking-tight" style={{ fontSize: 32 * s }}>
            {text}
          </span>
        );
      case "pulse":
        return (
          <span className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-accent text-accent-fg" style={{ transform: `scale(${s})` }}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M3 12h4l3-8 4 16 3-8h4" />
              </svg>
            </span>
            <span className="font-heading font-extrabold tracking-tight" style={{ fontSize: 24 * s }}>
              {text}
            </span>
          </span>
        );
      default:
        return (
          <span className="font-heading font-black uppercase tracking-[-0.04em]" style={{ fontSize: 28 * s }}>
            {text}
          </span>
        );
    }
  })();
  return (
    <Link href="/" className={clsx("inline-flex shrink-0 items-center leading-none", className)} aria-label={`${site.name} ana sayfa`}>
      {inner}
    </Link>
  );
}
