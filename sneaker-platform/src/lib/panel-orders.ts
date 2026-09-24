import "server-only";
import { and, desc, eq, gte, ilike, inArray, lte, or, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";
import type { OrderStatus } from "@/db/schema";

export type OrderQuery = { q: string; status: string; site: string; from: string; to: string; source: string; page: number };

export function parseOrderQuery(sp: Record<string, string | string[] | undefined>): OrderQuery {
  const g = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  return { q: g("q").trim(), status: g("durum"), site: g("site"), from: g("bas"), to: g("bit"), source: g("kaynak"), page: Math.max(1, Number(g("sayfa")) || 1) };
}

export function orderQs(q: OrderQuery, patch: Partial<OrderQuery> = {}) {
  const m = { ...q, ...patch };
  const p = new URLSearchParams();
  if (m.q) p.set("q", m.q);
  if (m.status) p.set("durum", m.status);
  if (m.site) p.set("site", m.site);
  if (m.from) p.set("bas", m.from);
  if (m.to) p.set("bit", m.to);
  if (m.source) p.set("kaynak", m.source);
  if (m.page > 1) p.set("sayfa", String(m.page));
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function orderWhere(siteIds: number[], q: OrderQuery): SQL | undefined {
  const conds: SQL[] = [inArray(schema.orders.siteId, siteIds.length ? siteIds : [-1])];
  if (q.q) {
    const like = `%${q.q}%`;
    conds.push(
      or(
        ilike(schema.orders.orderNo, like),
        ilike(schema.orders.email, like),
        ilike(schema.orders.phone, like),
        ilike(sql`${schema.orders.firstName} || ' ' || ${schema.orders.lastName}`, like),
        ilike(schema.orders.trackingNo, like),
      )!,
    );
  }
  if (q.status === "acik") conds.push(inArray(schema.orders.status, ["paid", "preparing"]));
  else if (q.status) conds.push(eq(schema.orders.status, q.status as OrderStatus));
  if (q.site) conds.push(eq(schema.orders.siteId, Number(q.site)));
  if (q.source === "site" || q.source === "shopier") conds.push(eq(schema.orders.source, q.source));
  if (q.from) conds.push(gte(schema.orders.createdAt, new Date(`${q.from}T00:00:00`)));
  if (q.to) conds.push(lte(schema.orders.createdAt, new Date(`${q.to}T23:59:59`)));
  return and(...conds);
}

export const ORDER_PAGE = 25;

export async function listOrders(siteIds: number[], q: OrderQuery, limit = ORDER_PAGE) {
  const where = orderWhere(siteIds, q);
  const [rows, [agg]] = await Promise.all([
    db
      .select()
      .from(schema.orders)
      .where(where)
      .orderBy(desc(schema.orders.createdAt))
      .limit(limit)
      .offset((q.page - 1) * limit),
    db.select({ n: sql<number>`count(*)::int`, sum: sql<number>`coalesce(sum(case when ${schema.orders.status} not in ('pending_payment','cancelled','refunded') then ${schema.orders.total} else 0 end),0)::bigint` }).from(schema.orders).where(where),
  ]);
  const itemCounts = rows.length
    ? await db
        .select({ orderId: schema.orderItems.orderId, n: sql<number>`sum(${schema.orderItems.quantity})::int`, image: sql<string | null>`min(${schema.orderItems.image})` })
        .from(schema.orderItems)
        .where(inArray(schema.orderItems.orderId, rows.map((r) => r.id)))
        .groupBy(schema.orderItems.orderId)
    : [];
  return { rows: rows.map((r) => ({ ...r, itemCount: itemCounts.find((i) => i.orderId === r.id)?.n ?? 0, image: itemCounts.find((i) => i.orderId === r.id)?.image ?? null })), total: agg?.n ?? 0, revenue: Number(agg?.sum ?? 0), pages: Math.max(1, Math.ceil((agg?.n ?? 0) / limit)) };
}
