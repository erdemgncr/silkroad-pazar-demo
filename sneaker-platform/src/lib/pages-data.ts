import "server-only";
import { and, eq, isNull, or } from "drizzle-orm";
import { db, schema } from "@/db";
import { cached } from "@/lib/cache";

export async function sitePageOverride(siteId: number, slug: string) {
  return cached(`page:${siteId}:${slug}`, 60_000, async () => {
    const row = await db.query.sitePages.findFirst({ where: and(eq(schema.sitePages.siteId, siteId), eq(schema.sitePages.slug, slug)) });
    return row ?? null;
  });
}

export async function activeCoupons(siteId: number) {
  const now = new Date();
  const rows = await db
    .select()
    .from(schema.coupons)
    .where(and(eq(schema.coupons.active, true), or(isNull(schema.coupons.siteId), eq(schema.coupons.siteId, siteId))));
  return rows.filter((c) => (!c.startsAt || c.startsAt <= now) && (!c.endsAt || c.endsAt >= now) && (c.usageLimit == null || c.usedCount < c.usageLimit));
}
