import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq, ilike } from "drizzle-orm";
import { Mail, MapPin, Phone, Printer, User } from "lucide-react";
import { db, schema } from "@/db";
import { requirePanel, siteUrl } from "@/lib/panel";
import { formatDateTime, formatPrice, itemName } from "@/lib/format";
import { ORDER_STATUS_LABEL, ORDER_STATUS_STEPS } from "@/lib/order-status";
import { Badge, Card, KeyValue, Notice, PageHeader, STATUS_BADGE } from "@/components/panel/ui";
import { ActionButton, ActionForm, Field, Select, TextArea, Toggle } from "@/components/panel/forms";
import { resendConfirmation, updateOrder } from "@/lib/actions/panel-orders";

export const metadata = { title: "Sipariş" };

const CARRIERS = ["Yurtiçi Kargo", "Aras Kargo", "MNG Kargo", "PTT Kargo", "Sürat Kargo", "HepsiJET", "Trendyol Express", "Kolay Gelsin", "UPS", "DHL", "Diğer"];

export default async function OrderPage({ params }: PageProps<"/panel/siparisler/[id]">) {
  const { id } = await params;
  const ctx = await requirePanel();
  const order = await db.query.orders.findFirst({ where: eq(schema.orders.id, Number(id)) });
  if (!order) notFound();
  const site = await db.query.sites.findFirst({ where: eq(schema.sites.id, order.siteId) });
  if (!site || (!ctx.isPlatform && site.merchantId !== ctx.merchant?.id)) notFound();
  const [items, domains, mails] = await Promise.all([
    db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, order.id)),
    db.select().from(schema.siteDomains).where(eq(schema.siteDomains.siteId, site.id)),
    db
      .select()
      .from(schema.emailLogs)
      .where(and(eq(schema.emailLogs.siteId, site.id), ilike(schema.emailLogs.subject, `%${order.orderNo}%`)))
      .orderBy(desc(schema.emailLogs.createdAt))
      .limit(10),
  ]);
  const url = siteUrl(site.slug, domains);
  const stepIndex = ORDER_STATUS_STEPS.indexOf(order.status as (typeof ORDER_STATUS_STEPS)[number]);
  const a = order.shippingAddress;
  const b = order.billingAddress;
  const sameBilling = JSON.stringify(a) === JSON.stringify(b);

  return (
    <>
      <div className="mb-2 text-sm text-zinc-500">
        <Link href="/panel/siparisler" className="hover:underline">
          Siparişler
        </Link>{" "}
        / {order.orderNo}
      </div>
      <PageHeader
        title={`Sipariş ${order.orderNo}`}
        description={`${formatDateTime(order.createdAt)} · ${site.name}${order.source === "shopier" ? " · Shopier siparişi" : ""}`}
        actions={
          <>
            <Badge tone={STATUS_BADGE[order.status].tone}>{ORDER_STATUS_LABEL[order.status]}</Badge>
            <a href={`/panel/yazdir/siparis/${order.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 text-sm font-semibold hover:bg-zinc-50">
              <Printer size={15} /> Yazdır / irsaliye
            </a>
          </>
        }
      />
      {order.status === "pending_payment" && (
        <div className="mb-5">
          <Notice tone="amber">Bu siparişin ödemesi henüz onaylanmadı. Havale/EFT gibi bir ödeme aldıysan durumu &quot;Ödeme alındı&quot; yaparak onaylayabilirsin; stok otomatik düşülür ve müşteriye onay e-postası gider.</Notice>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-6">
          {!["cancelled", "refunded", "pending_payment"].includes(order.status) && (
            <Card>
              <ol className="grid grid-cols-4 gap-2">
                {ORDER_STATUS_STEPS.map((s, i) => (
                  <li key={s} className="text-center">
                    <span className={`mx-auto block h-1.5 rounded-full ${i <= stepIndex ? "bg-zinc-900" : "bg-zinc-200"}`} />
                    <span className={`mt-2 block text-xs ${i <= stepIndex ? "font-semibold" : "text-zinc-400"}`}>{ORDER_STATUS_LABEL[s]}</span>
                  </li>
                ))}
              </ol>
            </Card>
          )}
          <Card title={`Ürünler (${items.reduce((x, i) => x + i.quantity, 0)})`}>
            <ul className="divide-y divide-zinc-100">
              {items.map((it) => (
                <li key={it.id} className="flex gap-3 py-3">
                  <span className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {it.image && <img src={it.image} alt="" className="h-full w-full object-cover" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    {it.productId ? (
                      <Link href={`/panel/urunler/${it.productId}`} className="line-clamp-2 font-medium hover:underline">
                        {itemName(it.brand, it.title)}
                      </Link>
                    ) : (
                      <p className="line-clamp-2 font-medium">{itemName(it.brand, it.title)}</p>
                    )}
                    <p className="text-sm text-zinc-500">
                      Beden: <b className="text-zinc-900">{it.size}</b> · Adet: {it.quantity} · {formatPrice(it.unitPrice)}
                    </p>
                  </div>
                  <p className="whitespace-nowrap font-semibold tabular-nums">{formatPrice(it.unitPrice * it.quantity)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1.5 border-t border-zinc-100 pt-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-zinc-500">Ara toplam</dt>
                <dd className="tabular-nums">{formatPrice(order.subtotal)}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <dt>İndirim {order.couponCode && `(${order.couponCode})`}</dt>
                  <dd className="tabular-nums">-{formatPrice(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-zinc-500">Kargo</dt>
                <dd className="tabular-nums">{order.shippingFee ? formatPrice(order.shippingFee) : "Ücretsiz"}</dd>
              </div>
              <div className="flex justify-between border-t border-zinc-100 pt-2 text-base font-bold">
                <dt>Toplam</dt>
                <dd className="tabular-nums">{formatPrice(order.total)}</dd>
              </div>
            </dl>
          </Card>
          {order.note && (
            <Card title="Müşteri notu">
              <p className="whitespace-pre-line text-sm">{order.note}</p>
            </Card>
          )}
          <div className="grid gap-6 md:grid-cols-2">
            <Card title="Teslimat adresi">
              <Address a={a} />
            </Card>
            <Card title="Fatura adresi">{sameBilling ? <p className="text-sm text-zinc-500">Teslimat adresiyle aynı.</p> : <Address a={b} />}</Card>
          </div>
          <Card title="Bu siparişle ilgili e-postalar">
            {mails.length === 0 ? (
              <p className="text-sm text-zinc-500">Kayıt yok.</p>
            ) : (
              <ul className="divide-y divide-zinc-100 text-sm">
                {mails.map((m) => (
                  <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <span className="min-w-0 truncate">{m.subject}</span>
                    <span className="flex items-center gap-2">
                      <Badge tone={m.status === "sent" ? "green" : m.status === "failed" ? "red" : "zinc"}>{m.status === "sent" ? "Gönderildi" : m.status === "failed" ? "Hata" : "Kaydedildi"}</Badge>
                      <span className="text-xs text-zinc-400">{formatDateTime(m.createdAt)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Durum ve kargo">
            <ActionForm action={updateOrder.bind(null, order.id)} key={order.updatedAt.toISOString()}>
              <Select label="Sipariş durumu" name="status" defaultValue={order.status} options={Object.entries(ORDER_STATUS_LABEL).map(([value, label]) => ({ value, label }))} />
              <Select label="Kargo firması" name="shippingCompany" defaultValue={order.shippingCompany ?? site.settings.shipping.carrier} options={[{ value: "", label: "Seçin" }, ...[...new Set([site.settings.shipping.carrier, ...CARRIERS])].map((c) => ({ value: c, label: c }))]} />
              <Field label="Kargo takip numarası" name="trackingNo" defaultValue={order.trackingNo ?? ""} />
              <Toggle label="Müşteriye e-posta ile bildir" name="notifyCustomer" defaultChecked hint="Kargoya verildiğinde takip numarasıyla birlikte gönderilir." />
              <TextArea label="Müşteriye not (isteğe bağlı)" name="customerNote" rows={2} />
              <Toggle label="İptal/iadede ürünleri stoğa geri ekle" name="restock" defaultChecked />
              <TextArea label="İç not (müşteri görmez)" name="adminNote" rows={3} defaultValue={order.adminNote ?? ""} />
            </ActionForm>
          </Card>
          <Card title="Müşteri">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <User size={15} className="text-zinc-400" />
                {order.customerId ? (
                  <Link href={`/panel/musteriler/${order.customerId}`} className="font-semibold hover:underline">
                    {order.firstName} {order.lastName}
                  </Link>
                ) : (
                  <span className="font-semibold">
                    {order.firstName} {order.lastName} <span className="font-normal text-zinc-400">(misafir)</span>
                  </span>
                )}
              </li>
              <li className="flex items-center gap-2">
                <Mail size={15} className="text-zinc-400" />
                <a href={`mailto:${order.email}`} className="hover:underline">
                  {order.email}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={15} className="text-zinc-400" />
                <a href={`tel:${order.phone.replace(/\s/g, "")}`} className="hover:underline">
                  {order.phone}
                </a>
              </li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={`https://wa.me/${order.phone.replace(/\D/g, "").replace(/^0/, "90")}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center rounded-lg border border-zinc-300 px-3 text-sm font-semibold hover:bg-zinc-50">
                WhatsApp
              </a>
              <ActionButton action={resendConfirmation.bind(null, order.id)}>Durum e-postası gönder</ActionButton>
            </div>
          </Card>
          <Card title="Ödeme">
            <KeyValue
              items={[
                ["Yöntem", order.paymentProvider === "shopier" ? "Shopier" : order.paymentProvider],
                ["Referans", order.paymentRef ?? "—"],
                ["Taksit", order.installment ? `${order.installment} taksit` : "Tek çekim"],
                ["Kupon", order.couponCode ?? "—"],
                ...(order.shopierOrderId ? ([["Shopier sipariş", order.shopierOrderId]] as [string, string][]) : []),
              ]}
            />
            <a href={`${url}/siparis-takip`} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-sm font-medium underline">
              Müşterinin sipariş takip sayfası
            </a>
          </Card>
        </div>
      </div>
    </>
  );
}

function Address({ a }: { a: { fullName: string; phone: string; city: string; district: string; line: string; postcode?: string } }) {
  return (
    <div className="flex gap-2 text-sm">
      <MapPin size={15} className="mt-0.5 shrink-0 text-zinc-400" />
      <p>
        <b>{a.fullName}</b>
        <br />
        {a.line}
        <br />
        {a.district} / {a.city} {a.postcode}
        <br />
        {a.phone}
      </p>
    </div>
  );
}
