import "server-only";
import { and, asc, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";

export type ProductQuery = { q: string; brand: string; category: string; gender: string; status: string; sort: string; page: number };

export function parseProductQuery(sp: Record<string, string | string[] | undefined>): ProductQuery {
  const g = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  return { q: g("q").trim(), brand: g("marka"), category: g("kategori"), gender: g("cinsiyet"), status: g("durum"), sort: g("sirala") || "yeni", page: Math.max(1, Number(g("sayfa")) || 1) };
}

export const PAGE_SIZE = 30;

const stockSql = sql<number>`coalesce((select sum((v->>'stock')::int) from jsonb_array_elements(${schema.products.variants}) v), 0)::int`;

export async function listProducts(catalogKey: string, q: ProductQuery) {
  const conds: SQL[] = [eq(schema.products.catalogKey, catalogKey)];
  if (q.q) {
    const like = `%${q.q}%`;
    conds.push(or(ilike(schema.products.title, like), ilike(schema.products.sku, like), ilike(schema.products.model, like))!);
  }
  if (q.brand) conds.push(eq(schema.products.brand, q.brand));
  if (q.category) conds.push(eq(schema.products.category, q.category));
  if (q.gender) conds.push(eq(schema.products.gender, q.gender as "erkek"));
  if (q.status === "aktif") conds.push(eq(schema.products.active, true));
  if (q.status === "pasif") conds.push(eq(schema.products.active, false));
  if (q.status === "tukenen") conds.push(sql`${stockSql} = 0`);
  if (q.status === "az") conds.push(sql`${stockSql} between 1 and 5`);
  if (q.status === "indirimli") conds.push(sql`${schema.products.compareAtPrice} is not null`);
  const where = and(...conds);
  const order =
    q.sort === "ad" ? asc(schema.products.title) : q.sort === "fiyat-artan" ? asc(schema.products.price) : q.sort === "fiyat-azalan" ? desc(schema.products.price) : q.sort === "stok" ? asc(stockSql) : desc(schema.products.updatedAt);
  const [rows, [{ n }], brands] = await Promise.all([
    db
      .select({
        id: schema.products.id,
        title: schema.products.title,
        brand: schema.products.brand,
        model: schema.products.model,
        colorName: schema.products.colorName,
        category: schema.products.category,
        gender: schema.products.gender,
        price: schema.products.price,
        compareAtPrice: schema.products.compareAtPrice,
        images: schema.products.images,
        sku: schema.products.sku,
        active: schema.products.active,
        isNew: schema.products.isNew,
        isFeatured: schema.products.isFeatured,
        sourcePoolId: schema.products.sourcePoolId,
        variantCount: sql<number>`jsonb_array_length(${schema.products.variants})::int`,
        stock: stockSql,
        updatedAt: schema.products.updatedAt,
      })
      .from(schema.products)
      .where(where)
      .orderBy(order, desc(schema.products.id))
      .limit(PAGE_SIZE)
      .offset((q.page - 1) * PAGE_SIZE),
    db.select({ n: sql<number>`count(*)::int` }).from(schema.products).where(where),
    db.selectDistinct({ b: schema.products.brand }).from(schema.products).where(eq(schema.products.catalogKey, catalogKey)).orderBy(asc(schema.products.brand)),
  ]);
  return { rows, total: n, pages: Math.max(1, Math.ceil(n / PAGE_SIZE)), brands: brands.map((b) => b.b) };
}

export type ProductRow = Awaited<ReturnType<typeof listProducts>>["rows"][number];

export function qs(q: ProductQuery, patch: Partial<ProductQuery> = {}) {
  const m = { ...q, ...patch };
  const p = new URLSearchParams();
  if (m.q) p.set("q", m.q);
  if (m.brand) p.set("marka", m.brand);
  if (m.category) p.set("kategori", m.category);
  if (m.gender) p.set("cinsiyet", m.gender);
  if (m.status) p.set("durum", m.status);
  if (m.sort && m.sort !== "yeni") p.set("sirala", m.sort);
  if (m.page > 1) p.set("sayfa", String(m.page));
  const s = p.toString();
  return s ? `?${s}` : "";
}
