import { discountPercent, formatPrice } from "@/lib/format";
import { clsx } from "clsx";

export function Price({
  price,
  compareAt,
  size = "md",
  showBadge = false,
  className,
}: {
  price: number;
  compareAt: number | null;
  size?: "sm" | "md" | "lg" | "xl";
  showBadge?: boolean;
  className?: string;
}) {
  const pct = discountPercent(price, compareAt);
  const sizes = {
    sm: "text-[13px]",
    md: "text-sm",
    lg: "text-lg",
    xl: "text-2xl md:text-[28px]",
  };
  return (
    <div className={clsx("flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      <span className={clsx(sizes[size], "font-semibold tabular-nums", pct ? "text-sale" : "text-fg")}>{formatPrice(price)}</span>
      {pct > 0 && (
        <span className={clsx(size === "xl" ? "text-base" : "text-xs", "text-muted line-through tabular-nums")}>{formatPrice(compareAt!)}</span>
      )}
      {showBadge && pct > 0 && (
        <span className="rounded-theme bg-sale px-1.5 py-0.5 text-[11px] font-bold text-white">%{pct} İndirim</span>
      )}
    </div>
  );
}
