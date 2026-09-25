import Link from "next/link";
import { and, desc, eq, gte, inArray, isNull, sql } from "drizzle-orm";
import { ArrowUpRight, Building2, CheckCircle2, Circle, Globe, Library, Package, Palette, Plug, Plus, Receipt, Settings, TrendingDown, TrendingUp } from "lucide-react";
import { db, schema } from "@/db";
import { requirePanel, siteUrl } from "@/lib/panel";
import { orderStats, visibleSites } from "@/lib/panel-data";
import { Badge } from "@/components/panel/ui";
import { formatPrice, itemName } from "@/lib/format";
import { THEMES } from "@/themes/registry";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";
import { merchantCatalogKey, POOL_KEY } from "@/lib/catalog-admin";
import { PLANS } from "@/lib/plans";

export const metadata = { title: "Özet" };

function currentTime() {
  return Date.now();
}

function lastDays(n: number, from: number) {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(new Date(from - i * 86400000).toISOString().slice(0, 10));
  return out;
}

function ago(d: Date, now: number) {
  const m = Math.max(1, Math.round((now - d.getTime()) / 60000));
  if (m < 60) return `${m} dk`;
  if (m < 1440) return `${Math.floor(m / 60)} sa`;
  return `${Math.floor(m / 1440)} g`;
}

function RevenueChart({ daily, days }: { daily: { day: string; revenue: number; count: number }[]; days: string[] }) {
  const data = days.map((d) => ({ day: d, revenue: daily.find((x) => x.day === d)?.revenue ?? 0, count: daily.find((x) => x.day === d)?.count ?? 0 }));
  const max = Math.max(1, ...data.map((d) => d.revenue));
  return (
    <div>
      <div className="flex h-40 items-end gap-[4px]">
        {data.map((d) => (
          <div key={d.day} className="group relative flex h-full flex-1 items-end">
            <div className="w-full rounded-full bg-gradient-to-t from-zinc-900 to-zinc-600 opacity-85 transition-opacity group-hover:opacity-100" style={{ height: `${Math.max(3, (d.revenue / max) * 100)}%` }} />
            <span className="pointer-events-none absolute -top-10 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-zinc-900 px-3 py-1 text-[11px] text-white group-hover:block">
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
    <div className="glass rounded-3xl p-5">
      <p className="text-[13px] text-zinc-500">{label}</p>
      <p className="mt-1 text-[22px] font-semibold tracking-tight tabular-nums md:text-2xl">{value}</p>
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

type ActionCard = { href: string; title: string; desc: string; icon: React.ReactNode };

function Action({ a }: { a: ActionCard }) {
  return (
    <Link href={a.href} className="glass glass-hover flex items-center gap-4 rounded-3xl px-5 py-5">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-black/5 bg-white/80">{a.icon}</span>
      <span className="min-w-0">
        <span className="block font-semibold">{a.title}</span>
        <span className="block truncate text-sm text-zinc-500">{a.desc}</span>
      </span>
    </Link>
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
  const catalogKey = ctx.merchant ? merchantCatalogKey(ctx.merchant.id) : POOL_KEY;
  const stockExpr = sql<number>`coalesce((select sum((v->>'stock')::int) from jsonb_array_elements(${schema.products.variants}) v),0)::int`;

  const [recent, productCount, activeCount, outOfStock, poolCount, shopier, merchantsN, top, lowStock, notes, unreadMsgs, messages] = await Promise.all([
    db.select().from(schema.orders).where(inArray(schema.orders.siteId, idList)).orderBy(desc(schema.orders.createdAt)).limit(6),
    db.$count(schema.products, eq(schema.products.catalogKey, catalogKey)),
    db.$count(schema.products, and(eq(schema.products.catalogKey, catalogKey), eq(schema.products.active, true))),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.products)
      .where(and(eq(schema.products.catalogKey, catalogKey), eq(schema.products.active, true), sql`${stockExpr} = 0`))
      .then((r) => r[0]?.n ?? 0),
    db.$count(schema.products, and(eq(schema.products.catalogKey, POOL_KEY), eq(schema.products.active, true))),
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
          .select({ id: schema.products.id, title: schema.products.title, image: sql<string | null>`${schema.products.images}->0->>'url'`, stock: stockExpr })
          .from(schema.products)
          .where(and(eq(schema.products.catalogKey, catalogKey), eq(schema.products.active, true)))
          .orderBy(sql`4`)
          .limit(4)
      : [],
    db
      .select()
      .from(schema.notifications)
      .where(ctx.merchant ? eq(schema.notifications.merchantId, ctx.merchant.id) : isNull(schema.notifications.merchantId))
      .orderBy(desc(schema.notifications.createdAt))
      .limit(5),
    db.$count(schema.contactMessages, and(inArray(schema.contactMessages.siteId, idList), eq(schema.contactMessages.read, false))),
    db
      .select()
      .from(schema.contactMessages)
      .where(and(inArray(schema.contactMessages.siteId, idList), eq(schema.contactMessages.read, false)))
      .orderBy(desc(schema.contactMessages.createdAt))
      .limit(3),
  ]);
  const mrr = merchantsN.filter((x) => x.m.status === "active").reduce((a, x) => a + PLANS[x.m.plan].priceMonthly, 0);
  const pct = (a: number, b: number) => (b > 0 ? ((a - b) / b) * 100 : null);
  const main = sites[0];
  const mainUrl = main ? siteUrl(main.slug, main.domains) : null;

  const steps = [
    { done: sites.length > 0, label: "İlk siteni oluştur", href: "/panel/siteler/yeni" },
    { done: productCount > 0, label: "Katalogdan ürün ekle", href: "/panel/katalog" },
    { done: shopier.length > 0, label: "Shopier hesabını bağla", href: "/panel/shopier" },
    { done: sites.some((s) => s.domains.length > 0), label: "Alan adını bağla", href: main ? `/panel/siteler/${main.id}?sekme=alan-adlari` : "/panel/siteler" },
    { done: sites.some((s) => s.paymentMode !== "demo"), label: "Ödemeyi Shopier'e al", href: main ? `/panel/siteler/${main.id}?sekme=odeme` : "/panel/siteler" },
    { done: sites.some((s) => s.status === "active"), label: "Siteni yayına al", href: "/panel/siteler" },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  const orb = <span className="orb block h-7 w-7" />;
  const actions: ActionCard[] = ctx.isPlatform
    ? [
        { href: "/panel/ozellestir", title: "Özelleştir", desc: "Yapay zeka ile yönet", icon: orb },
        { href: "/panel/saticilar", title: "Satıcılar", desc: `${merchantsN.length} satıcı · ${mrr.toLocaleString("tr-TR")} ₺ MRR`, icon: <Building2 size={19} strokeWidth={1.6} /> },
        { href: "/panel/siteler", title: "Siteler", desc: `${sites.length} site · ${sites.filter((s) => s.status === "active").length} yayında`, icon: <Globe size={19} strokeWidth={1.6} /> },
        { href: "/panel/siparisler", title: "Siparişler", desc: `${stats.pending} hazırlanacak`, icon: <Receipt size={19} strokeWidth={1.6} /> },
        { href: "/panel/havuz", title: "Katalog havuzu", desc: `${poolCount} hazır ürün`, icon: <Library size={19} strokeWidth={1.6} /> },
        { href: "/panel/platform-ayarlari", title: "Yönetim paneli", desc: "SMTP, yapay zeka, ödemeler", icon: <Settings size={19} strokeWidth={1.6} /> },
      ]
    : [
        { href: "/panel/ozellestir", title: "Özelleştir", desc: `Yapay zeka ile yönet · ${sites.length} site`, icon: orb },
        { href: "/panel/urunler", title: "Ürünlerim", desc: `${activeCount} aktif · ${outOfStock} stoksuz`, icon: <Package size={19} strokeWidth={1.6} /> },
        { href: "/panel/siparisler", title: "Siparişler", desc: `${stats.pending} hazırlanacak`, icon: <Receipt size={19} strokeWidth={1.6} /> },
        { href: "/panel/katalog", title: "Katalogdan ekle", desc: `${poolCount} hazır ürün`, icon: <Library size={19} strokeWidth={1.6} /> },
        { href: "/panel/temalar", title: "Görünüm", desc: main ? `${THEMES[main.theme].name} tema` : "10 mağaza tasarımı", icon: <Palette size={19} strokeWidth={1.6} /> },
        { href: "/panel/shopier", title: "Shopier", desc: shopier.length ? `${shopier.length} hesap bağlı` : "Henüz bağlanmadı", icon: <Plug size={19} strokeWidth={1.6} /> },
      ];

  type Pending = { key: string; href: string; title: string; sub: string; at: Date | null };
  const pendingList: Pending[] = [
    ...recent
      .filter((o) => o.status === "paid" || o.status === "preparing")
      .map((o) => ({ key: `o${o.id}`, href: `/panel/siparisler/${o.id}`, title: `${o.orderNo} · ${o.firstName} ${o.lastName}`, sub: `${ORDER_STATUS_LABEL[o.status]} · ${formatPrice(o.total)}`, at: o.createdAt })),
    ...messages.map((m) => ({ key: `m${m.id}`, href: "/panel/mesajlar", title: `${m.name} · ${m.subject}`, sub: "Yanıt bekliyor", at: m.createdAt })),
    ...lowStock.filter((p) => p.stock <= 2).map((p) => ({ key: `p${p.id}`, href: `/panel/urunler/${p.id}`, title: p.title, sub: p.stock === 0 ? "Stok bitti" : `Son ${p.stock} adet`, at: null })),
  ].slice(0, 7);

  return (
    <div className="lg:-mx-8 lg:-mt-8 lg:grid lg:min-h-[calc(100vh-64px)] lg:grid-cols-[380px_1fr]">
      {/* Sol sütun: mağaza kartı */}
      <aside className="mb-6 lg:mb-0 lg:border-r lg:border-black/5 lg:bg-white/35 lg:px-8 lg:py-10">
        <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.03em]">{ctx.isPlatform ? "Platform" : (ctx.merchant?.name ?? "")}</h1>
        <p className="mt-4 text-[15px] text-zinc-600">{ctx.user.email}</p>
        <p className="text-[15px] text-zinc-600">{ctx.isPlatform ? `${merchantsN.length} satıcı · ${sites.length} site` : main ? `${main.settings.contact.city} · ${ctx.merchant ? PLANS[ctx.merchant.plan].name : ""} paket` : "Henüz site yok"}</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          {mainUrl ? (
            <a href={mainUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-zinc-900 text-[15px] font-semibold text-white shadow-[0_10px_24px_-10px_rgba(0,0,0,0.6)]">
              <ArrowUpRight size={17} /> Siteyi aç
            </a>
          ) : (
            <Link href="/panel/siteler/yeni" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-zinc-900 text-[15px] font-semibold text-white">
              <Plus size={17} /> Site kur
            </Link>
          )}
          <Link href={ctx.isPlatform ? "/panel/saticilar" : "/panel/katalog"} className="inline-flex h-12 items-center justify-center rounded-full border-[1.5px] border-zinc-900 text-[15px] font-semibold hover:bg-white">
            {ctx.isPlatform ? "Satıcı ekle" : "Ürün ekle"}
          </Link>
        </div>

        {sp.hosgeldin === "1" && (
          <div className="glass mt-6 rounded-3xl p-5 text-sm">
            <p className="font-semibold">Mağazan hazır, hoş geldin!</p>
            <p className="mt-1 text-zinc-600">Siten taslak olarak kuruldu. Aşağıdaki adımları tamamlayıp yayına alabilirsin.</p>
          </div>
        )}

        {!ctx.isPlatform && doneCount < steps.length && (
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Kurulum</p>
              <span className="text-xs text-zinc-500">
                {doneCount}/{steps.length}
              </span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/5">
              <div className="h-full rounded-full bg-zinc-900" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
            </div>
            <ul className="mt-2 divide-y divide-black/5">
              {steps.map((s) => (
                <li key={s.label}>
                  <Link href={s.href} className="flex items-center gap-3 py-3 text-[15px]">
                    {s.done ? <CheckCircle2 size={18} className="text-emerald-500" /> : <Circle size={18} className="text-zinc-300" />}
                    <span className={s.done ? "text-zinc-400 line-through" : ""}>{s.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-8">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Son siparişler</p>
            <Link href="/panel/siparisler" className="text-sm text-zinc-500 underline underline-offset-4">
              Tümü
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="py-6 text-sm text-zinc-500">Henüz sipariş yok.</p>
          ) : (
            <ul className="mt-2 divide-y divide-black/5">
              {recent.slice(0, 5).map((o) => (
                <li key={o.id} className="flex items-center gap-3 py-3.5">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px]">
                      {o.firstName} {o.lastName}
                    </span>
                    <span className="block font-mono text-[11px] uppercase text-zinc-400">
                      {o.orderNo} · {formatPrice(o.total)}
                    </span>
                  </span>
                  <Link href={`/panel/siparisler/${o.id}`} className="text-sm text-zinc-500 underline underline-offset-4 hover:text-zinc-900">
                    Aç
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* Sağ: özet */}
      <section className="min-w-0 lg:px-8 lg:py-10">
        <h2 className="text-[32px] font-semibold tracking-[-0.03em]">Özet</h2>
        <p className="mt-1 text-[15px] text-zinc-500">Sık kullandığın işlemler ve bekleyenler.</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {actions.map((a) => (
            <Action key={a.href} a={a} />
          ))}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
          <Kpi label="Ciro · 30 gün" value={formatPrice(stats.revenue)} delta={pct(stats.revenue, prevRevenue)} hint="önceki döneme göre" />
          <Kpi label="Sipariş · 30 gün" value={stats.count} delta={pct(stats.count, prevCount)} hint={`ort. ${stats.count ? formatPrice(Math.round(stats.revenue / stats.count)) : "—"}`} />
          <Kpi label="Hazırlanacak" value={stats.pending} hint={unreadMsgs ? `${unreadMsgs} okunmamış mesaj` : "bekleyen sipariş"} />
          {ctx.isPlatform ? (
            <Kpi label="Satıcı · MRR" value={`${merchantsN.length} · ${mrr.toLocaleString("tr-TR")} ₺`} hint={`${sites.length} site`} />
          ) : (
            <Kpi label="Site · Ürün" value={`${sites.length} · ${productCount}`} hint={ctx.merchant ? `limit ${ctx.merchant.siteLimit} · ${ctx.merchant.productLimit}` : ""} />
          )}
        </div>

        <div className="glass mt-6 overflow-hidden rounded-3xl">
          <div className="flex items-start justify-between gap-4 px-6 py-5">
            <div>
              <p className="text-[17px] font-semibold">Bekleyenler</p>
              <p className="text-sm text-zinc-500">Siparişler, mesajlar ve stok uyarıları</p>
            </div>
            <Link href="/panel/siparisler?durum=paid" className="text-sm text-zinc-500 underline underline-offset-4">
              Tümü
            </Link>
          </div>
          {pendingList.length === 0 ? (
            <p className="border-t border-black/5 px-6 py-8 text-sm text-zinc-500">Bekleyen iş yok. Her şey yolunda.</p>
          ) : (
            <ul className="divide-y divide-black/5 border-t border-black/5">
              {pendingList.map((p) => (
                <li key={p.key}>
                  <Link href={p.href} className="flex items-center gap-4 px-6 py-4 hover:bg-white/50">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{p.title}</span>
                      <span className="block text-sm text-zinc-500">{p.sub}</span>
                    </span>
                    <span className="shrink-0 text-xs text-zinc-400">{p.at ? ago(p.at, nowMs) : "Stok"}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-3">
          <div className="glass rounded-3xl p-6 xl:col-span-2">
            <p className="text-[17px] font-semibold">Satışlar</p>
            <p className="mb-5 text-sm text-zinc-500">Son 30 günün günlük cirosu</p>
            <RevenueChart daily={stats.daily} days={lastDays(30, nowMs)} />
          </div>
          <div className="glass rounded-3xl p-6">
            <p className="text-[17px] font-semibold">Çok satanlar</p>
            <p className="mb-4 text-sm text-zinc-500">Son 30 gün</p>
            {top.length === 0 ? (
              <p className="text-sm text-zinc-500">Veri yok.</p>
            ) : (
              <ul className="space-y-3">
                {top.map((t, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <span className="h-11 w-11 shrink-0 overflow-hidden rounded-2xl bg-white">
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
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-3">
          <div className="glass rounded-3xl p-6 xl:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[17px] font-semibold">{ctx.isPlatform ? "Son siteler" : "Sitelerim"}</p>
              <Link href="/panel/siteler" className="text-sm text-zinc-500 underline underline-offset-4">
                Tümü
              </Link>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {sites.slice(0, 4).map((s) => {
                const url = siteUrl(s.slug, s.domains);
                return (
                  <div key={s.id} className="rounded-2xl border border-white/80 bg-white/55 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{s.name}</p>
                        <p className="truncate text-xs text-zinc-500">{url.replace(/^https?:\/\//, "")}</p>
                      </div>
                      <Badge tone={s.status === "active" ? "green" : s.status === "draft" ? "amber" : "red"}>{s.status === "active" ? "Yayında" : s.status === "draft" ? "Taslak" : "Bakımda"}</Badge>
                    </div>
                    <p className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
                      <span className="h-3 w-3 rounded-full ring-1 ring-black/10" style={{ background: s.settings.colors.primary }} />
                      {THEMES[s.theme].name} tema
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a href={`/panel/onizle/${s.slug}`} className="inline-flex h-8 items-center rounded-full bg-zinc-900 px-4 text-xs font-semibold text-white">
                        Önizle
                      </a>
                      <Link href={`/panel/siteler/${s.id}`} className="inline-flex h-8 items-center rounded-full border border-black/10 bg-white/70 px-4 text-xs font-semibold">
                        Yönet
                      </Link>
                    </div>
                  </div>
                );
              })}
              {sites.length === 0 && (
                <Link href="/panel/siteler/yeni" className="grid place-items-center rounded-2xl border border-dashed border-black/15 p-8 text-sm font-semibold">
                  + İlk siteni kur
                </Link>
              )}
            </div>
          </div>
          <div className="glass rounded-3xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[17px] font-semibold">Bildirimler</p>
              <Link href="/panel/bildirimler" className="text-sm text-zinc-500 underline underline-offset-4">
                Tümü
              </Link>
            </div>
            {notes.length === 0 ? (
              <p className="text-sm text-zinc-500">Bildirim yok.</p>
            ) : (
              <ul className="divide-y divide-black/5">
                {notes.map((n) => (
                  <li key={n.id} className="py-2.5 text-sm">
                    {n.link ? (
                      <Link href={n.link} className={n.readAt ? "" : "font-semibold"}>
                        {n.title}
                      </Link>
                    ) : (
                      <span className={n.readAt ? "" : "font-semibold"}>{n.title}</span>
                    )}
                    <p className="text-xs text-zinc-400">{ago(n.createdAt, nowMs)} önce</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
