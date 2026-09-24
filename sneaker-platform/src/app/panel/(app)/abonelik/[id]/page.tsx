import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { CheckCircle2, CreditCard, ShieldCheck, XCircle } from "lucide-react";
import { db, schema } from "@/db";
import { requireMerchant } from "@/lib/panel";
import { PLANS } from "@/lib/plans";
import { invoiceNo } from "@/lib/billing";
import { formatDate, formatDateTime, formatPrice } from "@/lib/format";
import { getPlatformSetting } from "@/lib/platform-settings";
import { Badge, Card, KeyValue, Notice, PageHeader } from "@/components/panel/ui";
import { ActionButton } from "@/components/panel/forms";
import { cancelInvoice, confirmDemoPayment } from "@/lib/actions/panel-billing";

export const metadata = { title: "Paket Ödemesi" };

export default async function InvoicePage({ params, searchParams }: PageProps<"/panel/abonelik/[id]">) {
  const ctx = await requireMerchant();
  const { id } = await params;
  const sp = await searchParams;
  const inv = await db.query.subscriptionInvoices.findFirst({ where: and(eq(schema.subscriptionInvoices.id, Number(id)), eq(schema.subscriptionInvoices.merchantId, ctx.merchant.id)) });
  if (!inv) notFound();
  const billing = await getPlatformSetting("billing");
  const plan = PLANS[inv.plan];
  const shopierReady = billing.mode === "shopier" && billing.shopierApiKey && billing.shopierApiSecret;

  return (
    <>
      <div className="mb-2 text-sm text-zinc-500">
        <Link href="/panel/hesap?sekme=paket" className="hover:underline">
          Hesap ve Paket
        </Link>{" "}
        / {invoiceNo(inv.id)}
      </div>
      <PageHeader title={`${plan.name} paket · ${inv.months === 12 ? "Yıllık" : "Aylık"}`} description={`Fatura ${invoiceNo(inv.id)} · ${formatDateTime(inv.createdAt)}`} />
      {sp.odeme === "ok" && inv.status === "paid" && (
        <div className="mb-5">
          <Notice tone="green">
            <span className="flex items-center gap-2 font-semibold">
              <CheckCircle2 size={18} /> Ödemen alındı, paketin aktif. Teşekkürler!
            </span>
          </Notice>
        </div>
      )}
      {sp.odeme === "hata" && (
        <div className="mb-5">
          <Notice tone="red">
            <span className="flex items-center gap-2">
              <XCircle size={18} /> Ödeme tamamlanamadı. Kart bilgilerini kontrol edip tekrar deneyebilirsin.
            </span>
          </Notice>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card title="Özet">
          <KeyValue
            items={[
              ["Paket", plan.name],
              ["Süre", `${inv.months} ay`],
              ["Site / ürün / AI", `${plan.siteLimit} site · ${plan.productLimit.toLocaleString("tr-TR")} ürün · ${plan.aiMonthlyLimit.toLocaleString("tr-TR")} AI/ay`],
              ["Tutar", <b key="t">{formatPrice(inv.amount)}</b>],
              ["Durum", <Badge key="s" tone={inv.status === "paid" ? "green" : inv.status === "pending" ? "amber" : "red"}>{inv.status === "paid" ? "Ödendi" : inv.status === "pending" ? "Ödeme bekliyor" : inv.status === "failed" ? "Başarısız" : "İptal"}</Badge>],
              ...(inv.paidAt ? ([["Ödeme tarihi", formatDate(inv.paidAt)]] as [string, string][]) : []),
              ...(ctx.merchant.paidUntil ? ([["Abonelik bitişi", formatDate(ctx.merchant.paidUntil)]] as [string, string][]) : []),
            ]}
          />
          <ul className="mt-5 space-y-1.5 text-sm text-zinc-600">
            {plan.features.map((f) => (
              <li key={f} className="flex gap-2">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" /> {f}
              </li>
            ))}
          </ul>
        </Card>
        {inv.status === "pending" || inv.status === "failed" ? (
          <Card title="Ödeme">
            <p className="text-3xl font-black">{formatPrice(inv.amount)}</p>
            <p className="mt-1 text-sm text-zinc-500">KDV dahil · {inv.months} ay</p>
            <div className="mt-5 space-y-3">
              {shopierReady ? (
                <a href={`/panel/abonelik/${inv.id}/ode`} className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 text-sm font-semibold text-white">
                  <CreditCard size={17} /> Kartla öde (Shopier)
                </a>
              ) : billing.mode === "demo" ? (
                <>
                  <Notice tone="amber">Platform test modunda: gerçek ödeme alınmaz. Onayladığında paket hemen aktifleşir.</Notice>
                  <ActionButton action={confirmDemoPayment.bind(null, inv.id)} variant="primary" className="h-12 w-full">
                    Test ödemesini onayla
                  </ActionButton>
                </>
              ) : (
                <Notice tone="amber">Kartla ödeme henüz yapılandırılmadı. Aşağıdaki banka bilgileriyle ödeme yapabilirsin.</Notice>
              )}
              {billing.bankInfo && (
                <div className="rounded-lg bg-zinc-50 p-3 text-sm">
                  <p className="font-semibold">Havale / EFT</p>
                  <p className="whitespace-pre-line text-zinc-600">{billing.bankInfo}</p>
                  <p className="mt-1 text-xs text-zinc-500">Açıklamaya {invoiceNo(inv.id)} yazın; ödeme onaylandığında paketin aktifleşir.</p>
                </div>
              )}
              <p className="flex items-center gap-2 text-xs text-zinc-500">
                <ShieldCheck size={14} /> Ödemeler Shopier güvenli ödeme altyapısıyla, 3D Secure ile alınır.
              </p>
              {inv.status === "pending" && (
                <ActionButton action={cancelInvoice.bind(null, inv.id)} confirm="Bu ödeme talebi iptal edilsin mi?">
                  Vazgeç
                </ActionButton>
              )}
            </div>
          </Card>
        ) : (
          <Card title="Durum">
            <p className="flex items-center gap-2 text-sm">
              {inv.status === "paid" ? <CheckCircle2 className="text-emerald-600" /> : <XCircle className="text-rose-600" />}
              {inv.status === "paid" ? `Ödendi (${inv.provider === "shopier" ? "Shopier" : inv.provider === "manual" ? "havale/elle onay" : "test"})` : "İptal edildi"}
            </p>
            <Link href="/panel/hesap?sekme=paket" className="mt-4 inline-block text-sm font-semibold underline">
              Paket sayfasına dön
            </Link>
          </Card>
        )}
      </div>
    </>
  );
}
