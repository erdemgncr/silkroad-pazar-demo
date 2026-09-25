"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { Check, CircleAlert, CircleCheck, Loader2, Plus } from "lucide-react";
import { importPool } from "@/lib/actions/panel-products";

export type PoolItem = { id: number; title: string; brand: string; price: string; image: string | null; sizes: number; owned: boolean; category: string };

export function PoolPicker({ items, totalMatching, filtered, room }: { items: PoolItem[]; totalMatching: number; filtered: boolean; room: number }) {
  const [sel, setSel] = useState<number[]>([]);
  const [pending, start] = useTransition();
  const [res, setRes] = useState<{ ok?: boolean; error?: string; message?: string } | null>(null);
  const router = useRouter();
  const selectable = items.filter((i) => !i.owned);
  const allOn = selectable.length > 0 && sel.length === selectable.length;
  const run = (ids: number[] | "all") =>
    start(async () => {
      const r = await importPool(ids);
      setRes(r);
      if (r?.ok) {
        setSel([]);
        router.refresh();
      }
    });

  return (
    <div className="mt-4">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setSel(allOn ? [] : selectable.map((i) => i.id))} disabled={!selectable.length} className="h-9 rounded-full border border-black/10 bg-white/70 px-4 text-sm font-semibold hover:bg-white disabled:opacity-40">
          {allOn ? "Seçimi kaldır" : "Bu sayfadakileri seç"}
        </button>
        {!filtered && (
          <button
            type="button"
            disabled={pending}
            onClick={() => window.confirm(`Havuzdaki tüm ürünler (${totalMatching}) kataloğuna eklensin mi? Limitini aşan kısım eklenmez.`) && run("all")}
            className="h-9 rounded-full border border-black/10 bg-white/70 px-4 text-sm font-semibold hover:bg-white"
          >
            Tüm havuzu ekle
          </button>
        )}
        {res && (
          <span className={clsx("flex items-center gap-1.5 text-sm", res.ok ? "text-emerald-700" : "text-rose-700")}>
            {res.ok ? <CircleCheck size={15} /> : <CircleAlert size={15} />} {res.message ?? res.error}
            {res.ok && (
              <Link href="/panel/urunler" className="ml-1 font-semibold underline underline-offset-4">
                Ürünlerime git
              </Link>
            )}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="glass rounded-3xl px-6 py-16 text-center">
          <span className="orb mx-auto mb-3 block h-12 w-12" />
          <p className="font-semibold">Bu aramaya uygun ürün bulamadım.</p>
          <p className="mt-1 text-sm text-zinc-500">Marka ya da model adıyla tekrar dene.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
          {items.map((p) => {
            const on = sel.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                disabled={p.owned}
                onClick={() => setSel(on ? sel.filter((x) => x !== p.id) : [...sel, p.id])}
                aria-pressed={on}
                className={clsx(
                  "group relative overflow-hidden rounded-3xl bg-white/70 text-left transition",
                  on ? "shadow-[0_20px_40px_-20px_rgba(0,0,0,0.5)] ring-2 ring-zinc-900" : "ring-1 ring-black/5 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_16px_32px_-18px_rgba(0,0,0,0.35)]",
                  p.owned && "cursor-default opacity-60 hover:translate-y-0",
                )}
              >
                <div className="relative aspect-square overflow-hidden bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {p.image && <img src={p.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" loading="lazy" />}
                  <span className={clsx("absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full border-2 backdrop-blur transition", on ? "border-zinc-900 bg-zinc-900 text-white" : "border-white bg-white/70")}>
                    {on ? <Check size={16} /> : <Plus size={15} className="text-zinc-500" />}
                  </span>
                  {p.owned && <span className="absolute left-3 top-3 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white">Mağazanda</span>}
                </div>
                <div className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{p.brand}</p>
                  <p className="mt-0.5 line-clamp-2 text-sm font-medium leading-snug">{p.title}</p>
                  <p className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                    <b className="text-[15px] text-zinc-900">{p.price}</b> {p.sizes} beden
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Seçim çubuğu (mobil uygulama hissiyatında, alt sekme çubuğunun üstünde) */}
      <div className={clsx("fixed inset-x-3 bottom-[92px] z-40 transition-all lg:bottom-6 lg:left-1/2 lg:right-auto lg:w-[560px] lg:-translate-x-1/2", sel.length ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0")}>
        <div className="flex items-center gap-3 rounded-full bg-zinc-900 py-2 pl-5 pr-2 text-white shadow-[0_24px_50px_-20px_rgba(0,0,0,0.7)]">
          <span className="min-w-0 flex-1 text-sm">
            <b>{sel.length}</b> ürün seçildi{sel.length > room && <span className="text-amber-300"> · limitin {room}</span>}
          </span>
          <button type="button" onClick={() => setSel([])} className="h-10 rounded-full px-3 text-sm text-white/70 hover:text-white">
            Temizle
          </button>
          <button type="button" disabled={pending} onClick={() => run(sel)} className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-zinc-900 disabled:opacity-60">
            {pending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Mağazama ekle
          </button>
        </div>
      </div>
    </div>
  );
}
