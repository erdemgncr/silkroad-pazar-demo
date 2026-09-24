"use client";

import type { ThemeKey } from "@/themes/registry";
import { useStore } from "../providers";
import { ProductCard } from "../product-card";
import { Carousel } from "../interactive";
import { SectionHeading } from "../sections";

export function RecentlyViewed({ excludeId, variant, title = "Son Gezdiğin Ürünler" }: { excludeId?: number; variant: ThemeKey; title?: string }) {
  const { recent, hydrated } = useStore();
  const items = recent.filter((p) => p.id !== excludeId);
  if (!hydrated || items.length === 0) return null;
  return (
    <section className="container-x py-10 md:py-14">
      <SectionHeading title={title} variant={variant} withArrows />
      <Carousel variant={variant}>
        {items.map((p) => (
          <ProductCard key={p.id} p={p} variant={variant} />
        ))}
      </Carousel>
    </section>
  );
}
