"use client";

import { useEffect } from "react";

export function PrintButton() {
  useEffect(() => {
    const t = window.setTimeout(() => window.print(), 400);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <button type="button" onClick={() => window.print()} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white print:hidden">
      Yazdır
    </button>
  );
}
