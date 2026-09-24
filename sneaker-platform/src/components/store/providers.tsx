"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CardProduct, CartLine, StoreClientConfig } from "@/lib/store-types";

type Toast = { id: number; title: string; body?: string; image?: string };

type StoreState = {
  config: StoreClientConfig;
  cart: CartLine[];
  cartCount: number;
  cartSubtotal: number;
  addToCart: (line: Omit<CartLine, "key" | "quantity">, qty?: number) => void;
  setQuantity: (key: string, qty: number) => void;
  removeFromCart: (key: string) => void;
  clearCart: () => void;
  recent: CardProduct[];
  pushRecent: (p: CardProduct) => void;
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;
  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;
  toast: Toast | null;
  showToast: (t: Omit<Toast, "id">) => void;
  hydrated: boolean;
};

const Ctx = createContext<StoreState | null>(null);

function read<T>(key: string, fallback: T): T {
  try {
    const v = window.localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* depolama kapalı olabilir */
  }
}

export function StoreProvider({ config, children }: { config: StoreClientConfig; children: React.ReactNode }) {
  const k = (name: string) => `sp:${config.siteId}:${name}`;
  const [cart, setCart] = useState<CartLine[]>([]);
  const [recent, setRecent] = useState<CardProduct[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    // localStorage yalnızca istemcide okunabilir; ilk render sunucu çıktısıyla aynı kalsın diye burada yüklenir.
    /* eslint-disable react-hooks/set-state-in-effect */
    setCart(read(k("cart"), []));
    setRecent(read(k("recent"), []));
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.siteId]);

  useEffect(() => {
    if (hydrated) write(k("cart"), cart);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, hydrated]);
  useEffect(() => {
    if (hydrated) write(k("recent"), recent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recent, hydrated]);

  useEffect(() => {
    const lock = cartOpen || searchOpen || menuOpen;
    document.documentElement.style.overflow = lock ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [cartOpen, searchOpen, menuOpen]);

  const showToast = useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now();
    setToast({ ...t, id });
    window.setTimeout(() => setToast((cur) => (cur?.id === id ? null : cur)), 3200);
  }, []);

  const addToCart = useCallback((line: Omit<CartLine, "key" | "quantity">, qty = 1) => {
    const key = `${line.productId}:${line.size}`;
    setCart((cur) => {
      const found = cur.find((l) => l.key === key);
      if (found) return cur.map((l) => (l.key === key ? { ...l, quantity: Math.min(l.quantity + qty, line.maxStock || 10) } : l));
      return [...cur, { ...line, key, quantity: Math.min(qty, line.maxStock || 10) }];
    });
  }, []);

  const setQuantity = useCallback((key: string, qty: number) => {
    setCart((cur) => cur.map((l) => (l.key === key ? { ...l, quantity: Math.max(1, Math.min(qty, l.maxStock || 10)) } : l)));
  }, []);
  const removeFromCart = useCallback((key: string) => setCart((cur) => cur.filter((l) => l.key !== key)), []);
  const clearCart = useCallback(() => setCart([]), []);

  const pushRecent = useCallback((p: CardProduct) => {
    setRecent((cur) => [p, ...cur.filter((x) => x.id !== p.id)].slice(0, 12));
  }, []);

  const value = useMemo<StoreState>(
    () => ({
      config,
      cart,
      cartCount: cart.reduce((a, l) => a + l.quantity, 0),
      cartSubtotal: cart.reduce((a, l) => a + l.quantity * l.price, 0),
      addToCart,
      setQuantity,
      removeFromCart,
      clearCart,
      recent,
      pushRecent,
      cartOpen,
      setCartOpen,
      searchOpen,
      setSearchOpen,
      menuOpen,
      setMenuOpen,
      toast,
      showToast,
      hydrated,
    }),
    [config, cart, addToCart, setQuantity, removeFromCart, clearCart, recent, pushRecent, cartOpen, searchOpen, menuOpen, toast, showToast, hydrated],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): StoreState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore must be used inside StoreProvider");
  return v;
}
