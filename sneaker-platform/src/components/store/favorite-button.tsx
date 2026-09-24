"use client";

import { Heart } from "lucide-react";
import { clsx } from "clsx";
import { useStore } from "./providers";
import type { CardProduct } from "@/lib/store-types";

export function FavoriteButton({ product, className, size = 18 }: { product: CardProduct; className?: string; size?: number }) {
  const { isFavorite, toggleFavorite, hydrated } = useStore();
  const active = hydrated && isFavorite(product.id);
  return (
    <button
      type="button"
      aria-label={active ? "Favorilerden çıkar" : "Favorilere ekle"}
      aria-pressed={active}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(product);
      }}
      className={clsx("grid place-items-center transition-transform active:scale-90", className)}
    >
      <Heart size={size} strokeWidth={1.8} className={clsx(active && "fill-sale text-sale")} />
    </button>
  );
}
