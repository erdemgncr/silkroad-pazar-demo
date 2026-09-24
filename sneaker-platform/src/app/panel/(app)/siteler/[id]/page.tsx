import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq, inArray } from "drizzle-orm";
import { ArrowUpRight, Copy, ExternalLink, Eye, FileText, Globe, Pencil, RotateCcw, Star, Trash2 } from "lucide-react";
import { db, schema } from "@/db";
import { requirePanel, siteUrl } from "@/lib/panel";
import { THEMES, THEME_KEYS } from "@/themes/registry";
import { ThemeThumb } from "@/components/panel/theme-thumb";
import { Badge, ButtonLink, Card, KeyValue, Notice, PageHeader, TabNav } from "@/components/panel/ui";
import { ActionButton, ActionForm, ColorField, Field, ImageField, Repeater, Select, TextArea, Toggle } from "@/components/panel/forms";
import {
  addDomain,
  deleteBlogPost,
  deleteSite,
  duplicateSite,
  makePrimaryDomain,
  regenerateSeoSeed,
  removeDomain,
  resetPageOverride,
  saveBlogPost,
  saveCollectionSeo,
  savePageOverride,
  sendSiteTestMail,
  updateSiteGeneral,
  updateSiteMail,
  updateSitePayment,
  updateSiteSettings,
} from "@/lib/actions/panel-sites";
import { STATIC_PAGES } from "@/lib/content/pages";
import { allCollections } from "@/lib/catalog";
import { BRANDS } from "@/lib/taxonomy";
import { TR_CITIES } from "@/lib/tr-cities";
import { formatDate, formatDateTime } from "@/lib/format";
import { getPlatformSetting } from "@/lib/platform-settings";

export const metadata = { title: "Site Yönetimi" };

const TABS = [
  { key: "genel", label: "Genel" },
  { key: "anasayfa", label: "Ana Sayfa" },
  { key: "iletisim", label: "İletişim & Şirket" },
  { key: "kargo", label: "Kargo & Fiyat" },
  { key: "seo", label: "SEO & Analitik" },
  { key: "alan-adlari", label: "Alan Adları" },
  { key: "odeme", label: "Ödeme" },
  { key: "eposta", label: "E-posta (SMTP)" },
  { key: "sayfalar", label: "Sayfalar" },
  { key: "blog", label: "Blog" },
  { key: "gelismis", label: "Gelişmiş" },
];

const SECTION_LABELS: Record<string, string> = {
  categoryTiles: "Kategori kutuları",
  featured: "Öne çıkan ürünler",
  newArrivals: "Yeni gelenler",
  bestSellers: "Çok satanlar",
  brands: "Marka şeridi",
  sale: "İndirimdeki ürünler",
  upcoming: "Yakında çıkacaklar (drop takvimi)",
  blog: "Blog yazıları",
  seoText: "Alt kısımdaki SEO metni",
};

export default async function SiteEditPage({ params, searchParams }: PageProps<"/panel/siteler/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const tab = typeof sp.sekme === "string" && TABS.some((t) => t.key === sp.sekme) ? sp.sekme : "genel";
  const ctx = await requirePanel();
  const site = await db.query.sites.findFirst({ where: eq(schema.sites.id, Number(id)) });
  if (!site || (!ctx.isPlatform && site.merchantId !== ctx.merchant?.id)) notFound();
  const domains = await db.select().from(schema.siteDomains).where(eq(schema.siteDomains.siteId, site.id));
  const url = siteUrl(site.slug, domains);
  const base = `/panel/siteler/${site.id}`;
  const merchant = await db.query.merchants.findFirst({ where: eq(schema.merchants.id, site.merchantId) });

  return (
    <>
      <div className="mb-2 text-sm text-zinc-500">
        <Link href="/panel/siteler" className="hover:underline">
          Siteler
        </Link>{" "}
        / {site.name}
      </div>
      <PageHeader
        title={site.name}
        description={`${url.replace(/^https?:\/\//, "")} · ${THEMES[site.theme].name} tema${ctx.isPlatform && merchant ? ` · ${merchant.name}` : ""}`}
        actions={
          <>
            <a href={`/panel/onizle/${site.slug}`} className="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-semibold hover:bg-zinc-50">
              <Eye size={16} /> Önizle
            </a>
            <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white">
              Siteyi Aç <ArrowUpRight size={16} />
            </a>
          </>
        }
      />
      {sp.yeni === "1" && (
        <div className="mb-6">
          <Notice tone="green">
            <b>Site oluşturuldu.</b> Varsayılan slider, kampanyalar, yasal sayfalar ve blog yazıları hazır. Aşağıdan içerikleri düzenleyebilir, alan adını bağlayabilir ve hazır olduğunda durumu <b>Yayında</b> yapabilirsin.
          </Notice>
        </div>
      )}
      <TabNav tabs={TABS} active={tab} base={base} />

      {tab === "genel" && <GeneralTab site={site} isPlatform={ctx.isPlatform} />}
      {tab === "anasayfa" && <HomeTab site={site} />}
      {tab === "iletisim" && <ContactTab site={site} />}
      {tab === "kargo" && <ShippingTab site={site} />}
      {tab === "seo" && <SeoTab site={site} url={url} colKey={typeof sp.kategori === "string" ? sp.kategori : ""} />}
      {tab === "alan-adlari" && <DomainsTab site={site} domains={domains} />}
      {tab === "odeme" && <PaymentTab site={site} />}
      {tab === "eposta" && <MailTab site={site} defaultTo={merchant?.notifyEmail || merchant?.email || ctx.user.email} />}
      {tab === "sayfalar" && <PagesTab site={site} url={url} edit={typeof sp.sayfa === "string" ? sp.sayfa : ""} />}
      {tab === "blog" && <BlogTab site={site} url={url} edit={typeof sp.yazi === "string" ? sp.yazi : ""} />}
      {tab === "gelismis" && <AdvancedTab site={site} />}
    </>
  );
}

type SiteRow = typeof schema.sites.$inferSelect;

/* ------------------------------------------------------------------ */

async function GeneralTab({ site, isPlatform }: { site: SiteRow; isPlatform: boolean }) {
  const s = site.settings;
  const merchants = isPlatform ? await db.select({ id: schema.merchants.id, name: schema.merchants.name }).from(schema.merchants) : [];
  const [orders, customers] = await Promise.all([db.$count(schema.orders, eq(schema.orders.siteId, site.id)), db.$count(schema.customers, eq(schema.customers.siteId, site.id))]);
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <Card title="Site bilgileri">
          <ActionForm action={updateSiteGeneral.bind(null, site.id)}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Site adı" name="name" defaultValue={site.name} required />
              <Select
                label="Durum"
                name="status"
                defaultValue={site.status}
                options={[
                  { value: "active", label: "Yayında" },
                  { value: "draft", label: "Taslak (ziyaretçilere 'çok yakında' gösterilir)" },
                  { value: "maintenance", label: "Bakımda" },
                ]}
              />
              <Select label="Tema" name="theme" defaultValue={site.theme} options={THEME_KEYS.map((k) => ({ value: k, label: `${THEMES[k].name} — ${THEMES[k].tagline}` }))} hint="Tüm temaları görsel olarak karşılaştırmak için Temalar sayfasına bakın." />
              {isPlatform && <Select label="Satıcı (sahip)" name="merchantId" defaultValue={String(site.merchantId)} options={merchants.map((m) => ({ value: String(m.id), label: m.name }))} />}
            </div>
          </ActionForm>
        </Card>
        <Card title="Logo ve renkler" description="Logo yüklemezsen site adı temaya uygun tipografiyle logo olarak kullanılır.">
          <ActionForm action={updateSiteSettings.bind(null, site.id)}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Logo yazısı" name="logoText" defaultValue={s.logoText} />
              <Field label="Slogan" name="tagline" defaultValue={s.tagline} hint="Sayfa başlıklarında ve arama sonuçlarında kullanılır." />
            </div>
            <ImageField label="Logo görseli (isteğe bağlı)" name="logoUrl" defaultValue={s.logoUrl} hint="Şeffaf PNG veya SVG önerilir, yükseklik en az 80px." />
            <div className="grid gap-4 sm:grid-cols-3">
              <ColorField label="Ana renk" name="colors.primary" defaultValue={s.colors.primary} />
              <ColorField label="Vurgu rengi" name="colors.accent" defaultValue={s.colors.accent} />
              <ColorField label="İndirim rengi" name="colors.sale" defaultValue={s.colors.sale} />
            </div>
          </ActionForm>
        </Card>
      </div>
      <div className="space-y-6">
        <Card title="Tema">
          <div className="overflow-hidden rounded-lg border border-zinc-200">
            <ThemeThumb theme={site.theme} colors={s.colors} />
          </div>
          <p className="mt-3 font-semibold">{THEMES[site.theme].name}</p>
          <p className="text-sm text-zinc-500">{THEMES[site.theme].description}</p>
          <ButtonLink href="/panel/temalar" variant="secondary" className="mt-4 w-full justify-center">
            Temaları karşılaştır
          </ButtonLink>
        </Card>
        <Card title="Özet">
          <KeyValue
            items={[
              ["Oluşturma", formatDate(site.createdAt)],
              ["Son güncelleme", formatDateTime(site.updatedAt)],
              ["Sipariş", orders],
              ["Üye müşteri", customers],
              ["Ödeme", site.paymentMode === "demo" ? "Test modu" : site.paymentMode === "module" ? `Shopier modül #${site.shopierWebsiteIndex}` : "Shopier ürün sayfası"],
            ]}
          />
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function HomeTab({ site }: { site: SiteRow }) {
  const s = site.settings;
  const action = updateSiteSettings.bind(null, site.id);
  return (
    <div className="space-y-6">
      <Card title="Duyuru bandı" description="Sitenin en üstünde dönen kısa mesajlar. Her satır bir mesaj.">
        <ActionForm action={action}>
          <TextArea label="Mesajlar" name="announcements" kind="lines" rows={4} defaultValue={s.announcements.join("\n")} />
        </ActionForm>
      </Card>
      <Card title="Ana sayfa slider" description="Görsel boş bırakılırsa, temaya uygun ürün görseli kullanılır. Önerilen boyut 1920×900.">
        <ActionForm action={action}>
          <Repeater
            name="heroSlides"
            addLabel="Slayt ekle"
            max={6}
            defaultValue={s.heroSlides.map((h) => ({ ...h }))}
            blank={{ eyebrow: "", title: "Yeni slayt", subtitle: "", cta: "Keşfet", href: "/yeni-gelenler", image: "", bg: "#111111", fg: "#ffffff" }}
            fields={[
              { key: "eyebrow", label: "Üst başlık" },
              { key: "title", label: "Başlık" },
              { key: "subtitle", label: "Açıklama", type: "textarea" },
              { key: "cta", label: "Buton yazısı" },
              { key: "href", label: "Bağlantı", placeholder: "/indirim" },
              { key: "bg", label: "Arka plan rengi", type: "color" },
              { key: "fg", label: "Yazı rengi", type: "color" },
              { key: "image", label: "Görsel", type: "image" },
            ]}
          />
        </ActionForm>
      </Card>
      <Card title="Kampanya bannerları" description="Ana sayfadaki kampanya kutuları (tema düzenine göre 2 veya 4 adet gösterilir).">
        <ActionForm action={action}>
          <Repeater
            name="promoBanners"
            addLabel="Banner ekle"
            max={6}
            defaultValue={s.promoBanners.map((b) => ({ ...b }))}
            blank={{ title: "Yeni kampanya", subtitle: "", cta: "Alışverişe Başla", href: "/indirim", image: "", bg: "#f2f2f2", fg: "#111111" }}
            fields={[
              { key: "title", label: "Başlık" },
              { key: "subtitle", label: "Alt başlık" },
              { key: "cta", label: "Buton yazısı" },
              { key: "href", label: "Bağlantı" },
              { key: "bg", label: "Arka plan", type: "color" },
              { key: "fg", label: "Yazı rengi", type: "color" },
              { key: "image", label: "Görsel", type: "image" },
            ]}
          />
        </ActionForm>
      </Card>
      <Card title="Ana sayfa bölümleri" description="Tema düzeni korunur; kapattığın bölümler ana sayfada gösterilmez.">
        <ActionForm action={action}>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Object.entries(s.homeSections).map(([k, v]) => (
              <Toggle key={k} label={SECTION_LABELS[k] ?? k} name={`homeSections.${k}`} defaultChecked={v} />
            ))}
          </div>
        </ActionForm>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ContactTab({ site }: { site: SiteRow }) {
  const s = site.settings;
  const action = updateSiteSettings.bind(null, site.id);
  return (
    <div className="space-y-6">
      <Card title="İletişim bilgileri" description="Alt bilgi, iletişim sayfası, yasal metinler ve Google yerel SEO (LocalBusiness) verisinde kullanılır.">
        <ActionForm action={action}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Telefon" name="contact.phone" defaultValue={s.contact.phone} placeholder="0850 000 00 00" />
            <Field label="E-posta" name="contact.email" type="email" defaultValue={s.contact.email} />
            <Field label="WhatsApp numarası" name="contact.whatsapp" defaultValue={s.contact.whatsapp} hint="Ülke koduyla, örn. 905321234567. Boşsa WhatsApp butonu gizlenir." />
            <Field label="Çalışma saatleri" name="contact.workingHours" defaultValue={s.contact.workingHours} />
            <Field label="Adres" name="contact.address" defaultValue={s.contact.address} className="md:col-span-2" />
            <Field label="İlçe" name="contact.district" defaultValue={s.contact.district} />
            <Select label="İl" name="contact.city" defaultValue={s.contact.city} options={TR_CITIES.map((c) => ({ value: c, label: c }))} />
            <Field label="Posta kodu" name="contact.postcode" defaultValue={s.contact.postcode} />
            <Field label="Google Harita embed URL" name="contact.mapEmbedUrl" defaultValue={s.contact.mapEmbedUrl} hint="Google Haritalar > Paylaş > Harita yerleştir bağlantısındaki src adresi." />
          </div>
        </ActionForm>
      </Card>
      <Card title="Sosyal medya">
        <ActionForm action={action}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Instagram" name="social.instagram" defaultValue={s.social.instagram} placeholder="https://instagram.com/..." />
            <Field label="TikTok" name="social.tiktok" defaultValue={s.social.tiktok} />
            <Field label="X (Twitter)" name="social.x" defaultValue={s.social.x} />
            <Field label="Facebook" name="social.facebook" defaultValue={s.social.facebook} />
            <Field label="YouTube" name="social.youtube" defaultValue={s.social.youtube} />
          </div>
        </ActionForm>
      </Card>
      <Card title="Şirket bilgileri" description="Mesafeli satış sözleşmesi, ön bilgilendirme formu ve KVKK metinlerine otomatik yerleştirilir.">
        <ActionForm action={action}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Ticari unvan" name="company.legalName" defaultValue={s.company.legalName} />
            <Field label="Vergi dairesi" name="company.taxOffice" defaultValue={s.company.taxOffice} />
            <Field label="Vergi numarası" name="company.taxNumber" defaultValue={s.company.taxNumber} />
            <Field label="MERSİS no" name="company.mersisNo" defaultValue={s.company.mersisNo} />
            <Field label="KEP adresi" name="company.kepAddress" defaultValue={s.company.kepAddress} />
            <Field label="Şirket adresi" name="company.address" defaultValue={s.company.address} />
          </div>
        </ActionForm>
      </Card>
      <Card title="Hakkımızda ve alt bilgi metni">
        <ActionForm action={action}>
          <TextArea label="Kısa tanıtım (alt bilgi)" name="footerText" rows={3} defaultValue={s.footerText} />
          <TextArea label="Hakkımızda özeti" name="about" rows={4} defaultValue={s.about} />
        </ActionForm>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ShippingTab({ site }: { site: SiteRow }) {
  const s = site.settings;
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card title="Kargo ve iade" description="Sepet, ürün sayfası, SSS ve yasal metinlerde otomatik kullanılır.">
        <ActionForm action={updateSiteSettings.bind(null, site.id)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ücretsiz kargo alt limiti (TL)" name="shipping.freeShippingThreshold" type="number" min={0} kind="number" defaultValue={s.shipping.freeShippingThreshold} />
            <Field label="Kargo ücreti (TL)" name="shipping.fee" type="number" min={0} kind="number" defaultValue={s.shipping.fee} />
            <Field label="Kargo firması" name="shipping.carrier" defaultValue={s.shipping.carrier} />
            <Field label="Kargoya teslim süresi" name="shipping.dispatchDays" defaultValue={s.shipping.dispatchDays} hint="Örn. 1-2 iş günü" />
            <Field label="İade süresi (gün)" name="shipping.returnDays" type="number" min={14} kind="number" defaultValue={s.shipping.returnDays} hint="Mesafeli satış mevzuatı gereği en az 14 gün." />
          </div>
        </ActionForm>
      </Card>
      <Card title="Fiyat ve taksit" description="Aynı kataloğu farklı sitelerde farklı fiyat politikasıyla satabilirsin.">
        <ActionForm action={updateSiteSettings.bind(null, site.id)}>
          <Field
            label="Fiyat ayarı (%)"
            name="priceAdjustPercent"
            type="number"
            step="1"
            min={-50}
            max={100}
            kind="number"
            defaultValue={s.priceAdjustPercent}
            hint="Örn. 5 yazarsan bu sitede tüm fiyatlar %5 artar ve 9'la biten psikolojik fiyata yuvarlanır. 0 = katalog fiyatı."
          />
          <Field label="Taksit metni" name="installmentText" defaultValue={s.installmentText} />
        </ActionForm>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */

async function SeoTab({ site, url, colKey }: { site: SiteRow; url: string; colKey: string }) {
  const s = site.settings;
  const cols = [
    ...allCollections().map((c) => ({ key: c.key, label: c.label, path: `/${c.slug}` })),
    ...BRANDS.map((b) => ({ key: `marka:${b.slug}`, label: `Marka: ${b.name}`, path: `/marka/${b.slug}` })),
  ];
  const overrides = await db.select().from(schema.collectionSeo).where(eq(schema.collectionSeo.siteId, site.id));
  const selected = cols.find((c) => c.key === colKey);
  const current = overrides.find((o) => o.key === colKey);
  return (
    <div className="space-y-6">
      <Notice tone="blue">
        Her site Google&apos;da ayrı indekslenir: kendi <b>sitemap.xml</b> ve <b>robots.txt</b> dosyası, kanonik adresleri ve yapılandırılmış verisi (Product, Breadcrumb, FAQ, Organization) otomatik üretilir. Ürün ve kategori metinleri her site için farklı cümlelerle yazılır; böylece aynı ürün birden fazla sitede kopya içerik sayılmaz.
        <span className="mt-2 flex flex-wrap gap-3">
          <a href={`${url}/sitemap.xml`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold underline">
            sitemap.xml <ExternalLink size={13} />
          </a>
          <a href={`${url}/robots.txt`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold underline">
            robots.txt <ExternalLink size={13} />
          </a>
          <a href={`${url}/google-merchant.xml`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold underline">
            Google / Meta ürün feed&apos;i <ExternalLink size={13} />
          </a>
        </span>
      </Notice>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Ana sayfa ve genel SEO">
          <ActionForm action={updateSiteSettings.bind(null, site.id)}>
            <Field label="Ana sayfa başlığı (title)" name="seo.homeTitle" defaultValue={s.seo.homeTitle} maxLength={70} hint="50-60 karakter idealdir." />
            <TextArea label="Ana sayfa açıklaması (meta description)" name="seo.homeDescription" rows={3} defaultValue={s.seo.homeDescription} maxLength={170} hint="140-160 karakter idealdir." />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Başlık eki" name="seo.titleSuffix" defaultValue={s.seo.titleSuffix} hint="Sayfa başlıklarının sonuna eklenir." />
              <Select label="Hedef şehir (yerel SEO)" name="seo.targetCity" defaultValue={s.seo.targetCity} options={[{ value: "", label: "Türkiye geneli" }, ...TR_CITIES.map((c) => ({ value: c, label: c }))]} />
            </div>
            <Field label="Anahtar kelimeler" name="seo.keywords" kind="csv" defaultValue={s.seo.keywords.join(", ")} hint="Virgülle ayırın." />
          </ActionForm>
        </Card>
        <Card title="Doğrulama ve analitik" description="Analitik kodları yalnızca ziyaretçi çerez onayı verdikten sonra çalışır (KVKK uyumlu).">
          <ActionForm action={updateSiteSettings.bind(null, site.id)}>
            <Field label="Google Search Console doğrulama kodu" name="seo.googleVerification" defaultValue={s.seo.googleVerification} placeholder="google-site-verification içeriği" />
            <Field label="Yandex Webmaster doğrulama kodu" name="seo.yandexVerification" defaultValue={s.seo.yandexVerification} />
            <Field label="Bing Webmaster doğrulama kodu" name="seo.bingVerification" defaultValue={s.seo.bingVerification} />
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Google Analytics 4" name="seo.gaId" defaultValue={s.seo.gaId} placeholder="G-XXXXXXX" />
              <Field label="Tag Manager" name="seo.gtmId" defaultValue={s.seo.gtmId} placeholder="GTM-XXXX" />
              <Field label="Meta Pixel" name="seo.metaPixelId" defaultValue={s.seo.metaPixelId} />
            </div>
          </ActionForm>
        </Card>
      </div>
      <Card title="Otomatik metin çeşitlemesi" description="Bu sitenin ürün ve kategori metinleri benzersiz bir tohum değerle üretilir.">
        <div className="flex flex-wrap items-center gap-4">
          <p className="text-sm text-zinc-600">
            Mevcut tohum: <b className="tabular-nums">{s.seo.seed}</b>. Yeni bir tohum, bu sitedeki tüm otomatik ürün/kategori açıklamalarını farklı cümlelerle yeniden yazar (elle girilen ve AI ile üretilen metinler korunur).
          </p>
          <ActionButton action={regenerateSeoSeed.bind(null, site.id)} confirm="Otomatik metinler yeniden üretilsin mi? Google'da indekslenmiş sayfaların metni değişecektir.">
            <RotateCcw size={15} /> Metinleri yeniden üret
          </ActionButton>
        </div>
      </Card>
      <Card title="Kategori ve marka sayfası SEO" description="Seçtiğin sayfanın başlığını, açıklamasını ve alt metnini elle yazabilirsin. Boş alanlar otomatik üretilir.">
        <form className="mb-5 flex flex-col gap-2 sm:flex-row">
          <input type="hidden" name="sekme" value="seo" />
          <select name="kategori" defaultValue={colKey} className="h-10 flex-1 rounded-lg border border-zinc-300 bg-white px-3 text-sm">
            <option value="">Sayfa seçin…</option>
            {cols.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label} {overrides.some((o) => o.key === c.key) ? "✓" : ""}
              </option>
            ))}
          </select>
          <button className="h-10 rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white">Düzenle</button>
        </form>
        {overrides.length > 0 && !selected && (
          <div className="flex flex-wrap gap-2">
            {overrides.map((o) => (
              <Link key={o.key} href={`/panel/siteler/${site.id}?sekme=seo&kategori=${encodeURIComponent(o.key)}`} className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium hover:bg-zinc-200">
                {cols.find((c) => c.key === o.key)?.label ?? o.key}
              </Link>
            ))}
          </div>
        )}
        {selected && (
          <ActionForm action={saveCollectionSeo.bind(null, site.id)} key={selected.key}>
            <input type="hidden" name="key" value={selected.key} />
            <p className="text-sm">
              <b>{selected.label}</b> ·{" "}
              <a href={`${url}${selected.path}`} target="_blank" rel="noopener noreferrer" className="text-zinc-500 underline">
                {selected.path}
              </a>
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="H1 başlık" name="h1" defaultValue={current?.h1 ?? ""} />
              <Field label="Meta başlık" name="metaTitle" defaultValue={current?.metaTitle ?? ""} maxLength={70} />
            </div>
            <TextArea label="Meta açıklama" name="metaDescription" rows={2} maxLength={170} defaultValue={current?.metaDescription ?? ""} />
            <TextArea label="Giriş metni (ürünlerin üstünde)" name="intro" rows={3} defaultValue={current?.intro ?? ""} />
            <TextArea label="Alt SEO metni (Markdown: ## başlık, - madde)" name="content" rows={8} defaultValue={current?.content ?? ""} />
          </ActionForm>
        )}
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */

async function DomainsTab({ site, domains }: { site: SiteRow; domains: (typeof schema.siteDomains.$inferSelect)[] }) {
  const general = await getPlatformSetting("general");
  const root = process.env.ROOT_DOMAIN ?? "localhost:3000";
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <div className="space-y-6">
        <Card title="Bağlı alan adları" description="Birincil alan adı dışındaki adresler (www dahil) birincil adrese 301 ile yönlendirilir; böylece Google'da kopya indeks oluşmaz.">
          <ul className="divide-y divide-zinc-100">
            <li className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <Globe size={16} className="text-zinc-400" />
                <span className="truncate font-medium">
                  {site.slug}.{root}
                </span>
                <Badge>Ücretsiz alt alan adı</Badge>
              </div>
            </li>
            {domains.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  <Globe size={16} className="text-zinc-400" />
                  <a href={`https://${d.hostname}`} target="_blank" rel="noopener noreferrer" className="truncate font-medium hover:underline">
                    {d.hostname}
                  </a>
                  {d.isPrimary && <Badge tone="green">Birincil</Badge>}
                </div>
                <div className="flex gap-2">
                  {!d.isPrimary && (
                    <ActionButton action={makePrimaryDomain.bind(null, site.id, d.id)}>
                      <Star size={14} /> Birincil yap
                    </ActionButton>
                  )}
                  <ActionButton action={removeDomain.bind(null, site.id, d.id)} variant="danger" confirm={`${d.hostname} kaldırılsın mı?`}>
                    <Trash2 size={14} />
                  </ActionButton>
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Alan adı ekle">
          <ActionForm action={addDomain.bind(null, site.id)} submitLabel="Ekle" resetOnSuccess>
            <Field label="Alan adı" name="hostname" placeholder="magazam.com" required hint="www olmadan yazın; www adresi otomatik olarak yönlendirilir." />
          </ActionForm>
        </Card>
      </div>
      <Card title="DNS ayarları" description="Alan adı sağlayıcının (GoDaddy, Natro, İsimtescil, Cloudflare…) DNS panelinde şu kayıtları ekle:">
        <div className="space-y-3 text-sm">
          <div className="overflow-x-auto rounded-lg border border-zinc-200">
            <table className="w-full text-left">
              <thead className="bg-zinc-50 text-xs text-zinc-500">
                <tr>
                  <th className="px-3 py-2">Tür</th>
                  <th className="px-3 py-2">Ad</th>
                  <th className="px-3 py-2">Değer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-mono text-xs">
                <tr>
                  <td className="px-3 py-2">A</td>
                  <td className="px-3 py-2">@</td>
                  <td className="px-3 py-2">{general.serverIp || "SUNUCU_IP"}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">CNAME</td>
                  <td className="px-3 py-2">www</td>
                  <td className="px-3 py-2">{root.replace(/:\d+$/, "")}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-zinc-600">DNS değişikliklerinin yayılması birkaç dakika ile 24 saat arasında sürebilir. Kayıtlar doğrulandığında SSL sertifikası otomatik olarak üretilir.</p>
          {!general.serverIp && <Notice tone="amber">Sunucu IP adresi henüz tanımlanmamış. Süper admin Platform Ayarları &gt; Genel bölümünden girebilir.</Notice>}
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */

async function PaymentTab({ site }: { site: SiteRow }) {
  const accounts = await db.select().from(schema.shopierAccounts).where(eq(schema.shopierAccounts.merchantId, site.merchantId));
  const used = accounts.length
    ? await db
        .select({ id: schema.sites.id, name: schema.sites.name, acc: schema.sites.shopierAccountId, idx: schema.sites.shopierWebsiteIndex })
        .from(schema.sites)
        .where(inArray(schema.sites.shopierAccountId, accounts.map((a) => a.id)))
    : [];
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
      <Card title="Ödeme yöntemi">
        <ActionForm action={updateSitePayment.bind(null, site.id)}>
          <Select
            label="Ödeme modu"
            name="paymentMode"
            defaultValue={site.paymentMode}
            options={[
              { value: "module", label: "Shopier Ödeme Modülü — sepetin tamamı tek ödemede (önerilen)" },
              { value: "hosted", label: "Shopier ürün sayfası — her ürün Shopier'deki sayfasından satılır" },
              { value: "demo", label: "Test modu — gerçek ödeme alınmaz" },
            ]}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Shopier hesabı" name="shopierAccountId" defaultValue={String(site.shopierAccountId ?? "")} options={[{ value: "", label: accounts.length ? "Seçin" : "Önce Shopier hesabı ekleyin" }, ...accounts.map((a) => ({ value: String(a.id), label: a.name }))]} />
            <Select
              label="Website index (1-5)"
              name="shopierWebsiteIndex"
              defaultValue={String(site.shopierWebsiteIndex ?? "")}
              options={[{ value: "", label: "Seçin" }, ...[1, 2, 3, 4, 5].map((i) => ({ value: String(i), label: `${i}` }))]}
              hint="Shopier > Entegrasyonlar > Modül Yönetimi'nde bu siteye ayırdığınız sıra."
            />
          </div>
        </ActionForm>
      </Card>
      <Card title="Shopier website index doluluğu" description="Bir Shopier hesabına ödeme modülüyle en fazla 5 site bağlanabilir.">
        {accounts.length === 0 ? (
          <div className="space-y-3 text-sm">
            <p className="text-zinc-500">Bu satıcının henüz Shopier hesabı yok.</p>
            <ButtonLink href="/panel/shopier" variant="secondary">
              Shopier hesabı ekle
            </ButtonLink>
          </div>
        ) : (
          <div className="space-y-4">
            {accounts.map((a) => (
              <div key={a.id}>
                <p className="mb-2 text-sm font-semibold">{a.name}</p>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((i) => {
                    const u = used.find((x) => x.acc === a.id && x.idx === i);
                    return (
                      <div key={i} className={`rounded-lg border p-2 text-center text-xs ${u ? (u.id === site.id ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-zinc-100") : "border-dashed border-zinc-300 text-zinc-400"}`}>
                        <p className="font-bold">#{i}</p>
                        <p className="truncate">{u ? u.name : "Boş"}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */

const MAIL_TEMPLATES = [
  ["Sipariş onayı", "Ödeme alındığında müşteriye sipariş özeti gönderilir.", "siparis-onayi"],
  ["Kargoya verildi", "Siparişe takip numarası girilip durum 'Kargoda' yapıldığında.", "kargo"],
  ["Sipariş durumu", "Hazırlanıyor, teslim edildi, iptal, iade durumlarında (isteğe bağlı).", "durum"],
  ["Hoş geldin", "Müşteri siteye üye olduğunda.", "hos-geldin"],
  ["Şifre sıfırlama", "Müşteri şifresini unuttuğunda.", "sifre-sifirlama"],
  ["Stoğa girdi", "'Gelince haber ver' listesindeki müşterilere.", "stoga-girdi"],
  ["Yeni sipariş (satıcıya)", "Her ödenmiş siparişte bildirim adresine.", "yeni-siparis"],
  ["İletişim formu (satıcıya)", "Siteden mesaj geldiğinde bildirim adresine.", "iletisim-formu"],
];

async function MailTab({ site, defaultTo }: { site: SiteRow; defaultTo: string }) {
  const m = await db.query.siteMailSettings.findFirst({ where: eq(schema.siteMailSettings.siteId, site.id) });
  const platformSmtp = await getPlatformSetting("smtp");
  const logs = await db.select().from(schema.emailLogs).where(eq(schema.emailLogs.siteId, site.id)).orderBy(desc(schema.emailLogs.createdAt)).limit(12);
  const using = m?.enabled && m.host ? "site" : platformSmtp.host ? "platform" : process.env.SMTP_HOST ? "env" : "none";
  return (
    <div className="space-y-6">
      <Notice tone={using === "none" ? "amber" : "green"}>
        {using === "site" && (
          <>
            Bu site e-postalarını <b>kendi SMTP sunucusundan</b> ({m?.host}) <b>{m?.fromEmail}</b> adresiyle gönderiyor.
          </>
        )}
        {using === "platform" && (
          <>
            Bu site şu anda <b>platform SMTP sunucusunu</b> kullanıyor (gönderen adı: {site.name}). Kendi alan adınla göndermek için aşağıdan SMTP bilgilerini gir.
          </>
        )}
        {using === "env" && <>Bu site sunucu ortam değişkenlerindeki SMTP ayarını kullanıyor.</>}
        {using === "none" && <>Henüz hiçbir SMTP sunucusu tanımlı değil; e-postalar gönderilmiyor, yalnızca kayıt altına alınıyor. Aşağıdan site SMTP ayarlarını gir ya da süper adminden platform SMTP ayarlarını tanımla.</>}
      </Notice>
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card title="SMTP ayarları" description="Yandex, Google Workspace, Outlook, hosting firmanın e-posta sunucusu ya da SendGrid/Mailgun gibi servislerle çalışır.">
          <ActionForm action={updateSiteMail.bind(null, site.id)}>
            <Toggle label="Bu site kendi SMTP sunucusunu kullansın" name="enabled" defaultChecked={m?.enabled ?? false} hint="Kapalıysa platformun e-posta sunucusu kullanılır." />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="SMTP sunucusu" name="host" defaultValue={m?.host ?? ""} placeholder="smtp.yandex.com" />
              <Field label="Port" name="port" type="number" defaultValue={m?.port ?? 587} hint="587 (STARTTLS) veya 465 (SSL)" />
              <Field label="Kullanıcı adı" name="username" defaultValue={m?.username ?? ""} autoComplete="off" />
              <Field label="Şifre" name="password" type="password" placeholder={m?.password ? "•••••••• (değiştirmek için yazın)" : ""} autoComplete="new-password" />
              <Field label="Gönderen e-posta" name="fromEmail" type="email" defaultValue={m?.fromEmail ?? ""} placeholder={`siparis@${site.slug}.com`} />
              <Field label="Gönderen adı" name="fromName" defaultValue={m?.fromName ?? site.name} />
              <Field label="Yanıt adresi (Reply-To)" name="replyTo" type="email" defaultValue={m?.replyTo ?? ""} />
              <Field label="Bildirim e-postası" name="notifyEmail" type="email" defaultValue={m?.notifyEmail ?? ""} hint="Bu sitenin yeni sipariş ve mesaj bildirimleri. Boşsa satıcının bildirim adresi." />
            </div>
            <Toggle label="SSL/TLS (port 465)" name="secure" defaultChecked={m?.secure ?? false} />
          </ActionForm>
        </Card>
        <div className="space-y-6">
          <Card title="Test e-postası gönder">
            <ActionForm action={sendSiteTestMail.bind(null, site.id)} submitLabel="Gönder">
              <Field label="Alıcı" name="to" type="email" defaultValue={defaultTo} required />
            </ActionForm>
          </Card>
          <Card title="Otomatik e-postalar">
            <ul className="space-y-3 text-sm">
              {MAIL_TEMPLATES.map(([t, d, k]) => (
                <li key={t} className="flex items-start justify-between gap-3">
                  <span>
                    <span className="block font-medium">{t}</span>
                    <span className="block text-xs text-zinc-500">{d}</span>
                  </span>
                  <a href={`/panel/eposta-onizleme/${k}?site=${site.id}`} target="_blank" rel="noopener noreferrer" className="shrink-0 text-xs font-semibold underline">
                    Önizle
                  </a>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
      <Card title="Son gönderimler" actions={<Link href="/panel/bildirimler?sekme=eposta" className="text-sm font-medium hover:underline">Tüm kayıtlar</Link>}>
        {logs.length === 0 ? (
          <p className="text-sm text-zinc-500">Bu siteden henüz e-posta gönderilmedi.</p>
        ) : (
          <ul className="divide-y divide-zinc-100 text-sm">
            {logs.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <div className="min-w-0">
                  <p className="truncate font-medium">{l.subject}</p>
                  <p className="truncate text-xs text-zinc-500">
                    {l.to} · {l.template} · {l.transport}
                    {l.error ? ` · ${l.error}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={l.status === "sent" ? "green" : l.status === "failed" ? "red" : "zinc"}>{l.status === "sent" ? "Gönderildi" : l.status === "failed" ? "Hata" : "Kaydedildi"}</Badge>
                  <span className="text-xs text-zinc-400">{formatDateTime(l.createdAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */

async function PagesTab({ site, url, edit }: { site: SiteRow; url: string; edit: string }) {
  const overrides = await db.select().from(schema.sitePages).where(eq(schema.sitePages.siteId, site.id));
  const page = STATIC_PAGES.find((p) => p.slug === edit);
  if (page) {
    const o = overrides.find((x) => x.slug === page.slug);
    return (
      <Card
        title={`${page.title} sayfası`}
        description="Boş bırakılan alanlarda, site bilgileriyle otomatik doldurulan varsayılan metin kullanılır. {site}, {phone}, {email}, {company} gibi değişkenler desteklenir."
        actions={
          <Link href={`/panel/siteler/${site.id}?sekme=sayfalar`} className="text-sm font-medium hover:underline">
            ← Sayfalar
          </Link>
        }
      >
        <ActionForm action={savePageOverride.bind(null, site.id, page.slug)}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Sayfa başlığı" name="title" defaultValue={o?.title ?? ""} placeholder={page.title} />
            <Field label="Meta açıklama" name="metaDescription" defaultValue={o?.metaDescription ?? ""} placeholder={page.description.slice(0, 90) + "…"} />
          </div>
          <TextArea label="İçerik (Markdown)" name="content" rows={18} defaultValue={o?.content ?? page.body} hint="## Başlık, **kalın**, - madde, [bağlantı](/adres) biçimleri desteklenir." />
        </ActionForm>
        {o && (
          <div className="mt-4">
            <ActionButton action={resetPageOverride.bind(null, site.id, page.slug)} confirm="Bu sayfa varsayılan metne dönsün mü?">
              <RotateCcw size={14} /> Varsayılana dön
            </ActionButton>
          </div>
        )}
      </Card>
    );
  }
  const groups = { kurumsal: "Kurumsal", yardim: "Yardım", yasal: "Yasal" } as const;
  return (
    <div className="space-y-6">
      <Notice>
        Tüm yasal metinler (mesafeli satış, ön bilgilendirme, KVKK, çerez politikası) site ve şirket bilgilerinle otomatik doldurulur. İstersen sayfa bazında düzenleyebilirsin.
      </Notice>
      {(Object.keys(groups) as (keyof typeof groups)[]).map((g) => (
        <Card key={g} title={groups[g]}>
          <ul className="divide-y divide-zinc-100">
            {STATIC_PAGES.filter((p) => p.group === g).map((p) => {
              const o = overrides.find((x) => x.slug === p.slug);
              return (
                <li key={p.slug} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText size={16} className="shrink-0 text-zinc-400" />
                    <span className="font-medium">{o?.title || p.title}</span>
                    <span className="hidden text-xs text-zinc-400 sm:inline">/{p.slug}</span>
                    {o ? <Badge tone="blue">Düzenlendi</Badge> : <Badge>Otomatik</Badge>}
                  </div>
                  <div className="flex gap-2">
                    <a href={`${url}/${p.slug}`} target="_blank" rel="noopener noreferrer" className="grid h-9 w-9 place-items-center rounded-lg border border-zinc-300 hover:bg-zinc-50" title="Görüntüle">
                      <ArrowUpRight size={15} />
                    </a>
                    <Link href={`/panel/siteler/${site.id}?sekme=sayfalar&sayfa=${p.slug}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-300 px-3 text-sm font-semibold hover:bg-zinc-50">
                      <Pencil size={14} /> Düzenle
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */

async function BlogTab({ site, url, edit }: { site: SiteRow; url: string; edit: string }) {
  const posts = await db.select().from(schema.blogPosts).where(eq(schema.blogPosts.siteId, site.id)).orderBy(desc(schema.blogPosts.publishedAt));
  if (edit) {
    const post = edit === "yeni" ? null : (posts.find((p) => p.id === Number(edit)) ?? null);
    if (edit !== "yeni" && !post) notFound();
    return (
      <Card
        title={post ? "Yazıyı düzenle" : "Yeni blog yazısı"}
        actions={
          <Link href={`/panel/siteler/${site.id}?sekme=blog`} className="text-sm font-medium hover:underline">
            ← Yazılar
          </Link>
        }
      >
        <ActionForm action={saveBlogPost.bind(null, site.id, post?.id ?? null)} key={post?.id ?? "yeni"}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Başlık" name="title" defaultValue={post?.title ?? ""} required className="md:col-span-2" />
            <Field label="Adres (slug)" name="slug" defaultValue={post?.slug ?? ""} hint="Boş bırakılırsa başlıktan üretilir." />
            <Select
              label="Durum"
              name="status"
              defaultValue={post?.status ?? "published"}
              options={[
                { value: "published", label: "Yayında" },
                { value: "draft", label: "Taslak" },
              ]}
            />
            <Field label="Yayın tarihi" name="publishedAt" type="datetime-local" defaultValue={(post?.publishedAt ?? new Date()).toISOString().slice(0, 16)} />
          </div>
          <ImageField label="Kapak görseli" name="cover" defaultValue={post?.cover ?? ""} />
          <TextArea label="Özet" name="excerpt" rows={2} defaultValue={post?.excerpt ?? ""} />
          <TextArea label="İçerik (Markdown)" name="content" rows={18} defaultValue={post?.content ?? ""} />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Meta başlık" name="metaTitle" defaultValue={post?.metaTitle ?? ""} maxLength={70} />
            <Field label="Meta açıklama" name="metaDescription" defaultValue={post?.metaDescription ?? ""} maxLength={170} />
          </div>
        </ActionForm>
      </Card>
    );
  }
  return (
    <Card
      title={`Blog yazıları (${posts.length})`}
      description="Blog, uzun kuyruklu Türkçe aramalarda trafik çekmenin en etkili yolu. Her site kendi yazılarıyla ayrı indekslenir."
      actions={<ButtonLink href={`/panel/siteler/${site.id}?sekme=blog&yazi=yeni`}>+ Yeni yazı</ButtonLink>}
    >
      <ul className="divide-y divide-zinc-100">
        {posts.map((p) => (
          <li key={p.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
            <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.cover && <img src={p.cover} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{p.title}</p>
              <p className="text-xs text-zinc-500">
                {formatDate(p.publishedAt)} · /blog/{p.slug}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={p.status === "published" ? "green" : "amber"}>{p.status === "published" ? "Yayında" : "Taslak"}</Badge>
              <a href={`${url}/blog/${p.slug}`} target="_blank" rel="noopener noreferrer" className="grid h-9 w-9 place-items-center rounded-lg border border-zinc-300 hover:bg-zinc-50" title="Görüntüle">
                <ArrowUpRight size={15} />
              </a>
              <Link href={`/panel/siteler/${site.id}?sekme=blog&yazi=${p.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-300 px-3 text-sm font-semibold hover:bg-zinc-50">
                <Pencil size={14} /> Düzenle
              </Link>
              <ActionButton action={deleteBlogPost.bind(null, site.id, p.id)} variant="danger" confirm="Yazı silinsin mi?">
                <Trash2 size={14} />
              </ActionButton>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

function AdvancedTab({ site }: { site: SiteRow }) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card title="Siteyi kopyala" description="Tüm ayarlar, tema ve içerik yeni bir taslak siteye kopyalanır. SEO metinleri yeni site için farklı üretilir; doğrulama ve analitik kodları kopyalanmaz.">
        <ActionButton action={duplicateSite.bind(null, site.id)} variant="primary">
          <Copy size={15} /> Kopyasını oluştur
        </ActionButton>
      </Card>
      <Card title="Siteyi sil" description="Site, alan adları, blog yazıları, müşteri hesapları ve siparişleri kalıcı olarak silinir. Bu işlem geri alınamaz." className="border-rose-200">
        <ActionForm action={deleteSite.bind(null, site.id)} submitLabel="Siteyi kalıcı olarak sil" danger>
          <Field label={`Onaylamak için "${site.slug}" yazın`} name="confirm" autoComplete="off" required />
        </ActionForm>
      </Card>
    </div>
  );
}

