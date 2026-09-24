import { and, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { invalidate } from "@/lib/cache";

export const POOL_KEY = "pool";
export const merchantCatalogKey = (merchantId: number) => `m:${merchantId}`;

/**
 * Havuzdaki ürünleri satıcı kataloğuna kopyalar (görseller, bedenler, açıklamalar dahil).
 * Aynı ürün daha önce eklenmişse güncellenmez; eklenen/atlanan sayısı döner.
 */
export async function importFromPool(merchantId: number, poolIds: number[] | "all") {
  const key = merchantCatalogKey(merchantId);
  const pool = await db
    .select()
    .from(schema.products)
    .where(poolIds === "all" ? eq(schema.products.catalogKey, POOL_KEY) : and(eq(schema.products.catalogKey, POOL_KEY), inArray(schema.products.id, poolIds)));
  if (!pool.length) return { added: 0, skipped: 0 };
  const existing = await db
    .select({ src: schema.products.sourcePoolId })
    .from(schema.products)
    .where(and(eq(schema.products.catalogKey, key), inArray(schema.products.sourcePoolId, pool.map((p) => p.id))));
  const have = new Set(existing.map((e) => e.src));
  const rows = pool
    .filter((p) => !have.has(p.id))
    .map((p) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, createdAt, updatedAt, ...rest } = p;
      return { ...rest, catalogKey: key, sourcePoolId: id, externalId: `pool-${id}` };
    });
  if (rows.length) {
    for (let i = 0; i < rows.length; i += 200) {
      await db.insert(schema.products).values(rows.slice(i, i + 200)).onConflictDoNothing();
    }
  }
  invalidate(`catalog:${key}`);
  return { added: rows.length, skipped: pool.length - rows.length };
}

export async function merchantProductCount(merchantId: number) {
  const [r] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.products)
    .where(eq(schema.products.catalogKey, merchantCatalogKey(merchantId)));
  return r?.n ?? 0;
}
