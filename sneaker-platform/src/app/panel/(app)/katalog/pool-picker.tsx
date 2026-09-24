"use client";

import { useState, useTransition } from "react";
import { clsx } from "clsx";
import { Check, CircleAlert, CircleCheck, Loader2, Plus } from "lucide-react";
import { importPool } from "@/lib/actions/panel-products";

export type PoolItem = { id: number; title: string; brand: string; price: string; image: string | null; sizes: number; owned: boolean; category: string };

export function PoolPicker({ items, totalMatching, filtered }: { items: PoolItem[]; totalMatching: number; filtered: boolean }) {
  const [sel, setSel] = useState<number[]>([]);
  const [pending, start] = useTransition();
  const [res, setRes] = useState<{ ok?: boolean; error?: string; message?: string } | null>(null);
  const selectable = items.filter((i) => !i.owned);
  const run = (ids: number[] | "all") =>
    start(async () => {
      const r = await importPool(ids);
      setRes(r);
      if (r?.ok) setSel([]);
    });
  return (
    <div>
      <div className="sticky top-16 z-20 mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
        <button type="button" onClick={() => setSel(sel.length === selectable.length ? [] : selectable.map((i) => i.id))} className="h-9 rounded-lg border border-zinc-300 px-3 text-sm font-semibold">
          {sel.length === selectable.length && selectable.length ? "Seçimi kaldır" : "Sayfadakileri seç"}
        </button>
        <button type="button" disabled={!sel.length || pending} onClick={() => run(sel)} className="inline-flex h-9 items-center gap-2 rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white disabled:opacity-40">
          {pending ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Seçilenleri ekle ({sel.length})
        </button>
        {!filtered && (
          <button
            type="button"
            disabled={pending}
            onClick={() => window.confirm(`Havuzdaki tüm ürünler (${totalMatching}) kataloğuna eklensin mi?`) && run("all")}
            className="h-9 rounded-lg border border-zinc-300 px-3 text-sm font-semibold"
          >
            Tüm havuzu ekle
          </button>
        )}
        {res && (
          <span className={clsx("flex items-center gap-1.5 text-sm", res.ok ? "text-emerald-700" : "text-rose-700")}>
            {res.ok ? <CircleCheck size={15} /> : <CircleAlert size={15} />} {res.message ?? res.error}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
        {items.map((p) => {
          const on = sel.includes(p.id);
          return (
            <button
              key={p.id}
              type="button"
              disabled={p.owned}
              onClick={() => setSel(on ? sel.filter((x) => x !== p.id) : [...sel, p.id])}
              className={clsx("group relative overflow-hidden rounded-xl border-2 bg-white text-left transition-all", on ? "border-zinc-900 shadow-lg" : "border-transparent ring-1 ring-zinc-200 hover:ring-zinc-400", p.owned && "cursor-default opacity-60")}
            >
              <div className="relative aspect-square bg-zinc-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.image && <img src={p.image} alt="" className="h-full w-full object-cover" loading="lazy" />}
                <span className={clsx("absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full border-2 bg-white", on ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300")}>{on && <Check size={15} />}</span>
                {p.owned && <span className="absolute left-2 top-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-semibold text-white">Kataloğunda</span>}
              </div>
              <div className="p-3">
                <p className="text-xs font-bold uppercase text-zinc-500">{p.brand}</p>
                <p className="line-clamp-2 text-sm font-medium leading-snug">{p.title}</p>
                <p className="mt-1 flex items-center justify-between text-xs text-zinc-500">
                  <b className="text-sm text-zinc-900">{p.price}</b> {p.sizes} beden
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
