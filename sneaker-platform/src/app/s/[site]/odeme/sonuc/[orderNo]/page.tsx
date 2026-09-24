import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { CircleAlert, CircleCheck, Clock } from "lucide-react";
import { db, schema } from "@/db";
import { requireSite } from "@/lib/store-context";
import { formatPrice } from "@/lib/format";
import { ClearCartOnMount } from "@/components/store/checkout/clear-cart";

export const metadata: Metadata = { title: "Sipariş Sonucu", robots: { index: false, follow: false } };

export default async function OrderResultPage({ params, searchParams }: PageProps<"/s/[site]/odeme/sonuc/[orderNo]">) {
  const { orderNo } = await params;
  const sp = await searchParams;
  const site = await requireSite(params);
  const order = await db.query.orders.findFirst({ where: and(eq(schema.orders.orderNo, orderNo), eq(schema.orders.siteId, site.id)) });
  if (!order) notFound();
  const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, order.id));
  const paid = ["paid", "preparing", "shipped", "delivered"].includes(order.status);
  const failed = sp.durum === "hata" || order.status === "cancelled";

  return (
    <div className="container-x py-12 md:py-16">
      <div className="mx-auto max-w-2xl">
        {paid ? (
          <div className="text-center">
            <ClearCartOnMount />
            <CircleCheck size={60} strokeWidth={1.5} className="mx-auto text-emerald-500" />
            <h1 className="mt-4 font-heading text-3xl font-bold">Siparişin alındı!</h1>
            <p className="mt-2 text-muted">
              Teşekkürler {order.firstName}. <b className="text-fg">{order.orderNo}</b> numaralı siparişinin onayını <b className="text-fg">{order.email}</b> adresine gönderdik.
            </p>
          </div>
        ) : failed ? (
          <div className="text-center">
            <CircleAlert size={60} strokeWidth={1.5} className="mx-auto text-sale" />
            <h1 className="mt-4 font-heading text-3xl font-bold">Ödeme tamamlanamadı</h1>
            <p className="mt-2 text-muted">Kartından herhangi bir tutar çekilmedi. Sepetindeki ürünler seni bekliyor; farklı bir kartla tekrar deneyebilirsin.</p>
            <Link href="/odeme" className="mt-6 inline-block rounded-theme bg-primary px-8 py-3.5 text-sm font-semibold text-primary-fg">
              Tekrar Dene
            </Link>
          </div>
        ) : (
          <div className="text-center">
            <Clock size={60} strokeWidth={1.5} className="mx-auto text-amber-500" />
            <h1 className="mt-4 font-heading text-3xl font-bold">Ödeme bekleniyor</h1>
            <p className="mt-2 text-muted">Ödeme işlemin henüz tamamlanmadı.</p>
            <Link href={`/odeme/${order.orderNo}/yonlendir`} className="mt-6 inline-block rounded-theme bg-primary px-8 py-3.5 text-sm font-semibold text-primary-fg">
              Ödemeye Devam Et
            </Link>
          </div>
        )}

        <div className="mt-10 rounded-theme-lg border border-line p-5 md:p-6">
          <p className="mb-4 font-semibold">Sipariş Özeti</p>
          <ul className="divide-y divide-line">
            {items.map((i) => (
              <li key={i.id} className="flex items-center gap-4 py-3">
                {i.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={i.image} alt={i.title} className="h-16 w-16 rounded-theme object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{i.title}</p>
                  <p className="text-xs text-muted">
                    Beden {i.size} · {i.quantity} adet
                  </p>
                </div>
                <p className="text-sm font-semibold">{formatPrice(i.unitPrice * i.quantity)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Ara toplam</dt>
              <dd>{formatPrice(order.subtotal)}</dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-sale">
                <dt>İndirim {order.couponCode && `(${order.couponCode})`}</dt>
                <dd>-{formatPrice(order.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted">Kargo</dt>
              <dd>{order.shippingFee ? formatPrice(order.shippingFee) : "Ücretsiz"}</dd>
            </div>
            <div className="flex justify-between pt-2 text-base font-bold">
              <dt>Toplam</dt>
              <dd>{formatPrice(order.total)}</dd>
            </div>
          </dl>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/siparis-takip" className="rounded-theme border border-line px-6 py-3 text-sm font-semibold hover:border-fg">
            Sipariş Takibi
          </Link>
          <Link href="/" className="rounded-theme bg-primary px-6 py-3 text-sm font-semibold text-primary-fg">
            Alışverişe Devam Et
          </Link>
        </div>
      </div>
    </div>
  );
}
