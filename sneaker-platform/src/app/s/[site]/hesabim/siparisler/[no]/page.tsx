import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireSite } from "@/lib/store-context";
import { requireCustomer } from "@/lib/customer";
import { AccountShell } from "@/components/store/account/account-shell";
import { OrderTimeline } from "@/components/store/order-timeline";
import { formatDateTime, formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Sipariş Detayı", robots: { index: false, follow: false } };

export default async function OrderDetailPage({ params }: PageProps<"/s/[site]/hesabim/siparisler/[no]">) {
  const { no } = await params;
  const site = await requireSite(params);
  const c = await requireCustomer(site, `/hesabim/siparisler/${no}`);
  const o = await db.query.orders.findFirst({ where: and(eq(schema.orders.orderNo, no), eq(schema.orders.customerId, c.id)) });
  if (!o) notFound();
  const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, o.id));
  const a = o.shippingAddress;
  return (
    <AccountShell active="/hesabim/siparisler" title={`Sipariş ${o.orderNo}`} name={`${c.firstName} ${c.lastName}`}>
      <p className="-mt-4 mb-6 text-sm text-muted">{formatDateTime(o.createdAt)}</p>
      <OrderTimeline status={o.status} />
      {o.trackingNo && (
        <div className="mt-6 rounded-theme-lg bg-soft p-4 text-sm">
          Kargo: <b>{o.shippingCompany}</b> · Takip no: <b>{o.trackingNo}</b>
        </div>
      )}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <ul className="divide-y divide-line rounded-theme-lg border border-line">
          {items.map((i) => (
            <li key={i.id} className="flex items-center gap-4 p-4">
              {i.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={i.image} alt={i.title} className="h-20 w-20 rounded-theme object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{i.title}</p>
                <p className="text-xs text-muted">
                  Beden {i.size} · {i.quantity} adet
                </p>
              </div>
              <p className="text-sm font-semibold">{formatPrice(i.unitPrice * i.quantity)}</p>
            </li>
          ))}
        </ul>
        <div className="space-y-4">
          <div className="rounded-theme-lg border border-line p-4 text-sm">
            <p className="mb-2 font-semibold">Teslimat Adresi</p>
            <p>{a.fullName}</p>
            <p className="text-muted">
              {a.line}, {a.district} / {a.city}
            </p>
            <p className="text-muted">{a.phone}</p>
          </div>
          <dl className="space-y-1.5 rounded-theme-lg border border-line p-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Ara toplam</dt>
              <dd>{formatPrice(o.subtotal)}</dd>
            </div>
            {o.discount > 0 && (
              <div className="flex justify-between text-sale">
                <dt>İndirim</dt>
                <dd>-{formatPrice(o.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted">Kargo</dt>
              <dd>{o.shippingFee ? formatPrice(o.shippingFee) : "Ücretsiz"}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-2 font-bold">
              <dt>Toplam</dt>
              <dd>{formatPrice(o.total)}</dd>
            </div>
          </dl>
        </div>
      </div>
    </AccountShell>
  );
}
