"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { clsx } from "clsx";
import { CircleAlert, CircleCheck, Loader2, Sparkles } from "lucide-react";
import { aiBulk, bulkPrice, bulkProducts, pushToShopier, type Scope } from "@/lib/actions/panel-products";

export type TableProduct = {
  id: number;
  title: string;
  brand: string;
  colorName: string;
  categoryLabel: string;
  price: string;
  compareAtPrice: string | null;
  image: string | null;
  sku: string;
  active: boolean;
  isNew: boolean;
  isFeatured: boolean;
  fromPool: boolean;
  stock: number;
  variantCount: number;
  shopier?: "synced" | "error" | "pending" | null;
  aiSites?: number;
};

type Result = { ok?: boolean; error?: string; message?: string } | null;

export function ProductTable({ rows, scope, base, sites = [], accounts = [] }: { rows: TableProduct[]; scope: Scope; base: string; sites?: { id: number; name: string }[]; accounts?: { id: number; name: string }[] }) {
  const [sel, setSel] = useState<number[]>([]);
  const [pending, start] = useTransition();
  const [res, setRes] = useState<Result>(null);
  const [aiSite, setAiSite] = useState<number>(sites[0]?.id ?? 0);
  const [acc, setAcc] = useState<number>(accounts[0]?.id ?? 0);
  const all = rows.length > 0 && sel.length === rows.length;
  const toggle = (id: number) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const run = (fn: () => Promise<Result>, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    start(async () => {
      const r = await fn();
      setRes(r);
      if (r?.ok) setSel([]);
    });
  };

  return (
    <div>
      <div className={clsx("sticky top-16 z-20 mb-3 rounded-xl border bg-white p-3 shadow-sm transition-all", sel.length ? "border-zinc-900" : "border-zinc-200")}>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={all} onChange={() => setSel(all ? [] : rows.map((r) => r.id))} className="h-4 w-4" />
            {sel.length ? `${sel.length} seçili` : "Tümünü seç"}
          </label>
          {sel.length > 0 && (
            <>
              <span className="mx-1 h-5 w-px bg-zinc-200" />
              <button type="button" disabled={pending} onClick={() => run(() => bulkProducts(scope, sel, "activate"))} className="h-8 rounded-lg border border-zinc-300 px-3 text-xs font-semibold hover:bg-zinc-50">
                Satışa aç
              </button>
              <button type="button" disabled={pending} onClick={() => run(() => bulkProducts(scope, sel, "deactivate"))} className="h-8 rounded-lg border border-zinc-300 px-3 text-xs font-semibold hover:bg-zinc-50">
                Satıştan kaldır
              </button>
              <button type="button" disabled={pending} onClick={() => run(() => bulkProducts(scope, sel, "featured-on"))} className="h-8 rounded-lg border border-zinc-300 px-3 text-xs font-semibold hover:bg-zinc-50">
                Öne çıkar
              </button>
              <button type="button" disabled={pending} onClick={() => run(() => bulkProducts(scope, sel, "new-on"))} className="h-8 rounded-lg border border-zinc-300 px-3 text-xs font-semibold hover:bg-zinc-50">
                Yeni işaretle
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  const v = window.prompt("Fiyatlar yüzde kaç değişsin? (örn. 10 veya -15)");
                  if (v) run(() => bulkPrice(scope, sel, Number(v.replace(",", "."))));
                }}
                className="h-8 rounded-lg border border-zinc-300 px-3 text-xs font-semibold hover:bg-zinc-50"
              >
                Fiyat % değiştir
              </button>
              {sites.length > 0 && (
                <span className="flex items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 p-0.5 pl-2">
                  <Sparkles size={13} className="text-violet-600" />
                  <select value={aiSite} onChange={(e) => setAiSite(Number(e.target.value))} className="h-7 max-w-[130px] bg-transparent text-xs font-medium outline-none">
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <button type="button" disabled={pending} onClick={() => run(() => aiBulk(aiSite, sel))} className="h-7 rounded-md bg-violet-600 px-2.5 text-xs font-semibold text-white">
                    AI metin üret
                  </button>
                </span>
              )}
              {accounts.length > 0 && (
                <span className="flex items-center gap-1 rounded-lg border border-zinc-200 p-0.5 pl-2">
                  <select value={acc} onChange={(e) => setAcc(Number(e.target.value))} className="h-7 max-w-[120px] bg-transparent text-xs font-medium outline-none">
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                  <button type="button" disabled={pending} onClick={() => run(() => pushToShopier(acc, sel))} className="h-7 rounded-md bg-zinc-900 px-2.5 text-xs font-semibold text-white">
                    {"Shopier'e gönder"}
                  </button>
                </span>
              )}
              <button type="button" disabled={pending} onClick={() => run(() => bulkProducts(scope, sel, "delete"), `${sel.length} ürün kalıcı olarak silinsin mi?`)} className="h-8 rounded-lg border border-rose-300 px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50">
                Sil
              </button>
            </>
          )}
          {pending && <Loader2 size={16} className="animate-spin text-zinc-500" />}
        </div>
        {res && (
          <p className={clsx("mt-2 flex items-center gap-1.5 text-sm", res.ok ? "text-emerald-700" : "text-rose-700")}>
            {res.ok ? <CircleCheck size={15} /> : <CircleAlert size={15} />} {res.message ?? res.error}
          </p>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="hidden bg-zinc-50 text-left text-xs text-zinc-500 md:table-header-group">
            <tr>
              <th className="w-10 px-4 py-3" />
              <th className="px-2 py-3 font-medium">Ürün</th>
              <th className="px-4 py-3 font-medium">Fiyat</th>
              <th className="px-4 py-3 font-medium">Stok</th>
              <th className="hidden px-4 py-3 font-medium xl:table-cell">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((p) => (
              <tr key={p.id} className={clsx("hover:bg-zinc-50", sel.includes(p.id) && "bg-zinc-50")}>
                <td className="w-10 px-4 py-3 align-top md:align-middle">
                  <input type="checkbox" checked={sel.includes(p.id)} onChange={() => toggle(p.id)} className="h-4 w-4" aria-label={`${p.title} seç`} />
                </td>
                <td className="w-full max-w-0 px-2 py-3 md:w-auto md:max-w-none">
                  <Link href={`${base}/${p.id}`} className="flex items-center gap-3">
                    <span className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {p.image && <img src={p.image} alt="" className="h-full w-full object-cover" loading="lazy" />}
                    </span>
                    <span className="min-w-0">
                      <span className="line-clamp-2 font-medium hover:underline">{p.title}</span>
                      <span className="block truncate text-xs text-zinc-500">
                        {p.brand} · {p.categoryLabel} · {p.colorName} · {p.sku}
                      </span>
                      <span className="mt-1 flex flex-wrap gap-1 md:hidden">
                        <b className="text-xs">{p.price}</b>
                        <span className={clsx("text-xs", p.stock === 0 ? "text-rose-600" : "text-zinc-500")}>· {p.stock} stok</span>
                        {!p.active && <span className="rounded bg-zinc-200 px-1.5 text-[10px] font-semibold">Pasif</span>}
                      </span>
                    </span>
                  </Link>
                </td>
                <td className="hidden whitespace-nowrap px-4 py-3 tabular-nums md:table-cell">
                  <b>{p.price}</b>
                  {p.compareAtPrice && <span className="block text-xs text-zinc-400 line-through">{p.compareAtPrice}</span>}
                </td>
                <td className="hidden whitespace-nowrap px-4 py-3 md:table-cell">
                  <span className={clsx("font-semibold tabular-nums", p.stock === 0 ? "text-rose-600" : p.stock <= 5 ? "text-amber-600" : "")}>{p.stock}</span>
                  <span className="block text-xs text-zinc-500">{p.variantCount} beden</span>
                </td>
                <td className="hidden px-4 py-3 xl:table-cell">
                  <div className="flex flex-wrap gap-1">
                    <span className={clsx("rounded-full px-2 py-0.5 text-[11px] font-semibold", p.active ? "bg-emerald-100 text-emerald-800" : "bg-zinc-200 text-zinc-700")}>{p.active ? "Satışta" : "Pasif"}</span>
                    {p.isFeatured && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">Öne çıkan</span>}
                    {p.isNew && <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-800">Yeni</span>}
                    {p.fromPool && <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-600">Havuz</span>}
                    {p.shopier === "synced" && <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-800">Shopier ✓</span>}
                    {p.shopier === "error" && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-800">Shopier hata</span>}
                    {p.aiSites ? <span className="rounded-full bg-fuchsia-100 px-2 py-0.5 text-[11px] font-semibold text-fuchsia-800">AI · {p.aiSites} site</span> : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
