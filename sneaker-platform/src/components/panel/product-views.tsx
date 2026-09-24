import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { ArrowUpRight, BellRing, Copy, RefreshCw, RotateCcw, Sparkles, Trash2 } from "lucide-react";
import { db, schema } from "@/db";
import { requireMerchant, requirePlatform, siteUrl } from "@/lib/panel";
import { POOL_KEY, merchantCatalogKey } from "@/lib/catalog-admin";
import { listProducts, parseProductQuery, qs } from "@/lib/panel-products";
import { BRANDS, CATEGORIES, CATEGORY_BY_KEY, GENDER_LABEL } from "@/lib/taxonomy";
import { formatDateTime, formatPrice } from "@/lib/format";
import { productCopy } from "@/lib/seo/copy";
import { aiConfig } from "@/lib/ai/gemini";
import { Badge, ButtonLink, Card, Empty, FilterBar, Notice, PageHeader, Pager } from "./ui";
import { ActionButton, ActionForm, Field, TextArea, Toggle } from "./forms";
import { ProductTable } from "./product-table";
import { ProductForm, type ProductFormValues } from "./product-form";
import {
  aiBaseDescription,
  aiForSite,
  clearProductOverride,
  deleteProduct,
  duplicateProduct,
  notifyRestock,
  pushToShopier,
  resyncFromPool,
  saveProduct,
  saveProductOverride,
  type Scope,
} from "@/lib/actions/panel-products";

type SP = Record<string, string | string[] | undefined>;

const selectCls = "h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm";

async function ctxFor(scope: Scope) {
  if (scope === "pool") {
    await requirePlatform();
    return { catalogKey: POOL_KEY, merchant: null, base: "/panel/havuz" };
  }
  const ctx = await requireMerchant();
  return { catalogKey: merchantCatalogKey(ctx.merchant.id), merchant: ctx.merchant, base: "/panel/urunler" };
}

export async function ProductListView({ scope, searchParams }: { scope: Scope; searchParams: SP }) {
  const { catalogKey, merchant, base } = await ctxFor(scope);
  const q = parseProductQuery(searchParams);
  const { rows, total, pages, brands } = await listProducts(catalogKey, q);
  const ids = rows.map((r) => r.id);
  const [sites, accounts, links, ai] = merchant
    ? await Promise.all([
        db.select({ id: schema.sites.id, name: schema.sites.name }).from(schema.sites).where(eq(schema.sites.merchantId, merchant.id)),
        db.select({ id: schema.shopierAccounts.id, name: schema.shopierAccounts.name }).from(schema.shopierAccounts).where(eq(schema.shopierAccounts.merchantId, merchant.id)),
        ids.length ? db.select().from(schema.productShopierLinks).where(inArray(schema.productShopierLinks.productId, ids)) : [],
        ids.length
          ? db
              .select({ pid: schema.productSiteOverrides.productId, n: sql<number>`count(*)::int` })
              .from(schema.productSiteOverrides)
              .where(and(inArray(schema.productSiteOverrides.productId, ids), isNotNull(schema.productSiteOverrides.aiGeneratedAt)))
              .groupBy(schema.productSiteOverrides.productId)
          : [],
      ])
    : [[], [], [], []];
  const totalAll = await db.$count(schema.products, eq(schema.products.catalogKey, catalogKey));

  return (
    <>
      <PageHeader
        title={scope === "pool" ? "Katalog Havuzu" : "Ürünler"}
        description={
          scope === "pool"
            ? `Satıcıların tek tıkla kendi kataloglarına ekleyebildiği merkezi ürün havuzu (${totalAll} ürün). Görseller, bedenler ve açıklamalar dahil kopyalanır.`
            : `${totalAll} / ${merchant!.productLimit} ürün. Ürünler tüm sitelerinde ortak kullanılır; her site kendi SEO metnini ve fiyat ayarını uygular.`
        }
        actions={
          <>
            {scope === "merchant" && (
              <ButtonLink href="/panel/katalog" variant="secondary">
                Havuzdan ekle
              </ButtonLink>
            )}
            <ButtonLink href={`${base}/yeni`}>+ Yeni ürün</ButtonLink>
          </>
        }
      />
      <FilterBar>
        <input name="q" defaultValue={q.q} placeholder="Ürün adı, model veya SKU" className={`${selectCls} min-w-0 sm:flex-1 sm:min-w-[220px]`} />
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
        <select name="durum" defaultValue={q.status} className={selectCls}>
          <option value="">Tüm durumlar</option>
          <option value="aktif">Satışta</option>
          <option value="pasif">Pasif</option>
          <option value="az">Az stoklu (1-5)</option>
          <option value="tukenen">Tükenen</option>
          <option value="indirimli">İndirimli</option>
        </select>
        <select name="sirala" defaultValue={q.sort} className={selectCls}>
          <option value="yeni">Son güncellenen</option>
          <option value="ad">Ada göre</option>
          <option value="fiyat-artan">Fiyat artan</option>
          <option value="fiyat-azalan">Fiyat azalan</option>
          <option value="stok">Stok (azdan çoğa)</option>
        </select>
      </FilterBar>
      <p className="mb-3 text-sm text-zinc-500">{total} ürün bulundu</p>
      {rows.length === 0 ? (
        <Empty
          title={totalAll ? "Filtreye uygun ürün yok" : "Henüz ürün yok"}
          description={scope === "merchant" && !totalAll ? "Katalog havuzundan hazır ürünleri görselleri ve açıklamalarıyla tek tıkla ekleyebilir ya da kendi ürününü oluşturabilirsin." : undefined}
          action={scope === "merchant" && !totalAll ? <ButtonLink href="/panel/katalog">Katalog havuzuna git</ButtonLink> : undefined}
        />
      ) : (
        <ProductTable
          scope={scope}
          base={base}
          sites={sites}
          accounts={accounts}
          rows={rows.map((r) => ({
            id: r.id,
            title: r.title,
            brand: r.brand,
            colorName: r.colorName,
            categoryLabel: CATEGORY_BY_KEY[r.category]?.label ?? r.category,
            price: formatPrice(r.price),
            compareAtPrice: r.compareAtPrice ? formatPrice(r.compareAtPrice) : null,
            image: r.images[0]?.url ?? null,
            sku: r.sku,
            active: r.active,
            isNew: r.isNew,
            isFeatured: r.isFeatured,
            fromPool: Boolean(r.sourcePoolId),
            stock: r.stock,
            variantCount: r.variantCount,
            shopier: links.filter((l) => l.productId === r.id).some((l) => l.status === "error") ? "error" : links.some((l) => l.productId === r.id && l.status === "synced") ? "synced" : null,
            aiSites: ai.find((a) => a.pid === r.id)?.n ?? 0,
          }))}
        />
      )}
      <Pager page={q.page} pages={pages} href={(p) => `${base}${qs(q, { page: p })}`} />
    </>
  );
}

/* ------------------------------------------------------------------ */

const emptyValues: ProductFormValues = {
  title: "",
  slug: "",
  brand: "",
  model: "",
  colorName: "",
  colorHex: "#111111",
  gender: "erkek",
  category: "sneaker",
  price: "",
  compareAtPrice: "",
  sku: "",
  material: "",
  description: "",
  tags: "",
  images: [],
  variants: [],
  isNew: true,
  isBestSeller: false,
  isFeatured: false,
  active: true,
  releaseDate: "",
};

const tlStr = (k: number | null) => (k ? String(k / 100).replace(".", ",") : "");

export async function ProductEditView({ scope, id, searchParams }: { scope: Scope; id: number | null; searchParams: SP }) {
  const { catalogKey, merchant, base } = await ctxFor(scope);
  const product = id ? await db.query.products.findFirst({ where: and(eq(schema.products.id, id), eq(schema.products.catalogKey, catalogKey)) }) : null;
  if (id && !product) notFound();
  const categories = CATEGORIES.map((c) => ({ value: c.key, label: `${c.label} (${c.type === "ayakkabi" ? "Ayakkabı" : c.type === "giyim" ? "Giyim" : "Aksesuar"})` }));
  const brands = [...new Set([...BRANDS.map((b) => b.name)])];
  const initial: ProductFormValues = product
    ? {
        title: product.title,
        slug: product.slug,
        brand: product.brand,
        model: product.model,
        colorName: product.colorName,
        colorHex: product.colorHex,
        gender: product.gender,
        category: product.category,
        price: tlStr(product.price),
        compareAtPrice: tlStr(product.compareAtPrice),
        sku: product.sku,
        material: product.material ?? "",
        description: product.description,
        tags: product.tags.join(", "),
        images: product.images,
        variants: product.variants,
        isNew: product.isNew,
        isBestSeller: product.isBestSeller,
        isFeatured: product.isFeatured,
        active: product.active,
        releaseDate: product.releaseDate ? product.releaseDate.toISOString().slice(0, 16) : "",
      }
    : emptyValues;

  return (
    <>
      <div className="mb-2 text-sm text-zinc-500">
        <Link href={base} className="hover:underline">
          {scope === "pool" ? "Katalog Havuzu" : "Ürünler"}
        </Link>{" "}
        / {product ? product.title : "Yeni ürün"}
      </div>
      <PageHeader
        title={product ? product.title : "Yeni ürün"}
        description={product ? `${product.brand} · ${product.sku} · son güncelleme ${formatDateTime(product.updatedAt)}` : scope === "pool" ? "Havuza eklenen ürünü tüm satıcılar kendi kataloğuna aktarabilir." : "Ürün tüm sitelerinde yayınlanır."}
        actions={
          product ? (
            <>
              <ActionButton action={duplicateProduct.bind(null, scope, product.id)}>
                <Copy size={15} /> Kopyala
              </ActionButton>
              <ActionButton action={deleteProduct.bind(null, scope, product.id)} variant="danger" confirm="Ürün kalıcı olarak silinsin mi? Geçmiş siparişler etkilenmez.">
                <Trash2 size={15} /> Sil
              </ActionButton>
            </>
          ) : null
        }
      />
      {searchParams.yeni === "1" && (
        <div className="mb-5">
          <Notice tone="green">Ürün oluşturuldu.{scope === "merchant" ? " Sağdaki bölümden site bazında SEO metni üretebilir veya Shopier'e gönderebilirsin." : ""}</Notice>
        </div>
      )}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Card>
          <ProductForm
            key={product?.updatedAt.toISOString() ?? "new"}
            action={saveProduct.bind(null, scope, product?.id ?? null)}
            initial={initial}
            brands={brands}
            categories={categories}
            aiAction={product ? aiBaseDescription.bind(null, scope, product.id) : undefined}
            submitLabel={product ? "Kaydet" : "Ürünü oluştur"}
          />
        </Card>
        {product && merchant && <ProductSidebar productId={product.id} merchantId={merchant.id} />}
        {product && !merchant && <PoolSidebar productId={product.id} />}
      </div>
    </>
  );
}

async function PoolSidebar({ productId }: { productId: number }) {
  const copies = await db.select({ key: schema.products.catalogKey }).from(schema.products).where(eq(schema.products.sourcePoolId, productId));
  return (
    <div className="space-y-6">
      <Card title="Kullanım">
        <p className="text-sm text-zinc-600">
          Bu ürün <b>{copies.length}</b> satıcının kataloğunda kullanılıyor. Havuzda yaptığın görsel ve açıklama değişiklikleri, satıcılar &quot;Havuzdan güncelle&quot; dediğinde kendi kopyalarına uygulanır (fiyat ve stok satıcıya aittir).
        </p>
      </Card>
    </div>
  );
}

async function ProductSidebar({ productId, merchantId }: { productId: number; merchantId: number }) {
  const [product, sites, overrides, accounts, links, alerts, merchant] = await Promise.all([
    db.query.products.findFirst({ where: eq(schema.products.id, productId) }),
    db.select().from(schema.sites).where(eq(schema.sites.merchantId, merchantId)),
    db.select().from(schema.productSiteOverrides).where(eq(schema.productSiteOverrides.productId, productId)),
    db.select().from(schema.shopierAccounts).where(eq(schema.shopierAccounts.merchantId, merchantId)),
    db.select().from(schema.productShopierLinks).where(eq(schema.productShopierLinks.productId, productId)),
    db
      .select({ size: schema.stockAlerts.size, n: sql<number>`count(*)::int` })
      .from(schema.stockAlerts)
      .where(eq(schema.stockAlerts.productId, productId))
      .groupBy(schema.stockAlerts.size),
    db.query.merchants.findFirst({ where: eq(schema.merchants.id, merchantId) }),
  ]);
  if (!product) return null;
  const domains = sites.length ? await db.select().from(schema.siteDomains).where(inArray(schema.siteDomains.siteId, sites.map((s) => s.id))) : [];
  const ai = await aiConfig(merchant ?? null);
  const used = merchant && merchant.aiUsagePeriod === new Date().toISOString().slice(0, 7) ? merchant.aiUsedThisMonth : 0;
  const alertTotal = alerts.reduce((a, x) => a + x.n, 0);

  return (
    <div className="space-y-6">
      <Card title="Sitelerde" description="Her site bu ürünü kendi başlık ve açıklamasıyla yayınlar. Boş alanlarda siteye özel otomatik metin kullanılır.">
        <div className="mb-4 flex items-center justify-between gap-2 rounded-lg bg-violet-50 px-3 py-2 text-xs text-violet-900">
          <span className="flex items-center gap-1.5">
            <Sparkles size={14} /> Gemini {ai.key ? "hazır" : "anahtarı yok"}
          </span>
          {merchant && (
            <span>
              Bu ay {used}/{merchant.geminiApiKey ? "∞" : merchant.aiMonthlyLimit}
            </span>
          )}
        </div>
        {sites.length === 0 && <p className="text-sm text-zinc-500">Henüz site yok.</p>}
        <div className="space-y-3">
          {sites.map((site) => {
              const o = overrides.find((x) => x.siteId === site.id);
              const url = `${siteUrl(site.slug, domains.filter((d) => d.siteId === site.id))}/urun/${product.slug}`;
              const auto = productCopy(site, product, null);
              return (
                <details key={site.id} className="group rounded-lg border border-zinc-200">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{site.name}</span>
                      <span className="flex flex-wrap gap-1 pt-0.5">
                        {o?.hidden ? <Badge tone="red">Gizli</Badge> : <Badge tone="green">Yayında</Badge>}
                        {o?.aiGeneratedAt ? <Badge tone="violet">AI metni</Badge> : o && (o.title || o.description) ? <Badge tone="blue">Özel metin</Badge> : <Badge>Otomatik</Badge>}
                      </span>
                    </span>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-zinc-200 hover:bg-zinc-50" title="Sitede gör">
                      <ArrowUpRight size={14} />
                    </a>
                  </summary>
                  <div className="space-y-3 border-t border-zinc-100 p-3">
                    <div className="flex flex-wrap gap-2">
                      <ActionButton action={aiForSite.bind(null, product.id, site.id)} variant="primary">
                        <Sparkles size={14} /> AI ile yaz
                      </ActionButton>
                      {o && (
                        <ActionButton action={clearProductOverride.bind(null, product.id, site.id)} confirm="Bu sitedeki özel metin silinsin mi?">
                          <RotateCcw size={14} /> Otomatiğe dön
                        </ActionButton>
                      )}
                    </div>
                    <ActionForm action={saveProductOverride.bind(null, product.id, site.id)} key={o?.updatedAt.toISOString() ?? "none"}>
                      <Toggle label="Bu sitede gizle" name="hidden" defaultChecked={o?.hidden ?? false} />
                      <Field label="Ürün başlığı (H1)" name="title" defaultValue={o?.title ?? ""} placeholder={auto.h1} />
                      <Field label="Meta başlık" name="metaTitle" defaultValue={o?.metaTitle ?? ""} placeholder={auto.metaTitle} maxLength={70} />
                      <TextArea label="Meta açıklama" name="metaDescription" rows={3} defaultValue={o?.metaDescription ?? ""} placeholder={auto.metaDescription} maxLength={170} />
                      <TextArea label="Açıklama" name="description" rows={6} defaultValue={o?.description ?? ""} placeholder={auto.paragraphs.join("\n\n")} />
                    </ActionForm>
                  </div>
                </details>
              );
            })}
        </div>
      </Card>

      <Card title="Shopier">
        {accounts.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Shopier hesabı bağlı değil.{" "}
            <Link href="/panel/shopier" className="font-semibold underline">
              Bağla
            </Link>
          </p>
        ) : (
          <ul className="space-y-3">
            {accounts.map((a) => {
              const l = links.find((x) => x.shopierAccountId === a.id);
              return (
                <li key={a.id} className="space-y-2 rounded-lg border border-zinc-200 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold">{a.name}</span>
                    {l?.status === "synced" ? <Badge tone="green">Senkron</Badge> : l?.status === "error" ? <Badge tone="red">Hata</Badge> : <Badge>Gönderilmedi</Badge>}
                  </div>
                  {l?.lastError && <p className="text-xs text-rose-600">{l.lastError}</p>}
                  {l?.shopierUrl && (
                    <a href={l.shopierUrl} target="_blank" rel="noopener noreferrer" className="block truncate text-xs text-zinc-500 underline">
                      {l.shopierUrl}
                    </a>
                  )}
                  <ActionButton action={pushToShopier.bind(null, a.id, [product.id])}>
                    <RefreshCw size={14} /> {l ? "Shopier'de güncelle" : "Shopier'e gönder"}
                  </ActionButton>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card title="Gelince haber ver" description="Tükenen bedenler için e-posta bırakan müşteriler. Bedene stok girip kaydettiğinde otomatik e-posta gider.">
        {alertTotal === 0 ? (
          <p className="text-sm text-zinc-500">Bekleyen talep yok.</p>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {alerts.map((a) => (
                <span key={a.size ?? "all"} className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
                  {a.size ?? "Tüm bedenler"}: {a.n}
                </span>
              ))}
            </div>
            <ActionButton action={notifyRestock.bind(null, product.id)}>
              <BellRing size={14} /> Stoktakiler için şimdi gönder
            </ActionButton>
          </div>
        )}
      </Card>

      {product.sourcePoolId && (
        <Card title="Katalog havuzu">
          <p className="mb-3 text-sm text-zinc-600">Bu ürün merkezi katalog havuzundan eklendi.</p>
          <ActionButton action={resyncFromPool.bind(null, product.id)} confirm="Görseller ve açıklama havuzdaki haliyle değiştirilsin mi?">
            <RefreshCw size={14} /> Havuzdan güncelle
          </ActionButton>
        </Card>
      )}
    </div>
  );
}

