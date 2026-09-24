import type { Metadata } from "next";
import Link from "next/link";
import { and, asc, eq, inArray } from "drizzle-orm";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Check,
  CreditCard,
  Globe,
  Layers,
  Library,
  Mail,
  Palette,
  Plug,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  Truck,
} from "lucide-react";
import { db, schema } from "@/db";
import { THEMES, THEME_KEYS } from "@/themes/registry";
import { ThemeThumb } from "@/components/panel/theme-thumb";
import { PLANS } from "@/lib/plans";
import { getPlatformSetting } from "@/lib/platform-settings";
import { siteUrl } from "@/lib/panel";
import { planPrice } from "@/lib/billing";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const g = await getPlatformSetting("general");
  const title = `${g.platformName} | Shopier satıcıları için hazır sneaker mağaza siteleri`;
  const description = "Shopier mağazan için dakikalar içinde profesyonel sneaker e-ticaret siteleri kur: 10 hazır tema, katalog havuzu, yapay zekâ ürün açıklamaları, Türkçe SEO ve Shopier ödeme entegrasyonu.";
  return { title, description, robots: { index: true, follow: true }, openGraph: { title, description, type: "website", locale: "tr_TR" } };
}

const FEATURES = [
  { icon: Palette, title: "10 profesyonel tema", body: "Sneaksup ve Superstep kalitesinde, her biri farklı header, ürün kartı ve ürün sayfası düzenine sahip mağaza tasarımları." },
  { icon: Plug, title: "Shopier ile tam entegrasyon", body: "Sepet tutarını Shopier ödeme modülüyle tahsil et; ürün, stok ve sipariş senkronu, webhook ve kargo bildirimi." },
  { icon: Library, title: "Hazır katalog havuzu", body: "Görselleri, beden tabloları ve açıklamalarıyla hazır yüzlerce ürünü tek tıkla mağazana ekle." },
  { icon: Sparkles, title: "Yapay zekâ açıklamalar", body: "Google Gemini ile her siteye özgün, Türkçe SEO uyumlu ürün başlığı, meta açıklama ve açıklama üret." },
  { icon: Search, title: "Türkiye odaklı SEO", body: "Her site ayrı indekslenir: benzersiz metinler, sitemap, yapılandırılmış veri, yerel SEO ve Google ürün feed'i." },
  { icon: Globe, title: "Sınırsız alan adı", body: "Kendi alan adını bağla; SSL sertifikası otomatik. Tek panelden birden fazla markayı yönet." },
  { icon: Bell, title: "Bildirim ve e-posta", body: "Yeni sipariş, mesaj ve stok uyarıları; sitene özel SMTP ile müşterilere kendi alan adından e-posta." },
  { icon: Smartphone, title: "Mobil öncelikli", body: "Vitrin ve yönetim paneli telefonda kusursuz; mobil sepete ekle çubuğu, hızlı ödeme." },
];

const FAQ = [
  ["Shopier hesabım yeterli mi?", "Evet. Ödemeler senin Shopier hesabına yatar. Bir Shopier hesabına ödeme modülüyle 5 siteye kadar bağlanabilir; daha fazla site için ek Shopier hesabı ekleyebilirsin."],
  ["Teknik bilgi gerekiyor mu?", "Hayır. Tema seçip site adını yazman yeterli; slider, kampanyalar, yasal sayfalar ve blog yazıları hazır gelir. Katalog havuzundan ürünleri tek tıkla eklersin."],
  ["Aynı ürünleri birden fazla sitede satarsam Google cezalandırır mı?", "Her site, aynı ürün için farklı cümlelerle yazılmış kendi başlık ve açıklamasını kullanır; istersen yapay zekâ ile tamamen özgün metin de üretebilirsin."],
  ["Kendi alan adımı kullanabilir miyim?", "Evet. Alan adının DNS kaydını yönlendirmen yeterli; SSL sertifikası otomatik oluşturulur. Ayrıca her site ücretsiz bir alt alan adıyla da yayınlanır."],
  ["Deneme süresinde ödeme alabilir miyim?", "Evet. Deneme süresinde tüm özellikler açıktır; Shopier hesabını bağlayıp gerçek satış yapabilirsin."],
  ["İstediğim zaman iptal edebilir miyim?", "Evet, taahhüt yoktur. Aylık ya da indirimli yıllık paketlerden dilediğini seçebilirsin."],
];

export default async function LandingPage() {
  const general = await getPlatformSetting("general");
  const name = general.platformName;
  const demoSites = await db
    .select({ id: schema.sites.id, slug: schema.sites.slug, theme: schema.sites.theme, name: schema.sites.name })
    .from(schema.sites)
    .where(eq(schema.sites.status, "active"))
    .orderBy(asc(schema.sites.id));
  const domains = demoSites.length ? await db.select().from(schema.siteDomains).where(inArray(schema.siteDomains.siteId, demoSites.map((s) => s.id))) : [];
  const demoFor = (theme: string) => {
    const s = demoSites.find((x) => x.theme === theme);
    return s ? siteUrl(s.slug, domains.filter((d) => d.siteId === s.id)) : null;
  };
  const prices = await Promise.all(Object.values(PLANS).map(async (p) => ({ key: p.key, y: await planPrice(p.key, 12) })));
  const productCount = await db.$count(schema.products, and(eq(schema.products.catalogKey, "pool"), eq(schema.products.active, true)));
  const cta = general.signupOpen ? "/panel/kayit" : general.supportEmail ? `mailto:${general.supportEmail}?subject=${encodeURIComponent(`${name} demo talebi`)}` : "/panel/giris";
  const ctaLabel = general.signupOpen ? `${general.trialDays} gün ücretsiz dene` : "Demo talep et";

  return (
    <div className="bg-white font-sans text-zinc-900">
      <header className="sticky top-0 z-40 border-b border-zinc-100 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
          <Link href="/" className="text-lg font-black tracking-tight">
            SNEAKER<span className="text-orange-500">OS</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-zinc-600 md:flex">
            <a href="#ozellikler" className="hover:text-zinc-900">
              Özellikler
            </a>
            <a href="#temalar" className="hover:text-zinc-900">
              Temalar
            </a>
            <a href="#fiyatlar" className="hover:text-zinc-900">
              Fiyatlar
            </a>
            <a href="#sss" className="hover:text-zinc-900">
              SSS
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/panel/giris" className="hidden h-10 items-center rounded-lg px-4 text-sm font-semibold hover:bg-zinc-100 sm:inline-flex">
              Giriş yap
            </Link>
            <a href={cta} className="inline-flex h-10 items-center rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white">
              {general.signupOpen ? "Ücretsiz dene" : "Demo talep et"}
            </a>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-zinc-950 text-white">
        <div className="pointer-events-none absolute -left-40 -top-40 h-[480px] w-[480px] rounded-full bg-orange-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-40 top-40 h-[420px] w-[420px] rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 md:px-8 md:py-24 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-300">
              <Store size={14} /> Shopier satıcıları için e-ticaret altyapısı
            </p>
            <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight md:text-6xl">
              Shopier mağazan için <span className="bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">profesyonel sneaker siteleri</span>, dakikalar içinde.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-zinc-400">
              10 hazır tema, görselleriyle hazır katalog, yapay zekâ ile özgün ürün açıklamaları ve Türkçe SEO. Tek panelden sınırsız site kur, siparişlerini Shopier ile al.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={cta} className="inline-flex h-12 items-center gap-2 rounded-xl bg-orange-500 px-6 font-semibold text-white hover:bg-orange-600">
                {ctaLabel} <ArrowRight size={18} />
              </a>
              <a href="#temalar" className="inline-flex h-12 items-center rounded-xl border border-white/20 px-6 font-semibold hover:bg-white/10">
                Temaları incele
              </a>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-400">
              {["Kurulum ücreti yok", "Kart bilgisi gerekmez", "Taahhüt yok"].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <Check size={15} className="text-emerald-400" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="grid grid-cols-2 gap-3 [transform:perspective(1400px)_rotateY(-8deg)_rotateX(4deg)]">
              {(["volt", "metro", "luxe", "outlet"] as const).map((k, i) => (
                <div key={k} className={`overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-white/10 ${i % 2 ? "translate-y-6" : ""}`}>
                  <div className="flex h-5 items-center gap-1 bg-zinc-100 px-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </div>
                  <ThemeThumb theme={k} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="relative border-t border-white/10">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 text-center md:grid-cols-4 md:px-8">
            {[
              [`${THEME_KEYS.length}`, "hazır mağaza teması"],
              [`${productCount}+`, "hazır katalog ürünü"],
              ["5", "site / Shopier hesabı"],
              ["%100", "Türkçe ve mobil uyumlu"],
            ].map(([v, l]) => (
              <div key={l}>
                <p className="text-3xl font-black">{v}</p>
                <p className="mt-1 text-sm text-zinc-400">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="ozellikler" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 md:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-orange-600">Özellikler</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Satmaya başlamak için gereken her şey hazır</h2>
          <p className="mt-3 text-zinc-600">Tasarım, katalog, ödeme, SEO, e-posta ve bildirimler: hepsi tek panelde.</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-zinc-200 p-6 transition-shadow hover:shadow-lg">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-zinc-900 text-white">
                <Icon size={20} />
              </span>
              <h3 className="mt-4 font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="temalar" className="scroll-mt-20 bg-zinc-50 py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-widest text-orange-600">Temalar</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">{THEME_KEYS.length} farklı mağaza tasarımı</h2>
              <p className="mt-3 text-zinc-600">Her temanın header, ana sayfa kurgusu, ürün kartı ve ürün sayfası farklı. Tek tıkla değiştir, uygulamadan önce kendi ürünlerinle önizle.</p>
            </div>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {THEME_KEYS.map((k) => {
              const t = THEMES[k];
              const demo = demoFor(k);
              return (
                <div key={k} className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white">
                  <ThemeThumb theme={k} />
                  <div className="flex flex-1 flex-col p-4">
                    <p className="font-bold">{t.name}</p>
                    <p className="text-xs font-medium text-orange-600">{t.tagline}</p>
                    <p className="mt-2 line-clamp-3 flex-1 text-xs text-zinc-600">{t.description}</p>
                    {demo && (
                      <a href={demo} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold hover:underline">
                        Canlı demo <ArrowRight size={14} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 md:px-8">
        <div className="grid gap-12 lg:grid-cols-3">
          {[
            { icon: CreditCard, t: "Shopier ile güvenli ödeme", d: "Müşterilerin kartla, taksitli ve 3D Secure ile öder; para doğrudan Shopier hesabına geçer. Stok, sipariş ve kargo takip bilgisi Shopier ile senkron." },
            { icon: Sparkles, t: "Her siteye özgün metin", d: "Aynı ürünü farklı sitelerde satarken Google'da kopya içerik riski yok: metin motoru ve Gemini ile her siteye farklı başlık ve açıklama." },
            { icon: BarChart3, t: "Siparişten kargoya tek ekran", d: "Siparişi hazırla, takip numarasını gir, müşteriye otomatik e-posta gitsin. Günlük satış özeti her sabah e-postanda." },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t}>
              <Icon className="text-orange-500" size={28} />
              <h3 className="mt-4 text-xl font-bold">{t}</h3>
              <p className="mt-2 text-zinc-600">{d}</p>
            </div>
          ))}
        </div>
        <div className="mt-16 grid gap-6 rounded-3xl bg-zinc-950 p-8 text-white md:grid-cols-3 md:p-12">
          {[
            ["1", "Tema seç, siteni kur", "Site adını yaz, temayı seç. Slider, kampanyalar, yasal sayfalar ve blog hazır gelir."],
            ["2", "Ürünlerini ekle", "Katalog havuzundan görselleriyle hazır ürünleri ekle ya da Shopier'deki ürünlerini içe aktar."],
            ["3", "Shopier'i bağla, satışa başla", "API bilgilerini gir, alan adını yönlendir. SSL otomatik; siparişler panele düşsün."],
          ].map(([n, t, d]) => (
            <div key={n}>
              <span className="grid h-10 w-10 place-items-center rounded-full bg-orange-500 font-black">{n}</span>
              <h3 className="mt-4 text-lg font-bold">{t}</h3>
              <p className="mt-2 text-sm text-zinc-400">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="fiyatlar" className="scroll-mt-20 bg-zinc-50 py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-orange-600">Fiyatlar</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">İşine uygun paketi seç</h2>
            <p className="mt-3 text-zinc-600">Tüm paketlerde {general.trialDays} gün ücretsiz deneme. Yıllık alımda indirim.</p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {Object.values(PLANS).map((p) => {
              const featured = p.key === "pro";
              const y = prices.find((x) => x.key === p.key)!.y;
              return (
                <div key={p.key} className={`relative flex flex-col rounded-3xl border-2 bg-white p-8 ${featured ? "border-zinc-900 shadow-2xl lg:-translate-y-2" : "border-zinc-200"}`}>
                  {featured && <span className="absolute -top-3 left-8 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white">En çok tercih edilen</span>}
                  <h3 className="text-xl font-bold">{p.name}</h3>
                  <p className="mt-4 text-4xl font-black">
                    {p.priceMonthly.toLocaleString("tr-TR")} ₺<span className="text-base font-medium text-zinc-500"> / ay</span>
                  </p>
                  {y.discount > 0 && <p className="mt-1 text-sm text-emerald-700">Yıllık {formatPrice(y.amount)} · {formatPrice(y.discount)} tasarruf</p>}
                  <ul className="mt-6 flex-1 space-y-3 text-sm">
                    {p.features.map((f) => (
                      <li key={f} className="flex gap-2">
                        <Check size={17} className="mt-0.5 shrink-0 text-emerald-600" /> {f}
                      </li>
                    ))}
                  </ul>
                  <a href={general.signupOpen ? `/panel/kayit?paket=${p.key}` : cta} className={`mt-8 inline-flex h-12 items-center justify-center rounded-xl font-semibold ${featured ? "bg-zinc-900 text-white" : "border-2 border-zinc-900"}`}>
                    {general.signupOpen ? "Ücretsiz dene" : "Demo talep et"}
                  </a>
                </div>
              );
            })}
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-zinc-600">
            <span className="flex items-center gap-2">
              <ShieldCheck size={16} /> Shopier güvenli ödeme
            </span>
            <span className="flex items-center gap-2">
              <Layers size={16} /> Otomatik SSL
            </span>
            <span className="flex items-center gap-2">
              <Truck size={16} /> Kargo takip ve bildirim
            </span>
            <span className="flex items-center gap-2">
              <Mail size={16} /> Siteye özel e-posta (SMTP)
            </span>
          </div>
        </div>
      </section>

      <section id="sss" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-20 md:px-8">
        <h2 className="text-center text-3xl font-black tracking-tight md:text-4xl">Sık sorulan sorular</h2>
        <div className="mt-10 divide-y divide-zinc-200 border-y border-zinc-200">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {q}
                <span className="text-xl text-zinc-400 transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-zinc-600">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="px-4 pb-20 md:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 to-rose-600 p-10 text-white md:p-16">
          <h2 className="max-w-2xl text-3xl font-black tracking-tight md:text-5xl">Sneaker mağazanı bugün yayına al.</h2>
          <p className="mt-4 max-w-xl text-white/85">İlk siteni dakikalar içinde kur, ürünlerini ekle ve Shopier ile satışa başla.</p>
          <a href={cta} className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 font-semibold text-zinc-900">
            {ctaLabel} <ArrowRight size={18} />
          </a>
        </div>
      </section>

      <footer className="border-t border-zinc-200">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-zinc-500 md:flex-row md:px-8">
          <p>
            © {new Date().getFullYear()} {name}. Tüm hakları saklıdır.
          </p>
          <div className="flex gap-5">
            <Link href="/panel/giris" className="hover:text-zinc-900">
              Satıcı girişi
            </Link>
            {general.supportEmail && (
              <a href={`mailto:${general.supportEmail}`} className="hover:text-zinc-900">
                {general.supportEmail}
              </a>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
