import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Crumb } from "@/lib/catalog";

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Sayfa yolu" className={className}>
      <ol className="flex flex-wrap items-center gap-1 text-xs text-muted">
        {items.map((c, i) => (
          <li key={`${c.href}-${i}`} className="flex items-center gap-1">
            {i > 0 && <ChevronRight size={12} aria-hidden />}
            {i === items.length - 1 ? (
              <span aria-current="page" className="text-fg">
                {c.label}
              </span>
            ) : (
              <Link href={c.href} className="hover:text-fg hover:underline">
                {c.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
