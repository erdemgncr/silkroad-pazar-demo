import Link from "next/link";
import { and, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePanel } from "@/lib/panel";
import { visibleSites } from "@/lib/panel-data";
import { formatDate, formatPrice } from "@/lib/format";
import { Badge, Empty, FilterBar, PageHeader, Pager, Stat } from "@/components/panel/ui";

export const metadata = { title: "Müşteriler" };

const selectCls = "h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm";
const PAGE = 30;

export default async function CustomersPage({ searchParams }: PageProps<"/panel/musteriler">) {
  const ctx = await requirePanel();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const siteF = typeof sp.site === "string" ? Number(sp.site) : 0;
  const page = Math.max(1, Number(sp.sayfa) || 1);
  const sites = await visibleSites(ctx);
  const ids = sites.length ? sites.map((s) => s.id) : [-1];
  const conds: SQL[] = [inArray(schema.customers.siteId, siteF ? [siteF] : ids)];
  if (q) conds.push(or(ilike(schema.customers.email, `%${q}%`), ilike(sql`${schema.customers.firstName} || ' ' || ${schema.customers.lastName}`, `%${q}%`), ilike(schema.customers.phone, `%${q}%`))!);
  const where = and(...conds);
  const paid = sql`${schema.orders.status} in ('paid','preparing','shipped','delivered')`;
  const [rows, [{ n }], [agg]] = await Promise.all([
    db
      .select({
        c: schema.customers,
        orders: sql<number>`(select count(*) from orders o where o.customer_id = "customers"."id" and o.status in ('paid','preparing','shipped','delivered'))::int`,
        spent: sql<number>`(select coalesce(sum(o.total),0) from orders o where o.customer_id = "customers"."id" and o.status in ('paid','preparing','shipped','delivered'))::int`,
      })
      .from(schema.customers)
      .where(where)
      .orderBy(desc(schema.customers.createdAt))
      .limit(PAGE)
      .offset((page - 1) * PAGE),
    db.select({ n: sql<number>`count(*)::int` }).from(schema.customers).where(where),
    db
      .select({ buyers: sql<number>`count(distinct ${schema.orders.email})::int`, guests: sql<number>`count(distinct case when ${schema.orders.customerId} is null then ${schema.orders.email} end)::int` })
      .from(schema.orders)
      .where(and(inArray(schema.orders.siteId, ids), paid)),
  ]);
  const consent = await db.$count(schema.customers, and(inArray(schema.customers.siteId, ids), eq(schema.customers.marketingConsent, true)));
  const siteName = (id: number) => sites.find((s) => s.id === id)?.name ?? "";
  const href = (p: number) => `/panel/musteriler?${new URLSearchParams({ ...(q ? { q } : {}), ...(siteF ? { site: String(siteF) } : {}), ...(p > 1 ? { sayfa: String(p) } : {}) })}`;

  return (
    <>
      {sp.silindi === "1" && <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">Müşteri hesabı silindi; siparişleri yasal süre boyunca saklanmaya devam eder.</p>}
      <PageHeader title="Müşteriler" description="Sitelerine üye olan müşteriler. Her site kendi müşteri hesaplarını tutar (aynı e-posta farklı sitelerde ayrı hesaptır)." />
      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Üye müşteri" value={n} />
        <Stat label="Alışveriş yapan" value={agg?.buyers ?? 0} hint="Üye + misafir" />
        <Stat label="Misafir alıcı" value={agg?.guests ?? 0} />
        <Stat label="İleti izni veren" value={consent} hint="Kampanya e-postası gönderilebilir" />
      </div>
      <FilterBar>
        <input name="q" defaultValue={q} placeholder="Ad, e-posta veya telefon" className={`${selectCls} min-w-0 sm:flex-1 sm:min-w-[240px]`} />
        <select name="site" defaultValue={siteF || ""} className={selectCls}>
          <option value="">Tüm siteler</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </FilterBar>
      {rows.length === 0 ? (
        <Empty title="Müşteri bulunamadı" />
      ) : (
        <div className="overflow-hidden glass rounded-3xl">
          <table className="w-full text-sm">
            <thead className="hidden bg-white/40 text-left text-xs text-zinc-500 md:table-header-group">
              <tr>
                <th className="px-4 py-3 font-medium">Müşteri</th>
                <th className="px-4 py-3 font-medium">Site</th>
                <th className="px-4 py-3 font-medium">Sipariş</th>
                <th className="px-4 py-3 font-medium">Harcama</th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">Üyelik</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {rows.map(({ c, orders, spent }) => (
                <tr key={c.id} className="hover:bg-white/60">
                  <td className="px-4 py-3">
                    <Link href={`/panel/musteriler/${c.id}`} className="flex items-center gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-zinc-900 text-sm font-bold text-white">
                        {c.firstName.slice(0, 1)}
                        {c.lastName.slice(0, 1)}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-semibold hover:underline">
                          {c.firstName} {c.lastName}
                        </span>
                        <span className="block truncate text-xs text-zinc-500">{c.email}</span>
                        <span className="block text-xs text-zinc-500 md:hidden">
                          {orders} sipariş · {formatPrice(spent)}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <Badge>{siteName(c.siteId)}</Badge>
                  </td>
                  <td className="hidden px-4 py-3 tabular-nums md:table-cell">{orders}</td>
                  <td className="hidden px-4 py-3 font-semibold tabular-nums md:table-cell">{formatPrice(spent)}</td>
                  <td className="hidden px-4 py-3 text-zinc-500 lg:table-cell">
                    {formatDate(c.createdAt)} {c.marketingConsent && <Badge tone="green">İzinli</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pager page={page} pages={Math.max(1, Math.ceil(n / PAGE))} href={href} />
    </>
  );
}
