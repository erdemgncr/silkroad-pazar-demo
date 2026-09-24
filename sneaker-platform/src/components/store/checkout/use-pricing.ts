"use client";

import { useEffect, useState } from "react";
import type { Pricing } from "@/lib/orders";
import { priceCartAction } from "@/lib/actions/checkout";
import { useStore } from "../providers";

/** Sepeti sunucuda güncel fiyat/stokla yeniden hesaplar. */
export function usePricing(coupon: string | null) {
  const { cart, hydrated } = useStore();
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [loading, setLoading] = useState(true);
  const key = JSON.stringify(cart.map((l) => [l.productId, l.size, l.quantity])) + (coupon ?? "");
  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const t = window.setTimeout(async () => {
      const r = await priceCartAction(
        cart.map((l) => ({ productId: l.productId, size: l.size, quantity: l.quantity })),
        coupon,
      );
      if (!cancelled) {
        setPricing(r);
        setLoading(false);
      }
    }, 150);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, hydrated]);
  return { pricing, loading };
}
