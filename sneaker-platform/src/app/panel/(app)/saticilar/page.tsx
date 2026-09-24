import Link from "next/link";
import { desc, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePlatform } from "@/lib/panel";
import { PLANS } from "@/lib/plans";
import { THEMES, THEME_KEYS } from "@/themes/registry";
import { formatDate, formatPrice } from "@/lib/format";
import { Badge, Card, PageHeader, Stat } from "@/components/panel/ui";
import { ActionForm, Field, Select, Toggle } from "@/components/panel/forms";
import { createMerchant } from "@/lib/actions/panel-platform";
import { getPlatformSetting } from "@/lib/platform-settings";

export const metadata = { title: "Satıcılar" };

export default async function MerchantsPage({ searchParams }: PageProps<"/panel/saticilar">) {
  await requirePlatform();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().toLocaleLowerCase("tr-TR") : "";
  const general = await getPlatformSetting("general");
  const rows = await db
    .select({
      m: schema.merchants,
      sites: sql<number>`(select count(*) from sites s2 where s2.merchant_id = "merchants"."id")::int`,
      products: sql<number>`(select count(*) from products p2 where p2.catalog_key = 'm:' || "merchants"."id")::int`,
      revenue: sql<number>`(select coalesce(sum(o.total),0) from orders o join sites s on s.id = o.site_id where s.merchant_id = "merchants"."id" and o.status in ('paid','preparing','shipped','delivered') and o.created_at > now() - interval '30 days')::bigint`,
    })
    .from(schema.merchants)
    .orderBy(desc(schema.merchants.createdAt));
  const list = q ? rows.filter((r) => `${r.m.name} ${r.m.email}`.toLocaleLowerCase("tr-TR").includes(q)) : rows;
  const mrr = rows.filter((r) => r.m.status === "active").reduce((a, r) => a + PLANS[r.m.plan].priceMonthly, 0);
  const tone = (s: string) => (s === "active" ? "green" : s === "trial" ? "amber" : "red") as "green" | "amber" | "red";
  const label = (s: string) => (s === "active" ? "Aktif" : s === "trial" ? "Deneme" : "Askıda");

  return (
    <>
      <PageHeader title="Satıcılar" description="Platformu kullanan Shopier satıcıları. Paket, limit, durum ve siteleri buradan yönetilir." />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Toplam satıcı" value={rows.length} />
        <Stat label="Aktif" value={rows.filter((r) => r.m.status === "active").length} hint={`${rows.filter((r) => r.m.status === "trial").length} deneme`} />
        <Stat label="Aylık gelir (MRR)" value={`${mrr.toLocaleString("tr-TR")} ₺`} hint="Aktif paketlere göre" />
        <Stat label="Toplam site" value={rows.reduce((a, r) => a + r.sites, 0)} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div>
          <form className="mb-3">
            <input name="q" defaultValue={q} placeholder="Satıcı adı veya e-posta ara" className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm" />
          </form>
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
            <table className="w-full text-sm">
              <thead className="hidden bg-zinc-50 text-left text-xs text-zinc-500 md:table-header-group">
                <tr>
                  <th className="px-4 py-3 font-medium">Satıcı</th>
                  <th className="px-4 py-3 font-medium">Paket</th>
                  <th className="px-4 py-3 font-medium">Site / Ürün</th>
                  <th className="hidden px-4 py-3 font-medium lg:table-cell">30 gün ciro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {list.map(({ m, sites, products, revenue }) => (
                  <tr key={m.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3">
                      <Link href={`/panel/saticilar/${m.id}`} className="block">
                        <span className="flex items-center gap-2 font-semibold hover:underline">
                          {m.name} <Badge tone={tone(m.status)}>{label(m.status)}</Badge>
                        </span>
                        <span className="block text-xs text-zinc-500">
                          {m.email} · {formatDate(m.createdAt)}
                        </span>
                        <span className="mt-1 block text-xs text-zinc-500 md:hidden">
                          {PLANS[m.plan].name} · {sites} site · {products} ürün
                        </span>
                      </Link>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <Badge tone="violet">{PLANS[m.plan].name}</Badge>
                    </td>
                    <td className="hidden px-4 py-3 tabular-nums md:table-cell">
                      {sites}/{m.siteLimit} · {products}/{m.productLimit}
                    </td>
                    <td className="hidden px-4 py-3 font-semibold tabular-nums lg:table-cell">{formatPrice(Number(revenue))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <Card title="Yeni satıcı" description="Satıcı hesabı, panel kullanıcısı ve isteğe bağlı ilk site tek adımda oluşturulur.">
          <ActionForm action={createMerchant} resetOnSuccess submitLabel="Satıcıyı oluştur">
            <Field label="Mağaza adı" name="name" required />
            <Field label="Yetkili adı" name="ownerName" />
            <Field label="E-posta (giriş)" name="email" type="email" required />
            <Field label="Telefon" name="phone" />
            <div className="grid grid-cols-2 gap-3">
              <Select label="Paket" name="plan" defaultValue={general.defaultPlan} options={Object.values(PLANS).map((p) => ({ value: p.key, label: `${p.name} (${p.priceMonthly} ₺)` }))} />
              <Field label="Deneme (gün)" name="trialDays" type="number" min={0} defaultValue={general.trialDays} />
            </div>
            <Field label="Şifre" name="password" type="text" autoComplete="off" hint="Boş bırakılırsa güçlü bir geçici şifre üretilir." />
            <div className="grid grid-cols-2 gap-3">
              <Field label="İlk site adı (isteğe bağlı)" name="siteName" />
              <Select label="Tema" name="theme" options={THEME_KEYS.map((k) => ({ value: k, label: THEMES[k].name }))} />
            </div>
            <Toggle label="Katalog havuzunun tamamını ekle" name="importPool" defaultChecked />
            <Toggle label="Hoş geldin e-postası gönder" name="sendWelcome" defaultChecked />
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
