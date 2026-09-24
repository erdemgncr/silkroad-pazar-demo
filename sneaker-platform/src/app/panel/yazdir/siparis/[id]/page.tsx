import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePanel } from "@/lib/panel";
import { formatDateTime, formatPrice, itemName } from "@/lib/format";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";
import { PrintButton } from "./print-button";

export const metadata: Metadata = { title: "Sipariş Yazdır", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Siparişi paketle birlikte gönderilecek sevk/irsaliye formatında yazdırır. */
export default async function PrintOrderPage({ params }: PageProps<"/panel/yazdir/siparis/[id]">) {
  const ctx = await requirePanel();
  const { id } = await params;
  const order = await db.query.orders.findFirst({ where: eq(schema.orders.id, Number(id)) });
  if (!order) notFound();
  const site = await db.query.sites.findFirst({ where: eq(schema.sites.id, order.siteId) });
  if (!site || (!ctx.isPlatform && site.merchantId !== ctx.merchant?.id)) notFound();
  const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, order.id));
  const s = site.settings;
  const a = order.shippingAddress;
  const b = order.billingAddress;
  return (
    <div className="mx-auto max-w-3xl bg-white p-8 font-sans text-[13px] text-black print:p-0">
      <div className="mb-6 flex items-start justify-between gap-6 border-b-2 border-black pb-4">
        <div>
          <p className="text-2xl font-black">{s.logoText || site.name}</p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-600">
            {s.company.legalName}
            <br />
            {s.company.address || `${s.contact.address} ${s.contact.district} / ${s.contact.city}`}
            <br />
            {s.contact.phone} · {s.contact.email}
            {s.company.taxOffice && (
              <>
                <br />
                {s.company.taxOffice} · VKN {s.company.taxNumber}
              </>
            )}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">SİPARİŞ / SEVK FORMU</p>
          <p className="mt-1 font-mono text-base font-bold">{order.orderNo}</p>
          <p className="text-xs text-zinc-600">{formatDateTime(order.createdAt)}</p>
          <p className="text-xs text-zinc-600">{ORDER_STATUS_LABEL[order.status]}</p>
          <div className="mt-3">
            <PrintButton />
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-6">
        <div>
          <p className="mb-1 text-xs font-bold uppercase text-zinc-500">Teslimat adresi</p>
          <p className="font-semibold">{a.fullName}</p>
          <p>{a.line}</p>
          <p>
            {a.district} / {a.city} {a.postcode}
          </p>
          <p>{a.phone}</p>
        </div>
        <div>
          <p className="mb-1 text-xs font-bold uppercase text-zinc-500">Fatura adresi</p>
          <p className="font-semibold">{b.fullName}</p>
          <p>{b.line}</p>
          <p>
            {b.district} / {b.city} {b.postcode}
          </p>
          <p>{order.email}</p>
        </div>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-y border-black text-left text-xs uppercase">
            <th className="py-2">Ürün</th>
            <th className="py-2">Beden</th>
            <th className="py-2 text-center">Adet</th>
            <th className="py-2 text-right">Birim</th>
            <th className="py-2 text-right">Tutar</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id} className="border-b border-zinc-300">
              <td className="py-2 pr-2">{itemName(it.brand, it.title)}</td>
              <td className="py-2">{it.size}</td>
              <td className="py-2 text-center">{it.quantity}</td>
              <td className="py-2 text-right tabular-nums">{formatPrice(it.unitPrice)}</td>
              <td className="py-2 text-right tabular-nums">{formatPrice(it.unitPrice * it.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="ml-auto mt-3 w-64 space-y-1">
        <p className="flex justify-between">
          <span>Ara toplam</span> <span className="tabular-nums">{formatPrice(order.subtotal)}</span>
        </p>
        {order.discount > 0 && (
          <p className="flex justify-between">
            <span>İndirim {order.couponCode && `(${order.couponCode})`}</span> <span className="tabular-nums">-{formatPrice(order.discount)}</span>
          </p>
        )}
        <p className="flex justify-between">
          <span>Kargo</span> <span className="tabular-nums">{order.shippingFee ? formatPrice(order.shippingFee) : "Ücretsiz"}</span>
        </p>
        <p className="flex justify-between border-t border-black pt-1 text-base font-bold">
          <span>Toplam</span> <span className="tabular-nums">{formatPrice(order.total)}</span>
        </p>
      </div>
      {order.note && (
        <div className="mt-6 rounded border border-zinc-300 p-3">
          <p className="text-xs font-bold uppercase text-zinc-500">Müşteri notu</p>
          <p>{order.note}</p>
        </div>
      )}
      <div className="mt-8 border-t border-zinc-300 pt-4 text-xs leading-relaxed text-zinc-600">
        <p>
          <b>İade ve değişim:</b> Ürünü teslim aldığınız tarihten itibaren {s.shipping.returnDays} gün içinde, kullanılmamış ve etiketi sökülmemiş olarak iade edebilir ya da beden değişimi yapabilirsiniz. İade talebi için {s.contact.email || s.contact.phone} üzerinden sipariş numaranızla bize ulaşın.
        </p>
        <p className="mt-2">Teşekkür ederiz! — {site.name}</p>
      </div>
    </div>
  );
}
