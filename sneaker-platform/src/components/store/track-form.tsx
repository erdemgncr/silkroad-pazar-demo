"use client";

import { useActionState } from "react";
import { trackOrder, type TrackResult } from "@/lib/actions/store";
import { formatDateTime, formatPrice } from "@/lib/format";
import { OrderTimeline } from "./order-timeline";

export function TrackForm() {
  const [state, action, pending] = useActionState<TrackResult, FormData>(trackOrder, null);
  return (
    <div className="mx-auto max-w-2xl">
      <form action={action} className="grid gap-3 rounded-theme-lg border border-line p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold">Sipariş numarası</span>
          <input name="orderNo" required placeholder="Örn. KI2609241234" className="h-12 w-full rounded-theme border border-line bg-bg px-4 text-sm uppercase outline-none focus:border-fg" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold">E-posta</span>
          <input name="email" type="email" required className="h-12 w-full rounded-theme border border-line bg-bg px-4 text-sm outline-none focus:border-fg" />
        </label>
        <button type="submit" disabled={pending} className="h-12 rounded-theme bg-primary px-6 text-sm font-semibold text-primary-fg disabled:opacity-60">
          {pending ? "Sorgulanıyor…" : "Sorgula"}
        </button>
      </form>
      {state && !state.ok && <p className="mt-4 rounded-theme bg-sale/10 p-4 text-sm text-sale">{state.message}</p>}
      {state?.ok && (
        <div className="mt-6 space-y-5 rounded-theme-lg border border-line p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold">Sipariş {state.order.orderNo}</p>
            <p className="text-sm text-muted">{formatDateTime(state.order.createdAt)}</p>
          </div>
          <OrderTimeline status={state.order.status} />
          {state.order.trackingNo && (
            <p className="rounded-theme bg-soft p-3 text-sm">
              Kargo: <b>{state.order.shippingCompany}</b> · Takip no: <b>{state.order.trackingNo}</b>
            </p>
          )}
          <ul className="divide-y divide-line">
            {state.order.items.map((i, k) => (
              <li key={k} className="flex items-center gap-3 py-3 text-sm">
                {i.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={i.image} alt="" className="h-14 w-14 rounded-theme object-cover" />
                )}
                <span className="flex-1">{i.title}</span>
                <span className="text-muted">
                  {i.size} × {i.quantity}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-right font-bold">Toplam: {formatPrice(state.order.total)}</p>
        </div>
      )}
    </div>
  );
}
