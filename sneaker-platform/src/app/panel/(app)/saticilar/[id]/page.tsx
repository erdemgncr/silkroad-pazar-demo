import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { ArrowUpRight, KeyRound, LogIn } from "lucide-react";
import { db, schema } from "@/db";
import { requirePlatform, siteUrl } from "@/lib/panel";
import { PLANS } from "@/lib/plans";
import { THEMES } from "@/themes/registry";
import { formatDate, formatDateTime, formatPrice } from "@/lib/format";
import { Badge, Card, KeyValue, PageHeader, Stat } from "@/components/panel/ui";
import { ActionButton, ActionForm, Field, Select, TextArea, Toggle } from "@/components/panel/forms";
import { actAsMerchant, deleteMerchant, resetMerchantPassword, updateMerchant } from "@/lib/actions/panel-platform";
import { createManualInvoice, markInvoicePaid } from "@/lib/actions/panel-billing";
import { invoiceNo } from "@/lib/billing";

export const metadata = { title: "Satıcı" };

export default async function MerchantPage({ params }: PageProps<"/panel/saticilar/[id]">) {
  await requirePlatform();
  const { id } = await params;
  const m = await db.query.merchants.findFirst({ where: eq(schema.merchants.id, Number(id)) });
  if (!m) notFound();
  const invoices = await db.select().from(schema.subscriptionInvoices).where(eq(schema.subscriptionInvoices.merchantId, m.id)).orderBy(desc(schema.subscriptionInvoices.createdAt)).limit(20);
  const [users, sites, accounts, products] = await Promise.all([
    db.select().from(schema.adminUsers).where(eq(schema.adminUsers.merchantId, m.id)),
    db.select().from(schema.sites).where(eq(schema.sites.merchantId, m.id)).orderBy(desc(schema.sites.createdAt)),
    db.select().from(schema.shopierAccounts).where(eq(schema.shopierAccounts.merchantId, m.id)),
    db.$count(schema.products, eq(schema.products.catalogKey, `m:${m.id}`)),
  ]);
  const ids = sites.map((s) => s.id);
  const domains = ids.length ? await db.select().from(schema.siteDomains).where(inArray(schema.siteDomains.siteId, ids)) : [];
  const [agg] = ids.length
    ? await db
        .select({ n: sql<number>`count(*)::int`, sum: sql<number>`coalesce(sum(${schema.orders.total}),0)::bigint` })
        .from(schema.orders)
        .where(and(inArray(schema.orders.siteId, ids), inArray(schema.orders.status, ["paid", "preparing", "shipped", "delivered"])))
    : [{ n: 0, sum: 0 }];
  const aiUsed = m.aiUsagePeriod === new Date().toISOString().slice(0, 7) ? m.aiUsedThisMonth : 0;

  return (
    <>
      <div className="mb-2 text-sm text-zinc-500">
        <Link href="/panel/saticilar" className="hover:underline">
          Satıcılar
        </Link>{" "}
        / {m.name}
      </div>
      <PageHeader
        title={m.name}
        description={`${m.email} · ${formatDate(m.createdAt)} tarihinden beri`}
        actions={
          <>
            <ActionButton action={actAsMerchant.bind(null, m.id, "/panel/urunler")}>
              <LogIn size={15} /> Satıcı adına yönet
            </ActionButton>
          </>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="Paket" value={PLANS[m.plan].name} hint={`${PLANS[m.plan].priceMonthly} ₺/ay`} />
        <Stat label="Site" value={`${sites.length}/${m.siteLimit}`} />
        <Stat label="Ürün" value={`${products}/${m.productLimit}`} />
        <Stat label="AI (bu ay)" value={`${aiUsed}/${m.geminiApiKey ? "∞" : m.aiMonthlyLimit}`} />
        <Stat label="Toplam ciro" value={formatPrice(Number(agg?.sum ?? 0))} hint={`${agg?.n ?? 0} sipariş`} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <Card title="Siteler">
            {sites.length === 0 ? (
              <p className="text-sm text-zinc-500">Henüz site yok.</p>
            ) : (
              <ul className="divide-y divide-black/5">
                {sites.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <Link href={`/panel/siteler/${s.id}`} className="font-semibold hover:underline">
                        {s.name}
                      </Link>
                      <p className="text-xs text-zinc-500">
                        {siteUrl(s.slug, domains.filter((d) => d.siteId === s.id)).replace(/^https?:\/\//, "")} · {THEMES[s.theme].name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={s.status === "active" ? "green" : s.status === "draft" ? "amber" : "red"}>{s.status === "active" ? "Yayında" : s.status === "draft" ? "Taslak" : "Bakımda"}</Badge>
                      <a href={siteUrl(s.slug, domains.filter((d) => d.siteId === s.id))} target="_blank" rel="noopener noreferrer" className="grid h-8 w-8 place-items-center rounded-full border border-black/10 bg-white/70">
                        <ArrowUpRight size={14} />
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title="Panel kullanıcıları">
            <ul className="divide-y divide-black/5">
              {users.map((u) => (
                <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <p className="font-medium">
                      {u.name} <Badge>{u.role === "merchant_owner" ? "Yönetici" : "Personel"}</Badge>
                    </p>
                    <p className="text-xs text-zinc-500">
                      {u.email} · son giriş {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "hiç"}
                    </p>
                  </div>
                  <ActionButton action={resetMerchantPassword.bind(null, u.id)} confirm={`${u.email} için yeni şifre oluşturulsun mu?`}>
                    <KeyRound size={14} /> Şifre sıfırla
                  </ActionButton>
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Abonelik ödemeleri" description={m.paidUntil ? `Abonelik bitişi: ${formatDate(m.paidUntil)}` : m.trialEndsAt ? `Deneme bitişi: ${formatDate(m.trialEndsAt)}` : "Ödeme kaydı yok"}>
            {invoices.length === 0 ? (
              <p className="text-sm text-zinc-500">Henüz fatura yok.</p>
            ) : (
              <ul className="divide-y divide-black/5 text-sm">
                {invoices.map((i) => (
                  <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <span className="font-semibold">{invoiceNo(i.id)}</span>
                    <span className="text-zinc-500">
                      {PLANS[i.plan].name} · {i.months} ay · {formatDate(i.createdAt)}
                    </span>
                    <span className="font-semibold tabular-nums">{formatPrice(i.amount)}</span>
                    <span className="flex items-center gap-2">
                      <Badge tone={i.status === "paid" ? "green" : i.status === "pending" ? "amber" : "red"}>{i.status === "paid" ? `Ödendi (${i.provider === "shopier" ? "Shopier" : i.provider === "manual" ? "elle" : "test"})` : i.status === "pending" ? "Bekliyor" : i.status === "failed" ? "Başarısız" : "İptal"}</Badge>
                      {i.status === "pending" && (
                        <ActionButton action={markInvoicePaid.bind(null, i.id)} confirm={`${invoiceNo(i.id)} ödendi olarak işaretlensin mi? Paket ve süre güncellenecek.`}>
                          Ödendi
                        </ActionButton>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <details className="mt-4 rounded-lg border border-black/10">
              <summary className="cursor-pointer px-3 py-2 text-sm font-semibold">Elle fatura oluştur (özel fiyat / havale)</summary>
              <div className="border-t border-black/5 p-3">
                <ActionForm action={createManualInvoice.bind(null, m.id)} submitLabel="Fatura oluştur" resetOnSuccess>
                  <div className="grid grid-cols-3 gap-3">
                    <Select label="Paket" name="plan" defaultValue={m.plan} options={Object.values(PLANS).map((p) => ({ value: p.key, label: p.name }))} />
                    <Field label="Ay" name="months" type="number" min={1} max={36} defaultValue={12} />
                    <Field label="Tutar (TL)" name="amount" inputMode="decimal" required />
                  </div>
                  <Field label="Not" name="note" />
                </ActionForm>
              </div>
            </details>
          </Card>
          <Card title="Shopier hesapları">
            {accounts.length === 0 ? (
              <p className="text-sm text-zinc-500">Bağlı Shopier hesabı yok.</p>
            ) : (
              <KeyValue items={accounts.map((a) => [a.name, `${a.productApiEnabled ? "Ürün API açık" : "Ürün API kapalı"} · ${a.apiKey ? "Ödeme modülü var" : "Ödeme modülü yok"} · ${a.lastSyncStatus ?? "senkron yok"}`])} />
            )}
          </Card>
        </div>
        <div className="space-y-6">
          <Card title="Hesap ve paket">
            <ActionForm action={updateMerchant.bind(null, m.id)} key={m.plan + m.status + m.siteLimit}>
              <Field label="Mağaza adı" name="name" defaultValue={m.name} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="E-posta" name="email" type="email" defaultValue={m.email} />
                <Field label="Telefon" name="phone" defaultValue={m.phone ?? ""} />
                <Select label="Paket" name="plan" defaultValue={m.plan} options={Object.values(PLANS).map((p) => ({ value: p.key, label: p.name }))} />
                <Select
                  label="Durum"
                  name="status"
                  defaultValue={m.status}
                  options={[
                    { value: "active", label: "Aktif" },
                    { value: "trial", label: "Deneme" },
                    { value: "suspended", label: "Askıya alındı" },
                  ]}
                />
              </div>
              <Toggle label="Paket değişirse paket limitlerini uygula" name="applyPlanLimits" defaultChecked />
              <div className="grid grid-cols-3 gap-3">
                <Field label="Site limiti" name="siteLimit" type="number" min={0} defaultValue={m.siteLimit} />
                <Field label="Ürün limiti" name="productLimit" type="number" min={0} defaultValue={m.productLimit} />
                <Field label="AI / ay" name="aiMonthlyLimit" type="number" min={0} defaultValue={m.aiMonthlyLimit} />
              </div>
              <Field label="Deneme bitişi" name="trialEndsAt" type="date" defaultValue={m.trialEndsAt ? m.trialEndsAt.toISOString().slice(0, 10) : ""} />
              <TextArea label="İç not" name="adminNote" rows={3} defaultValue={m.adminNote ?? ""} />
            </ActionForm>
          </Card>
          <Card title="Satıcıyı sil" className="border-rose-200" description="Satıcının tüm siteleri, ürünleri, siparişleri ve kullanıcıları kalıcı olarak silinir.">
            <ActionForm action={deleteMerchant.bind(null, m.id)} danger submitLabel="Kalıcı olarak sil">
              <Field label={`Onay için "${m.name}" yazın`} name="confirm" autoComplete="off" />
            </ActionForm>
          </Card>
        </div>
      </div>
    </>
  );
}
