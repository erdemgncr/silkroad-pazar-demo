"use client";

import { useEffect } from "react";
import { useStore } from "../providers";

export function ClearCartOnMount() {
  const { clearCart, hydrated } = useStore();
  useEffect(() => {
    if (hydrated) clearCart();
  }, [hydrated, clearCart]);
  return null;
}
