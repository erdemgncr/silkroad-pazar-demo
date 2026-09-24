import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePanel } from "@/lib/panel";
import { formatDate, formatDateTime, formatPrice } from "@/lib/format";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";
import { Badge, Card, KeyValue, PageHeader, STATUS_BADGE, Stat } from "@/components/panel/ui";
import { ActionButton } from "@/components/panel/forms";
import { deleteCustomer } from "@/lib/actions/panel-marketing";

export const metadata = { title: "Müşteri" };

export default async function CustomerPage({ params }: PageProps<"/panel/musteriler/[id]">) {
  const { id } = await params;
  const ctx = await requirePanel();
  const c = await db.query.customers.findFirst({ where: eq(schema.customers.id, Number(id)) });
  if (!c) notFound();
  const site = await db.query.sites.findFirst({ where: eq(schema.sites.id, c.siteId) });
  if (!site || (!ctx.isPlatform && site.merchantId !== ctx.merchant?.id)) notFound();
  const [orders, addresses] = await Promise.all([
    db.select().from(schema.orders).where(eq(schema.orders.customerId, c.id)).orderBy(desc(schema.orders.createdAt)),
    db.select().from(schema.addresses).where(eq(schema.addresses.customerId, c.id)),
  ]);
  const paid = orders.filter((o) => ["paid", "preparing", "shipped", "delivered"].includes(o.status));
  const spent = paid.reduce((a, o) => a + o.total, 0);
  return (
    <>
      <div className="mb-2 text-sm text-zinc-500">
        <Link href="/panel/musteriler" className="hover:underline">
          Müşteriler
        </Link>{" "}
        / {c.firstName} {c.lastName}
      </div>
      <PageHeader
        title={`${c.firstName} ${c.lastName}`}
        description={`${site.name} üyesi · ${formatDate(c.createdAt)}`}
        actions={
          <ActionButton action={deleteCustomer.bind(null, c.id)} variant="danger" confirm="KVKK silme talebi: müşteri hesabı, adresleri ve bülten kaydı kalıcı olarak silinsin mi? Siparişler yasal süre boyunca korunur.">
            Müşteriyi sil (KVKK)
          </ActionButton>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Sipariş" value={paid.length} />
        <Stat label="Toplam harcama" value={formatPrice(spent)} />
        <Stat label="Ortalama sepet" value={paid.length ? formatPrice(Math.round(spent / paid.length)) : "—"} />
        <Stat label="Son sipariş" value={orders[0] ? formatDate(orders[0].createdAt) : "—"} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card title="Siparişler">
          {orders.length === 0 ? (
            <p className="text-sm text-zinc-500">Henüz sipariş yok.</p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {orders.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <Link href={`/panel/siparisler/${o.id}`} className="font-semibold hover:underline">
                    {o.orderNo}
                  </Link>
                  <span className="text-zinc-500">{formatDateTime(o.createdAt)}</span>
                  <Badge tone={STATUS_BADGE[o.status].tone}>{ORDER_STATUS_LABEL[o.status]}</Badge>
                  <span className="font-semibold tabular-nums">{formatPrice(o.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <div className="space-y-6">
          <Card title="İletişim">
            <KeyValue
              items={[
                ["E-posta", <a key="e" href={`mailto:${c.email}`} className="underline">{c.email}</a>],
                ["Telefon", c.phone ?? "—"],
                ["İleti izni", c.marketingConsent ? "Var" : "Yok"],
                ["Site", site.name],
              ]}
            />
          </Card>
          <Card title={`Adresler (${addresses.length})`}>
            {addresses.length === 0 ? (
              <p className="text-sm text-zinc-500">Kayıtlı adres yok.</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {addresses.map((a) => (
                  <li key={a.id} className="rounded-lg border border-zinc-200 p-3">
                    <p className="font-semibold">{a.title}</p>
                    <p className="text-zinc-600">
                      {a.fullName} · {a.phone}
                      <br />
                      {a.line}, {a.district} / {a.city}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
