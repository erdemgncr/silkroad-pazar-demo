import Link from "next/link";
import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { Search, X } from "lucide-react";
import { db, schema } from "@/db";
import { requireMerchant } from "@/lib/panel";
import { POOL_KEY, merchantCatalogKey } from "@/lib/catalog-admin";
import { listProducts, parseProductQuery, qs, type ProductQuery } from "@/lib/panel-products";
import { CATEGORIES, CATEGORY_BY_KEY, GENDER_LABEL } from "@/lib/taxonomy";
import { formatPrice } from "@/lib/format";
import { smartQuery } from "@/lib/ai/commands";
import { Pager } from "@/components/panel/ui";
import { PoolPicker } from "./pool-picker";

export const metadata = { title: "Katalog" };

const EXAMPLES = ["Kadın Nike koşu ayakkabıları", "adidas Samba", "Çocuk sneaker", "New Balance 530", "Erkek eşofman"];

function chip(active: boolean) {
  return `inline-flex h-9 shrink-0 items-center gap-1 rounded-full border px-4 text-sm font-medium transition ${active ? "border-zinc-900 bg-zinc-900 text-white" : "border-black/10 bg-white/60 hover:bg-white"}`;
}

export default async function CatalogPage({ searchParams }: PageProps<"/panel/katalog">) {
  const ctx = await requireMerchant();
  const sp = await searchParams;
  const base = parseProductQuery(sp);
  const ask = typeof sp.ara === "string" ? sp.ara.trim().slice(0, 120) : "";
  let q: ProductQuery = base;
  if (ask) {
    const s = smartQuery(ask);
    q = { ...base, q: s.rest, brand: s.brand ?? "", category: s.category ?? "", gender: s.gender ?? "", page: 1 };
  }
  const { rows, total, pages } = await listProducts(POOL_KEY, { ...q, status: "aktif" });
  const mineKey = merchantCatalogKey(ctx.merchant.id);
  const [owned, mine, brandRows, poolTotal] = await Promise.all([
    db.select({ src: schema.products.sourcePoolId }).from(schema.products).where(and(eq(schema.products.catalogKey, mineKey), isNotNull(schema.products.sourcePoolId))),
    db.$count(schema.products, eq(schema.products.catalogKey, mineKey)),
    db
      .select({ brand: schema.products.brand })
      .from(schema.products)
      .where(and(eq(schema.products.catalogKey, POOL_KEY), eq(schema.products.active, true)))
      .groupBy(schema.products.brand)
      .orderBy(desc(sql`count(*)`))
      .limit(14),
    db.$count(schema.products, and(eq(schema.products.catalogKey, POOL_KEY), eq(schema.products.active, true))),
  ]);
  const ownedSet = new Set(owned.map((o) => o.src));
  const room = Math.max(0, ctx.merchant.productLimit - mine);
  const filtered = Boolean(q.q || q.brand || q.category || q.gender);
  const href = (patch: Partial<ProductQuery>) => `/panel/katalog${qs({ ...q, status: "" }, { ...patch, page: 1 })}`;
  const summary = [q.brand, q.category && CATEGORY_BY_KEY[q.category]?.label, q.gender && GENDER_LABEL[q.gender as keyof typeof GENDER_LABEL], q.q && `“${q.q}”`].filter(Boolean).join(" · ");

  return (
    <div className="mx-auto max-w-[1280px]">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-[32px] font-semibold tracking-[-0.03em]">Katalog</h1>
          <p className="mt-1 text-[15px] text-zinc-500">Hazır ürünleri seç, tek dokunuşla mağazana ekle. Görseller, bedenler ve açıklamalar hazır gelir.</p>
        </div>
        <p className="text-sm text-zinc-500">
          Kataloğunda <b className="text-zinc-900">{mine}</b> ürün · kalan hak <b className="text-zinc-900">{room}</b> · havuzda {poolTotal.toLocaleString("tr-TR")}
        </p>
      </div>

      {/* Doğal dille arama */}
      <form action="/panel/katalog" className="glass-strong mt-6 flex items-center gap-3 rounded-full py-2 pl-3 pr-2">
        <span className="orb h-9 w-9 shrink-0" />
        <input name="ara" defaultValue={ask || [q.brand, q.q].filter(Boolean).join(" ")} placeholder="Ne eklemek istersin? Örn. Kadın Nike koşu ayakkabıları" aria-label="Katalogda ara" className="h-11 min-w-0 flex-1 text-[16px] outline-none placeholder:text-zinc-400" style={{ backgroundColor: "transparent" }} />
        <button type="submit" aria-label="Ara" className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-zinc-900 text-white">
          <Search size={19} />
        </button>
      </form>
      {!filtered && (
        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLES.map((e) => (
            <Link key={e} href={`/panel/katalog?ara=${encodeURIComponent(e)}`} className="rounded-full border border-black/10 bg-white/50 px-3.5 py-1.5 text-[13px] text-zinc-700 hover:bg-white">
              {e}
            </Link>
          ))}
        </div>
      )}

      {/* Hızlı filtreler */}
      <div className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1">
        <Link href={href({ brand: "" })} className={chip(!q.brand)}>
          Tüm markalar
        </Link>
        {brandRows.map((b) => (
          <Link key={b.brand} href={href({ brand: q.brand === b.brand ? "" : b.brand })} className={chip(q.brand === b.brand)}>
            {b.brand}
          </Link>
        ))}
      </div>
      <div className="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1">
        {(["erkek", "kadin", "cocuk"] as const).map((g) => (
          <Link key={g} href={href({ gender: q.gender === g ? "" : g })} className={chip(q.gender === g)}>
            {GENDER_LABEL[g]}
          </Link>
        ))}
        <span className="mx-1 w-px shrink-0 bg-black/10" />
        {CATEGORIES.map((c) => (
          <Link key={c.key} href={href({ category: q.category === c.key ? "" : c.key })} className={chip(q.category === c.key)}>
            {c.label}
          </Link>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-600">
          <b className="text-zinc-900">{total}</b> ürün{summary && <> · {summary}</>}
        </p>
        {filtered && (
          <Link href="/panel/katalog" className="inline-flex items-center gap-1 text-sm text-zinc-500 underline underline-offset-4">
            <X size={14} /> Filtreleri temizle
          </Link>
        )}
      </div>

      <PoolPicker
        totalMatching={total}
        filtered={filtered}
        room={room}
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
      <Pager page={q.page} pages={pages} href={(p) => `/panel/katalog${qs({ ...q, status: "" }, { page: p })}`} />
    </div>
  );
}
