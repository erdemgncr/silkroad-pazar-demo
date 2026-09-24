import "server-only";
import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { PanelContext } from "@/lib/panel";

/** Kullanıcının görebileceği site kimlikleri (platform: hepsi, satıcı: kendi siteleri). */
export async function visibleSites(ctx: PanelContext) {
  const rows = ctx.isPlatform
    ? await db.select().from(schema.sites).orderBy(desc(schema.sites.createdAt))
    : await db.select().from(schema.sites).where(eq(schema.sites.merchantId, ctx.merchant!.id)).orderBy(desc(schema.sites.createdAt));
  const domains = rows.length ? await db.select().from(schema.siteDomains).where(inArray(schema.siteDomains.siteId, rows.map((r) => r.id))) : [];
  return rows.map((s) => ({ ...s, domains: domains.filter((d) => d.siteId === s.id) }));
}

export async function orderStats(siteIds: number[], days = 30) {
  if (!siteIds.length) return { count: 0, revenue: 0, pending: 0, daily: [] as { day: string; revenue: number; count: number }[] };
  const since = new Date(Date.now() - days * 86400000);
  const paidStatuses = ["paid", "preparing", "shipped", "delivered"];
  const [agg] = await db
    .select({ count: sql<number>`count(*)::int`, revenue: sql<number>`coalesce(sum(${schema.orders.total}),0)::int` })
    .from(schema.orders)
    .where(and(inArray(schema.orders.siteId, siteIds), gte(schema.orders.createdAt, since), inArray(schema.orders.status, paidStatuses as never[])));
  const [pending] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.orders)
    .where(and(inArray(schema.orders.siteId, siteIds), inArray(schema.orders.status, ["paid", "preparing"] as never[])));
  const daily = await db
    .select({ day: sql<string>`to_char(date_trunc('day', ${schema.orders.createdAt}), 'YYYY-MM-DD')`, revenue: sql<number>`coalesce(sum(${schema.orders.total}),0)::int`, count: sql<number>`count(*)::int` })
    .from(schema.orders)
    .where(and(inArray(schema.orders.siteId, siteIds), gte(schema.orders.createdAt, since), inArray(schema.orders.status, paidStatuses as never[])))
    .groupBy(sql`1`)
    .orderBy(sql`1`);
  return { count: agg?.count ?? 0, revenue: agg?.revenue ?? 0, pending: pending?.n ?? 0, daily };
}
