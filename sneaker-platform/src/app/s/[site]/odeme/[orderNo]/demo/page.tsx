import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { CreditCard, Lock } from "lucide-react";
import { db, schema } from "@/db";
import { requireSite } from "@/lib/store-context";
import { demoSecret, paymentConfig } from "@/lib/payment-config";
import { signCallbackForTest } from "@/lib/shopier/payment";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Test Ödemesi", robots: { index: false, follow: false } };

export default async function DemoPaymentPage({ params }: PageProps<"/s/[site]/odeme/[orderNo]/demo">) {
  const { orderNo } = await params;
  const site = await requireSite(params);
  const cfg = await paymentConfig(site);
  if (cfg.mode !== "demo") notFound();
  const order = await db.query.orders.findFirst({ where: and(eq(schema.orders.orderNo, orderNo), eq(schema.orders.siteId, site.id)) });
  if (!order) notFound();
  if (order.status !== "pending_payment") redirect(`/odeme/sonuc/${orderNo}`);
  const randomNr = String(Math.floor(100000 + Math.random() * 900000));
  const signature = signCallbackForTest(demoSecret(), orderNo, randomNr);
  const hidden = (status: string) => (
    <>
      <input type="hidden" name="platform_order_id" value={orderNo} />
      <input type="hidden" name="random_nr" value={randomNr} />
      <input type="hidden" name="signature" value={signature} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="installment" value="1" />
      <input type="hidden" name="payment_id" value={`DEMO-${randomNr}`} />
    </>
  );
  return (
    <div className="container-x grid min-h-[70vh] place-items-center py-12">
      <div className="w-full max-w-md rounded-2xl border border-line bg-card p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <span className="rounded-md bg-[#6a1b9a] px-2.5 py-1 text-sm font-extrabold text-white">shopier</span>
          <span className="flex items-center gap-1 text-xs text-muted">
            <Lock size={13} /> Güvenli ödeme (TEST)
          </span>
        </div>
        <p className="text-sm text-muted">{site.name}</p>
        <p className="text-2xl font-bold">{formatPrice(order.total)}</p>
        <p className="mt-1 text-xs text-muted">Sipariş {order.orderNo}</p>
        <div className="mt-5 space-y-3 opacity-70">
          <div className="flex h-12 items-center gap-2 rounded-lg border border-line px-3 text-sm">
            <CreditCard size={18} /> 4508 0345 0803 4509
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex h-12 items-center rounded-lg border border-line px-3 text-sm">12/30</div>
            <div className="flex h-12 items-center rounded-lg border border-line px-3 text-sm">000</div>
          </div>
        </div>
        <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
          Bu site test (demo) ödeme modunda. Gerçek ödeme almak için panelden Shopier hesabını bağlayıp ödeme modunu &quot;Shopier Ödeme Modülü&quot; olarak seçin.
        </p>
        <form action="/api/shopier/callback" method="post" className="mt-5">
          {hidden("success")}
          <button type="submit" className="h-12 w-full rounded-lg bg-[#6a1b9a] font-semibold text-white">
            Ödemeyi Onayla (Test)
          </button>
        </form>
        <form action="/api/shopier/callback" method="post" className="mt-2">
          {hidden("failed")}
          <button type="submit" className="h-11 w-full rounded-lg border border-line text-sm font-medium">
            Başarısız Ödeme Simüle Et
          </button>
        </form>
      </div>
    </div>
  );
}
