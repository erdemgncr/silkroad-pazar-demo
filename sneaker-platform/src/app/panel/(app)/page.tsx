import Link from "next/link";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { ArrowUpRight, CheckCircle2, Circle, Eye } from "lucide-react";
import { db, schema } from "@/db";
import { requirePanel, siteUrl } from "@/lib/panel";
import { orderStats, visibleSites } from "@/lib/panel-data";
import { Badge, ButtonLink, Card, PageHeader, Stat } from "@/components/panel/ui";
import { formatDateTime, formatPrice } from "@/lib/format";
import { THEMES } from "@/themes/registry";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";
import { merchantCatalogKey } from "@/lib/catalog-admin";

export const metadata = { title: "Genel Bakış" };

function RevenueChart({ daily }: { daily: { day: string; revenue: number }[] }) {
  const days: { day: string; revenue: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    days.push({ day: d, revenue: daily.find((x) => x.day === d)?.revenue ?? 0 });
  }
  const max = Math.max(1, ...days.map((d) => d.revenue));
  return (
    <div>
      <div className="flex h-40 items-end gap-1">
        {days.map((d) => (
          <div key={d.day} className="group relative flex-1">
            <div className="rounded-t bg-zinc-900 transition-colors group-hover:bg-orange-500" style={{ height: `${Math.max(2, (d.revenue / max) * 150)}px` }} />
            <span className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-zinc-900 px-2 py-1 text-[11px] text-white group-hover:block">
              {d.day.slice(5)}: {formatPrice(d.revenue)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-zinc-400">
        <span>30 gün önce</span>
        <span>Bugün</span>
      </div>
    </div>
  );
}

export default async function PanelHome() {
  const ctx = await requirePanel();
  const sites = await visibleSites(ctx);
  const ids = sites.map((s) => s.id);
  const stats = await orderStats(ids);
  const recent = ids.length
    ? await db.select().from(schema.orders).where(inArray(schema.orders.siteId, ids)).orderBy(desc(schema.orders.createdAt)).limit(8)
    : [];
  const [productCount] = ctx.merchant
    ? await db.select({ n: sql<number>`count(*)::int` }).from(schema.products).where(eq(schema.products.catalogKey, merchantCatalogKey(ctx.merchant.id)))
    : await db.select({ n: sql<number>`count(*)::int` }).from(schema.products).where(eq(schema.products.catalogKey, "pool"));
  const shopier = ctx.merchant ? await db.select().from(schema.shopierAccounts).where(eq(schema.shopierAccounts.merchantId, ctx.merchant.id)) : [];
  const merchants = ctx.isPlatform ? await db.select({ n: sql<number>`count(*)::int` }).from(schema.merchants) : null;

  const steps = [
    { done: sites.length > 0, label: "İlk siteni oluştur", href: "/panel/siteler" },
    { done: (productCount?.n ?? 0) > 0, label: "Katalog havuzundan ürün ekle", href: "/panel/katalog" },
    { done: shopier.length > 0, label: "Shopier hesabını bağla", href: "/panel/shopier" },
    { done: sites.some((s) => s.domains.length > 0), label: "Alan adını bağla", href: "/panel/siteler" },
    { done: sites.some((s) => s.status === "active"), label: "Siteni yayına al", href: "/panel/siteler" },
  ];

  return (
    <>
      <PageHeader
        title={ctx.isPlatform ? "Platform Genel Bakış" : `Hoş geldin, ${ctx.user.name.split(" ")[0]}`}
        description={ctx.isPlatform ? "Tüm satıcıların sitelerini, siparişlerini ve katalog havuzunu buradan yönetebilirsin." : "Sitelerinin ve siparişlerinin son durumu."}
        actions={<ButtonLink href="/panel/siteler/yeni">+ Yeni Site</ButtonLink>}
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Son 30 gün ciro" value={formatPrice(stats.revenue)} hint={`${stats.count} ödenmiş sipariş`} />
        <Stat label="Hazırlanacak sipariş" value={stats.pending} hint="Ödendi / hazırlanıyor" />
        <Stat label={ctx.isPlatform ? "Satıcı" : "Site"} value={ctx.isPlatform ? (merchants?.[0]?.n ?? 0) : `${sites.length}${ctx.merchant ? ` / ${ctx.merchant.siteLimit}` : ""}`} hint={ctx.isPlatform ? `${sites.length} site` : "Paket limiti"} />
        <Stat label={ctx.isPlatform ? "Havuzdaki ürün" : "Ürün"} value={productCount?.n ?? 0} hint={ctx.merchant ? `Limit ${ctx.merchant.productLimit}` : "Katalog havuzu"} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card title="Satışlar" description="Son 30 günün günlük cirosu" className="xl:col-span-2">
          <RevenueChart daily={stats.daily} />
        </Card>
        {!ctx.isPlatform ? (
          <Card title="Kurulum adımları" description={`${steps.filter((s) => s.done).length}/${steps.length} tamamlandı`}>
            <ul className="space-y-3">
              {steps.map((s) => (
                <li key={s.label}>
                  <Link href={s.href} className="flex items-center gap-3 text-sm hover:underline">
                    {s.done ? <CheckCircle2 size={18} className="text-emerald-500" /> : <Circle size={18} className="text-zinc-300" />}
                    <span className={s.done ? "text-zinc-400 line-through" : ""}>{s.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <Card title="Hızlı işlemler">
            <div className="grid gap-2">
              <ButtonLink href="/panel/saticilar" variant="secondary">Satıcıları yönet</ButtonLink>
              <ButtonLink href="/panel/havuz" variant="secondary">Katalog havuzuna ürün ekle</ButtonLink>
              <ButtonLink href="/panel/platform-ayarlari" variant="secondary">Gemini API ve platform ayarları</ButtonLink>
            </div>
          </Card>
        )}
      </div>

      <Card title="Siteler" className="mt-6" actions={<Link href="/panel/siteler" className="text-sm font-medium hover:underline">Tümü</Link>}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sites.slice(0, 6).map((s) => {
            const url = siteUrl(s.slug, s.domains);
            return (
              <div key={s.id} className="flex flex-col rounded-lg border border-zinc-200 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{s.name}</p>
                    <p className="truncate text-xs text-zinc-500">{url.replace(/^https?:\/\//, "")}</p>
                  </div>
                  <Badge tone={s.status === "active" ? "green" : s.status === "draft" ? "amber" : "red"}>{s.status === "active" ? "Yayında" : s.status === "draft" ? "Taslak" : "Bakımda"}</Badge>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
                  <span className="h-3 w-3 rounded-full" style={{ background: s.settings.colors.primary }} />
                  Tema: {THEMES[s.theme].name}
                </div>
                <div className="mt-4 flex gap-2">
                  <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white">
                    Siteyi Aç <ArrowUpRight size={13} />
                  </a>
                  <a href={`/panel/onizle/${s.slug}`} className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold">
                    <Eye size={13} /> Önizle
                  </a>
                  <Link href={`/panel/siteler/${s.id}`} className="inline-flex items-center rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold">
                    Düzenle
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="Son siparişler" className="mt-6" actions={<Link href="/panel/siparisler" className="text-sm font-medium hover:underline">Tümü</Link>}>
        {recent.length === 0 ? (
          <p className="text-sm text-zinc-500">Henüz sipariş yok.</p>
        ) : (
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-zinc-500">
                <tr>
                  <th className="px-5 py-2 font-medium">Sipariş</th>
                  <th className="px-5 py-2 font-medium">Site</th>
                  <th className="px-5 py-2 font-medium">Müşteri</th>
                  <th className="px-5 py-2 font-medium">Tutar</th>
                  <th className="px-5 py-2 font-medium">Durum</th>
                  <th className="px-5 py-2 font-medium">Tarih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {recent.map((o) => (
                  <tr key={o.id} className="hover:bg-zinc-50">
                    <td className="px-5 py-3 font-medium">
                      <Link href={`/panel/siparisler/${o.id}`} className="hover:underline">
                        {o.orderNo}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-zinc-500">{sites.find((s) => s.id === o.siteId)?.name}</td>
                    <td className="px-5 py-3">
                      {o.firstName} {o.lastName}
                    </td>
                    <td className="px-5 py-3 tabular-nums">{formatPrice(o.total)}</td>
                    <td className="px-5 py-3">
                      <Badge tone={o.status === "pending_payment" ? "amber" : o.status === "cancelled" ? "red" : o.status === "delivered" ? "green" : "blue"}>{ORDER_STATUS_LABEL[o.status]}</Badge>
                    </td>
                    <td className="px-5 py-3 text-zinc-500">{formatDateTime(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
