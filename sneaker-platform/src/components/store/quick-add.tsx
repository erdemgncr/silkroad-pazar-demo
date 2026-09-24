"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { Plus } from "lucide-react";
import { useStore } from "./providers";
import type { CardProduct } from "@/lib/store-types";

/** Kart üzerinde beden seçip doğrudan sepete ekleme. */
export function QuickAdd({ product, variant }: { product: CardProduct; variant: "bar" | "round" }) {
  const { addToCart, setCartOpen } = useStore();
  const [open, setOpen] = useState(false);
  const available = product.sizes.filter((s) => s.stock > 0);
  if (!product.inStock) return null;

  const add = (size: string, stock: number) => {
    addToCart({
      productId: product.id,
      slug: product.slug,
      title: product.title,
      brand: product.brand,
      colorName: product.colorName,
      image: product.image,
      size,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      maxStock: stock,
    });
    setOpen(false);
    setCartOpen(true);
  };

  if (variant === "round") {
    return (
      <div className="absolute bottom-3 right-3 z-10" onClick={(e) => e.preventDefault()}>
        {open && (
          <div className="animate-in absolute bottom-12 right-0 w-56 rounded-theme bg-card p-3 shadow-xl ring-1 ring-line">
            <p className="mb-2 text-xs font-semibold text-muted">Beden seç</p>
            <div className="grid grid-cols-4 gap-1.5">
              {available.map((s) => (
                <button key={s.size} type="button" onClick={() => add(s.size, s.stock)} className="rounded-full border border-line py-1.5 text-xs font-semibold hover:border-fg">
                  {s.size}
                </button>
              ))}
            </div>
          </div>
        )}
        <button
          type="button"
          aria-label="Hızlı sepete ekle"
          onClick={(e) => {
            e.preventDefault();
            setOpen((v) => !v);
          }}
          className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-fg shadow-lg transition-transform hover:scale-105"
        >
          <Plus size={20} className={clsx("transition-transform", open && "rotate-45")} />
        </button>
      </div>
    );
  }

  return (
    <div
      className="pointer-events-none absolute inset-x-2 bottom-2 z-10 translate-y-2 opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100"
      onClick={(e) => e.preventDefault()}
    >
      <div className="rounded-theme bg-card/95 p-2 shadow-lg ring-1 ring-line backdrop-blur">
        <p className="mb-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-muted">Hızlı Ekle</p>
        <div className="flex flex-wrap justify-center gap-1">
          {available.slice(0, 10).map((s) => (
            <button
              key={s.size}
              type="button"
              onClick={() => add(s.size, s.stock)}
              className="min-w-9 rounded-theme border border-line px-1.5 py-1 text-xs font-semibold hover:border-primary hover:bg-primary hover:text-primary-fg"
            >
              {s.size}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
