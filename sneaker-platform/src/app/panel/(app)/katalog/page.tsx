import { and, eq, isNotNull } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireMerchant } from "@/lib/panel";
import { POOL_KEY, merchantCatalogKey } from "@/lib/catalog-admin";
import { listProducts, parseProductQuery, qs } from "@/lib/panel-products";
import { CATEGORIES, CATEGORY_BY_KEY, GENDER_LABEL } from "@/lib/taxonomy";
import { formatPrice } from "@/lib/format";
import { FilterBar, Notice, PageHeader, Pager, Stat } from "@/components/panel/ui";
import { PoolPicker } from "./pool-picker";

export const metadata = { title: "Katalog Havuzu" };

const selectCls = "h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm";

export default async function CatalogPage({ searchParams }: PageProps<"/panel/katalog">) {
  const ctx = await requireMerchant();
  const sp = await searchParams;
  const q = parseProductQuery(sp);
  const { rows, total, pages, brands } = await listProducts(POOL_KEY, { ...q, status: q.status || "aktif" });
  const owned = await db
    .select({ src: schema.products.sourcePoolId })
    .from(schema.products)
    .where(and(eq(schema.products.catalogKey, merchantCatalogKey(ctx.merchant.id)), isNotNull(schema.products.sourcePoolId)));
  const ownedSet = new Set(owned.map((o) => o.src));
  const mine = await db.$count(schema.products, eq(schema.products.catalogKey, merchantCatalogKey(ctx.merchant.id)));
  const poolTotal = await db.$count(schema.products, and(eq(schema.products.catalogKey, POOL_KEY), eq(schema.products.active, true)));
  const filtered = Boolean(q.q || q.brand || q.category || q.gender);

  return (
    <>
      <PageHeader title="Katalog Havuzu" description="Görselleri, beden tabloları ve açıklamalarıyla hazır ürünleri tek tıkla kataloğuna ekle. Eklediğin ürünlerin fiyat ve stoklarını kendin yönetirsin; her sitende otomatik olarak farklı SEO metniyle yayınlanır." />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Havuzdaki ürün" value={poolTotal} />
        <Stat label="Kataloğundaki ürün" value={mine} hint={`Limit ${ctx.merchant.productLimit}`} />
        <Stat label="Havuzdan eklenen" value={ownedSet.size} />
        <Stat label="Kalan hak" value={Math.max(0, ctx.merchant.productLimit - mine)} />
      </div>
      <div className="mb-4">
        <Notice tone="blue">İpucu: Ürünleri ekledikten sonra Ürünler sayfasında toplu seçim yapıp <b>AI metin üret</b> ile her sitene özgün açıklama yazdırabilir, fiyatları toplu olarak yüzde ile güncelleyebilirsin.</Notice>
      </div>
      <FilterBar>
        <input name="q" defaultValue={q.q} placeholder="Ürün, model veya SKU ara" className={`${selectCls} min-w-0 sm:flex-1 sm:min-w-[220px]`} />
        <select name="marka" defaultValue={q.brand} className={selectCls}>
          <option value="">Tüm markalar</option>
          {brands.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
        <select name="kategori" defaultValue={q.category} className={selectCls}>
          <option value="">Tüm kategoriler</option>
          {CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
        <select name="cinsiyet" defaultValue={q.gender} className={selectCls}>
          <option value="">Tüm cinsiyetler</option>
          {Object.entries(GENDER_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </FilterBar>
      <p className="mb-3 text-sm text-zinc-500">{total} ürün</p>
      <PoolPicker
        totalMatching={total}
        filtered={filtered}
        items={rows.map((r) => ({
          id: r.id,
          title: r.title,
          brand: r.brand,
          price: formatPrice(r.price),
          image: r.images[0]?.url ?? null,
          sizes: r.variantCount,
          owned: ownedSet.has(r.id),
          category: CATEGORY_BY_KEY[r.category]?.label ?? r.category,
        }))}
      />
      <Pager page={q.page} pages={pages} href={(p) => `/panel/katalog${qs(q, { page: p })}`} />
    </>
  );
}
