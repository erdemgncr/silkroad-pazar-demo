import Link from "next/link";
import { and, desc, eq, gte, inArray, isNull, sql } from "drizzle-orm";
import { ArrowUpRight, CheckCircle2, Circle, Eye, TrendingDown, TrendingUp } from "lucide-react";
import { db, schema } from "@/db";
import { requirePanel, siteUrl } from "@/lib/panel";
import { orderStats, visibleSites } from "@/lib/panel-data";
import { Badge, ButtonLink, Card, PageHeader, STATUS_BADGE } from "@/components/panel/ui";
import { formatDateTime, formatPrice, itemName } from "@/lib/format";
import { THEMES } from "@/themes/registry";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";
import { merchantCatalogKey } from "@/lib/catalog-admin";
import { PLANS } from "@/lib/plans";

export const metadata = { title: "Genel Bakış" };

function currentTime() {
  return Date.now();
}

function lastDays(n: number, from: number) {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(new Date(from - i * 86400000).toISOString().slice(0, 10));
  return out;
}

function RevenueChart({ daily, days }: { daily: { day: string; revenue: number; count: number }[]; days: string[] }) {
  const data = days.map((d) => ({ day: d, revenue: daily.find((x) => x.day === d)?.revenue ?? 0, count: daily.find((x) => x.day === d)?.count ?? 0 }));
  const max = Math.max(1, ...data.map((d) => d.revenue));
  return (
    <div>
      <div className="flex h-44 items-end gap-[3px]">
        {data.map((d) => (
          <div key={d.day} className="group relative flex h-full flex-1 items-end">
            <div className="w-full rounded-t bg-zinc-900 transition-colors group-hover:bg-orange-500" style={{ height: `${Math.max(1.5, (d.revenue / max) * 100)}%` }} />
            <span className="pointer-events-none absolute -top-10 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-zinc-900 px-2 py-1 text-[11px] text-white group-hover:block">
              {d.day.slice(8)}.{d.day.slice(5, 7)} · {formatPrice(d.revenue)} · {d.count} sipariş
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

function Kpi({ label, value, delta, hint }: { label: string; value: string | number; delta?: number | null; hint?: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 md:p-5">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums md:text-2xl">{value}</p>
      <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-zinc-400">
        {delta != null && Number.isFinite(delta) && (
          <span className={`inline-flex items-center gap-0.5 font-semibold ${delta >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {delta >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />} %{Math.abs(Math.round(delta))}
          </span>
        )}
        {hint}
      </p>
    </div>
  );
}

export default async function PanelHome({ searchParams }: PageProps<"/panel">) {
  const sp = await searchParams;
  const ctx = await requirePanel();
  const sites = await visibleSites(ctx);
  const ids = sites.map((s) => s.id);
  const idList = ids.length ? ids : [-1];
  const nowMs = currentTime();
  const [stats, prev] = await Promise.all([orderStats(ids, 30), orderStats(ids, 60)]);
  const prevRevenue = prev.revenue - stats.revenue;
  const prevCount = prev.count - stats.count;
  const since30 = new Date(nowMs - 30 * 86400000);
  const paid = ["paid", "preparing", "shipped", "delivered"] as const;

  const [recent, productCount, shopier, merchantsN, top, lowStock, notes, unreadMsgs] = await Promise.all([
    db.select().from(schema.orders).where(inArray(schema.orders.siteId, idList)).orderBy(desc(schema.orders.createdAt)).limit(8),
    ctx.merchant ? db.$count(schema.products, eq(schema.products.catalogKey, merchantCatalogKey(ctx.merchant.id))) : db.$count(schema.products, eq(schema.products.catalogKey, "pool")),
    ctx.merchant ? db.select().from(schema.shopierAccounts).where(eq(schema.shopierAccounts.merchantId, ctx.merchant.id)) : [],
    ctx.isPlatform ? db.select({ m: schema.merchants }).from(schema.merchants) : [],
    db
      .select({
        title: schema.orderItems.title,
        brand: schema.orderItems.brand,
        image: sql<string | null>`min(${schema.orderItems.image})`,
        qty: sql<number>`sum(${schema.orderItems.quantity})::int`,
        revenue: sql<number>`sum(${schema.orderItems.quantity} * ${schema.orderItems.unitPrice})::int`,
      })
      .from(schema.orderItems)
      .innerJoin(schema.orders, eq(schema.orders.id, schema.orderItems.orderId))
      .where(and(inArray(schema.orders.siteId, idList), inArray(schema.orders.status, [...paid]), gte(schema.orders.createdAt, since30)))
      .groupBy(schema.orderItems.title, schema.orderItems.brand)
      .orderBy(desc(sql`sum(${schema.orderItems.quantity})`))
      .limit(5),
    ctx.merchant
      ? db
          .select({
            id: schema.products.id,
            title: schema.products.title,
            image: sql<string | null>`${schema.products.images}->0->>'url'`,
            stock: sql<number>`coalesce((select sum((v->>'stock')::int) from jsonb_array_elements(${schema.products.variants}) v),0)::int`,
          })
          .from(schema.products)
          .where(and(eq(schema.products.catalogKey, merchantCatalogKey(ctx.merchant.id)), eq(schema.products.active, true)))
          .orderBy(sql`4`)
          .limit(5)
      : [],
    db
      .select()
      .from(schema.notifications)
      .where(ctx.merchant ? eq(schema.notifications.merchantId, ctx.merchant.id) : isNull(schema.notifications.merchantId))
      .orderBy(desc(schema.notifications.createdAt))
      .limit(5),
    db.$count(schema.contactMessages, and(inArray(schema.contactMessages.siteId, idList), eq(schema.contactMessages.read, false))),
  ]);
  const mrr = merchantsN.filter((x) => x.m.status === "active").reduce((a, x) => a + PLANS[x.m.plan].priceMonthly, 0);
  const pct = (a: number, b: number) => (b > 0 ? ((a - b) / b) * 100 : null);

  const steps = [
    { done: sites.length > 0, label: "İlk siteni oluştur", href: "/panel/siteler/yeni" },
    { done: productCount > 0, label: "Katalog havuzundan ürün ekle", href: "/panel/katalog" },
    { done: shopier.length > 0, label: "Shopier hesabını bağla", href: "/panel/shopier" },
    { done: sites.some((s) => s.domains.length > 0), label: "Alan adını bağla", href: sites[0] ? `/panel/siteler/${sites[0].id}?sekme=alan-adlari` : "/panel/siteler" },
    { done: sites.some((s) => s.paymentMode !== "demo"), label: "Ödeme modunu Shopier'e al", href: sites[0] ? `/panel/siteler/${sites[0].id}?sekme=odeme` : "/panel/siteler" },
    { done: sites.some((s) => s.status === "active"), label: "Siteni yayına al", href: "/panel/siteler" },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <>
      <PageHeader
        title={ctx.isPlatform ? "Platform Genel Bakış" : `Hoş geldin, ${ctx.user.name.split(" ")[0]}`}
        description={ctx.isPlatform ? "Tüm satıcıların sitelerini, siparişlerini ve katalog havuzunu buradan yönetebilirsin." : "Sitelerinin ve siparişlerinin son durumu."}
        actions={<ButtonLink href="/panel/siteler/yeni">+ Yeni Site</ButtonLink>}
      />
      {sp.hosgeldin === "1" && (
        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
          <p className="font-semibold">Hesabın hazır, hoş geldin!</p>
          <p className="mt-1">Aşağıdaki kurulum adımlarını izleyerek ilk siteni birkaç dakikada yayına alabilirsin: site oluştur, katalog havuzundan ürün ekle, Shopier hesabını bağla.</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <Kpi label="Ciro (30 gün)" value={formatPrice(stats.revenue)} delta={pct(stats.revenue, prevRevenue)} hint="önceki 30 güne göre" />
        <Kpi label="Sipariş (30 gün)" value={stats.count} delta={pct(stats.count, prevCount)} hint={`ort. sepet ${stats.count ? formatPrice(Math.round(stats.revenue / stats.count)) : "—"}`} />
        <Kpi label="Hazırlanacak" value={stats.pending} hint={unreadMsgs ? `${unreadMsgs} okunmamış mesaj` : "Ödeme alındı / hazırlanıyor"} />
        {ctx.isPlatform ? (
          <Kpi label="Satıcı / MRR" value={`${merchantsN.length} · ${mrr.toLocaleString("tr-TR")} ₺`} hint={`${sites.length} site`} />
        ) : (
          <Kpi label="Site / Ürün" value={`${sites.length} · ${productCount}`} hint={ctx.merchant ? `Limit ${ctx.merchant.siteLimit} site · ${ctx.merchant.productLimit} ürün` : ""} />
        )}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card title="Satışlar" description="Son 30 günün günlük cirosu (ödenmiş siparişler)" className="xl:col-span-2">
          <RevenueChart daily={stats.daily} days={lastDays(30, nowMs)} />
        </Card>
        {!ctx.isPlatform && doneCount < steps.length ? (
          <Card title="Kurulum adımları" description={`${doneCount}/${steps.length} tamamlandı`}>
            <div className="mb-4 h-2 overflow-hidden rounded-full bg-zinc-100">
              <div className="h-full bg-emerald-500" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
            </div>
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
          <Card title="Son bildirimler" actions={<Link href="/panel/bildirimler" className="text-sm font-medium hover:underline">Tümü</Link>}>
            {notes.length === 0 ? (
              <p className="text-sm text-zinc-500">Bildirim yok.</p>
            ) : (
              <ul className="space-y-3">
                {notes.map((n) => (
                  <li key={n.id} className="text-sm">
                    {n.link ? (
                      <Link href={n.link} className={`hover:underline ${n.readAt ? "" : "font-semibold"}`}>
                        {n.title}
                      </Link>
                    ) : (
                      <span className={n.readAt ? "" : "font-semibold"}>{n.title}</span>
                    )}
                    <p className="text-xs text-zinc-400">{formatDateTime(n.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card title="Son siparişler" className="xl:col-span-2" actions={<Link href="/panel/siparisler" className="text-sm font-medium hover:underline">Tümü</Link>}>
          {recent.length === 0 ? (
            <p className="text-sm text-zinc-500">Henüz sipariş yok.</p>
          ) : (
            <ul className="-my-2 divide-y divide-zinc-100">
              {recent.map((o) => (
                <li key={o.id}>
                  <Link href={`/panel/siparisler/${o.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5 text-sm hover:bg-zinc-50">
                    <span className="w-32 font-semibold">{o.orderNo}</span>
                    <span className="min-w-0 flex-1 truncate">
                      {o.firstName} {o.lastName} <span className="text-zinc-400">· {sites.find((s) => s.id === o.siteId)?.name}</span>
                    </span>
                    <Badge tone={STATUS_BADGE[o.status].tone}>{ORDER_STATUS_LABEL[o.status]}</Badge>
                    <span className="w-24 text-right font-semibold tabular-nums">{formatPrice(o.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <div className="space-y-6">
          <Card title="Çok satanlar (30 gün)">
            {top.length === 0 ? (
              <p className="text-sm text-zinc-500">Veri yok.</p>
            ) : (
              <ul className="space-y-3">
                {top.map((t, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {t.image && <img src={t.image} alt="" className="h-full w-full object-cover" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{itemName(t.brand, t.title)}</span>
                      <span className="text-xs text-zinc-500">
                        {t.qty} adet · {formatPrice(t.revenue)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          {lowStock.length > 0 && (
            <Card title="Stoğu azalanlar" actions={<Link href="/panel/urunler?durum=az" className="text-sm font-medium hover:underline">Tümü</Link>}>
              <ul className="space-y-3">
                {lowStock.map((p) => (
                  <li key={p.id}>
                    <Link href={`/panel/urunler/${p.id}`} className="flex items-center gap-3 text-sm hover:underline">
                      <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {p.image && <img src={p.image} alt="" className="h-full w-full object-cover" />}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{p.title}</span>
                      <span className={`font-bold tabular-nums ${p.stock === 0 ? "text-rose-600" : "text-amber-600"}`}>{p.stock}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>

      <Card title={ctx.isPlatform ? "Son siteler" : "Sitelerim"} className="mt-6" actions={<Link href="/panel/siteler" className="text-sm font-medium hover:underline">Tümü</Link>}>
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
                  <span className="h-3 w-3 rounded-full ring-1 ring-black/10" style={{ background: s.settings.colors.primary }} />
                  Tema: {THEMES[s.theme].name}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white">
                    Siteyi Aç <ArrowUpRight size={13} />
                  </a>
                  <a href={`/panel/onizle/${s.slug}`} className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold">
                    <Eye size={13} /> Önizle
                  </a>
                  <Link href={`/panel/siteler/${s.id}`} className="inline-flex items-center rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold">
                    Yönet
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </>
  );
}
