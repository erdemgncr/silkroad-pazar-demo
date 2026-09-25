import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq, sql } from "drizzle-orm";
import { ArrowRight, Check, Globe, Library, Plug, Search, Sparkles, Star } from "lucide-react";
import { db, schema } from "@/db";
import { PLANS } from "@/lib/plans";
import { getPlatformSetting } from "@/lib/platform-settings";
import { planPrice } from "@/lib/billing";
import { formatPrice } from "@/lib/format";
import { Wordmark } from "@/components/panel/shell";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const g = await getPlatformSetting("general");
  const title = `${g.platformName} | Shopier satıcıları için sneaker mağazası kur`;
  const description = "Shopier hesabınla dakikalar içinde kendi sneaker mağazanı kur. Kurulum sihirbazı, hazır katalog, yapay zeka ile yönetim ve Türkçe SEO.";
  return { title, description, robots: { index: true, follow: true }, openGraph: { title, description, type: "website", locale: "tr_TR" } };
}

const STEPS = [
  { n: "01", title: "Ücretsiz üye ol", body: "E-posta ve şifrenle hesabını aç. Kart bilgisi istemiyoruz." },
  { n: "02", title: "Sihirbazla mağazanı kur", body: "Mağaza adını yaz, tasarımını seç, ürünlerini hazır katalogdan işaretle." },
  { n: "03", title: "Shopier ile satışa başla", body: "Shopier hesabını bağla; ödemeler doğrudan senin hesabına yatsın." },
];

const FEATURES = [
  { icon: Sparkles, title: "Yazarak yönet", body: "“Tüm fiyatlara %5 zam yap” yaz, yapay zeka değişikliği hazırlasın." },
  { icon: Library, title: "Hazır katalog", body: "Görselleri ve beden tablolarıyla binlerce ürünü tek dokunuşla ekle." },
  { icon: Plug, title: "Shopier entegrasyonu", body: "Ödeme, ürün, stok ve sipariş senkronu hazır." },
  { icon: Search, title: "Türkçe SEO", body: "Her mağazaya özgün metinler, site haritası ve Google ürün feed'i." },
  { icon: Globe, title: "Kendi alan adın", body: "Alan adını bağla, SSL sertifikası otomatik gelsin." },
  { icon: Star, title: "Mobil öncelikli", body: "Mağazan da panelin de telefonda uygulama gibi çalışır." },
];

const FAQ: [string, string][] = [
  ["Shopier hesabım yeterli mi?", "Evet. Ödemeler senin Shopier hesabına yatar. Hesabın yoksa Shopier'de ücretsiz açabilirsin."],
  ["Teknik bilgi gerekiyor mu?", "Hayır. Kurulum sihirbazı mağazanı birkaç adımda hazırlar; sonrasını panelden ya da yapay zekaya yazarak yönetirsin."],
  ["Deneme süresinde satış yapabilir miyim?", "Evet. Deneme süresinde tüm özellikler açık; Shopier hesabını bağlayıp gerçek satış yapabilirsin."],
  ["İstediğim zaman iptal edebilir miyim?", "Evet, taahhüt yok. Aylık ya da indirimli yıllık paket seçebilirsin."],
];

const TILE_BG = [
  "from-amber-100 to-orange-200",
  "from-sky-100 to-indigo-200",
  "from-rose-100 to-pink-200",
  "from-lime-100 to-emerald-200",
  "from-violet-100 to-fuchsia-200",
  "from-zinc-100 to-zinc-300",
];

export default async function LandingPage() {
  const general = await getPlatformSetting("general");
  const name = general.platformName;
  const images = (
    await db
      .select({ url: sql<string | null>`${schema.products.images}->0->>'url'` })
      .from(schema.products)
      .where(and(eq(schema.products.catalogKey, "pool"), eq(schema.products.active, true)))
      .orderBy(desc(schema.products.isFeatured), desc(schema.products.popularity))
      .limit(24)
  )
    .map((r) => r.url)
    .filter((u): u is string => Boolean(u));
  const cols = [0, 1, 2].map((c) => images.filter((_, i) => i % 3 === c));
  const prices = await Promise.all(Object.values(PLANS).map(async (p) => ({ key: p.key, y: (await planPrice(p.key, 12)).amount })));
  const signup = general.signupOpen ? "/panel/kayit" : general.supportEmail ? `mailto:${general.supportEmail}?subject=${encodeURIComponent(`${name} hesap talebi`)}` : "/panel/giris";
  const signupLabel = general.signupOpen ? "Ücretsiz üye ol" : "Hesap talep et";

  return (
    <div className="glass-page min-h-screen overflow-x-hidden">
      {/* Üst şerit */}
      <div className="bg-zinc-900 text-white">
        <div className="mx-auto flex h-9 max-w-[1240px] items-end gap-1 px-4 md:px-8">
          <span className="rounded-t-lg bg-[#f6f7f9] px-4 py-1.5 text-xs font-semibold text-zinc-900">Satıcılar için</span>
          <a href="#nasil" className="px-4 py-1.5 text-xs font-semibold text-white/80 hover:text-white">
            Nasıl çalışır?
          </a>
        </div>
      </div>

      <header className="relative z-20">
        <div className="mx-auto flex h-20 max-w-[1240px] items-center gap-6 px-4 md:px-8">
          <Link href="/" className="text-[26px] md:text-[30px]">
            <Wordmark />
          </Link>
          <nav className="hidden items-center gap-8 text-[15px] font-medium md:flex">
            <a href="#nasil" className="hover:text-zinc-500">
              Nedir?
            </a>
            <a href="#fiyat" className="hover:text-zinc-500">
              Fiyatlandırma
            </a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/panel/giris" className="inline-flex h-11 items-center rounded-full border-[1.5px] border-zinc-900 bg-white/60 px-5 text-[15px] font-semibold backdrop-blur hover:bg-white">
              Giriş yap
            </Link>
            <Link href={signup} className="hidden h-11 items-center rounded-full bg-zinc-900 px-5 text-[15px] font-semibold text-white shadow-[0_10px_24px_-10px_rgba(0,0,0,0.6)] sm:inline-flex">
              {signupLabel}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="mx-auto grid max-w-[1240px] gap-10 px-4 pb-16 pt-6 md:px-8 lg:min-h-[640px] lg:grid-cols-[1fr_1fr] lg:items-center lg:pb-24">
          <div className="relative z-10">
            <h1 className="text-[46px] font-[800] leading-[1.02] tracking-[-0.045em] md:text-[72px]">Senin sneaker mağazan!</h1>
            <p className="mt-5 max-w-[520px] text-[18px] leading-relaxed text-zinc-600 md:text-[21px]">
              Shopier hesabınla dakikalar içinde kendi mağazanı kur. Sihirbaz tasarımı ve ürünleri hazırlar, sen satışa odaklan.
            </p>
            {general.signupOpen ? (
              <form action="/panel/kayit" className="glass-strong mt-8 flex max-w-[520px] items-center gap-2 rounded-full p-1.5 pl-5">
                <input name="magaza" required minLength={2} placeholder="Mağazanın adı" aria-label="Mağazanın adı" className="h-12 min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-zinc-400" />
                <button type="submit" className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-zinc-900 px-5 text-[15px] font-semibold text-white">
                  Hemen başla <ArrowRight size={17} />
                </button>
              </form>
            ) : (
              <Link href={signup} className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-zinc-900 px-6 text-[15px] font-semibold text-white">
                {signupLabel} <ArrowRight size={17} />
              </Link>
            )}
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-zinc-600">
              <span className="flex items-center gap-1.5">
                <Check size={16} /> {general.trialDays} gün ücretsiz
              </span>
              <span className="flex items-center gap-1.5">
                <Check size={16} /> Kart bilgisi gerekmez
              </span>
              <span className="flex items-center gap-1.5">
                <Check size={16} /> Shopier ile ödeme
              </span>
            </div>
            <p className="mt-8 flex items-center gap-2 text-sm text-zinc-500">
              <span className="flex text-zinc-900">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} size={16} fill="currentColor" />
                ))}
              </span>
              Zaten hesabın var mı?
              <Link href="/panel/giris" className="font-semibold text-zinc-900 underline underline-offset-4">
                Giriş yap
              </Link>
            </p>
          </div>

          {/* Eğik ürün kolajı */}
          <div className="relative h-[420px] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_12%,black_82%,transparent)] md:h-[560px] lg:absolute lg:inset-y-0 lg:right-0 lg:h-auto lg:w-[52%]">
            <div className="absolute -inset-x-10 -top-24 bottom-[-6rem] flex rotate-[-10deg] justify-center gap-5">
              {cols.map((col, ci) => (
                <div key={ci} className={`landing-col flex w-[46%] max-w-[230px] flex-col gap-5 ${ci === 1 ? "landing-col-rev" : ""}`}>
                  {[...col, ...col].map((src, i) => (
                    <div key={i} className={`aspect-[4/3.2] shrink-0 overflow-hidden rounded-[28px] bg-gradient-to-br p-3 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.35)] ${TILE_BG[(i + ci * 2) % TILE_BG.length]}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" loading={i < 3 ? "eager" : "lazy"} className="h-full w-full rounded-[20px] object-cover mix-blend-multiply" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Nasıl çalışır */}
      <section id="nasil" className="scroll-mt-10">
        <div className="mx-auto max-w-[1240px] px-4 py-16 md:px-8 md:py-24">
          <h2 className="text-[34px] font-[800] tracking-[-0.04em] md:text-[48px]">Üç adımda mağazan hazır.</h2>
          <p className="mt-3 max-w-2xl text-lg text-zinc-600">{name}, Shopier satıcılarının kendi markalı sneaker mağazasını kurup tek panelden yönetmesini sağlar.</p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="glass rounded-[28px] p-7">
                <span className="font-mono text-sm text-zinc-400">{s.n}</span>
                <h3 className="mt-6 text-xl font-semibold tracking-tight">{s.title}</h3>
                <p className="mt-2 text-zinc-600">{s.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: I, title, body }) => (
              <div key={title} className="flex gap-4 rounded-[24px] border border-white/70 bg-white/40 p-5 backdrop-blur">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-black/5 bg-white">
                  <I size={19} strokeWidth={1.7} />
                </span>
                <span>
                  <span className="block font-semibold">{title}</span>
                  <span className="block text-sm text-zinc-600">{body}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fiyatlandırma */}
      <section id="fiyat" className="scroll-mt-10">
        <div className="mx-auto max-w-[1240px] px-4 py-16 md:px-8 md:py-24">
          <h2 className="text-[34px] font-[800] tracking-[-0.04em] md:text-[48px]">Fiyatlandırma</h2>
          <p className="mt-3 text-lg text-zinc-600">
            Tüm paketlerde {general.trialDays} gün ücretsiz deneme. Yıllık ödemede indirim.
          </p>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {Object.values(PLANS).map((p) => {
              const hot = p.key === "pro";
              const y = prices.find((x) => x.key === p.key)?.y ?? p.priceMonthly * 12 * 100;
              return (
                <div key={p.key} className={`flex flex-col rounded-[28px] p-7 ${hot ? "bg-zinc-900 text-white shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)]" : "glass"}`}>
                  <p className="flex items-center justify-between text-lg font-semibold">
                    {p.name}
                    {hot && <span className="rounded-full bg-white/15 px-3 py-1 text-xs">En çok tercih edilen</span>}
                  </p>
                  <p className="mt-5 text-[44px] font-[800] tracking-[-0.04em]">
                    {p.priceMonthly.toLocaleString("tr-TR")} ₺<span className={`text-base font-medium ${hot ? "text-white/60" : "text-zinc-500"}`}> /ay</span>
                  </p>
                  <p className={`text-sm ${hot ? "text-white/60" : "text-zinc-500"}`}>Yıllık {formatPrice(y)}</p>
                  <ul className="mt-6 flex-1 space-y-2.5 text-[15px]">
                    {p.features.map((f) => (
                      <li key={f} className="flex gap-2">
                        <Check size={17} className="mt-0.5 shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={general.signupOpen ? `/panel/kayit?paket=${p.key}` : signup}
                    className={`mt-8 inline-flex h-12 items-center justify-center rounded-full text-[15px] font-semibold ${hot ? "bg-white text-zinc-900" : "border-[1.5px] border-zinc-900 hover:bg-white"}`}
                  >
                    {general.signupOpen ? "Ücretsiz başla" : signupLabel}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SSS */}
      <section className="mx-auto max-w-[900px] px-4 pb-16 md:px-8">
        <h2 className="text-2xl font-[800] tracking-[-0.03em]">Sık sorulanlar</h2>
        <div className="mt-6 divide-y divide-black/5 rounded-[28px] border border-white/70 bg-white/50 backdrop-blur">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group px-6 py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {q}
                <span className="text-xl text-zinc-400 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 text-zinc-600">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Son çağrı */}
      <section className="mx-auto max-w-[1240px] px-4 pb-16 md:px-8">
        <div className="relative overflow-hidden rounded-[36px] bg-zinc-900 px-8 py-14 text-white md:px-14">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_30%_30%,#fff,#9ca3af_45%,#3f3f46_80%)] opacity-40 blur-[2px]" />
          <h2 className="relative max-w-xl text-[32px] font-[800] leading-tight tracking-[-0.04em] md:text-[44px]">Mağazan birkaç dakika uzağında.</h2>
          <div className="relative mt-8 flex flex-wrap gap-3">
            <Link href={signup} className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[15px] font-semibold text-zinc-900">
              {signupLabel} <ArrowRight size={17} />
            </Link>
            <Link href="/panel/giris" className="inline-flex h-12 items-center rounded-full border-[1.5px] border-white/40 px-6 text-[15px] font-semibold">
              Giriş yap
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-black/5">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-3 px-4 py-8 text-sm text-zinc-500 md:px-8">
          <span>
            © {new Date().getFullYear()} {name}
          </span>
          <span className="flex gap-5">
            <Link href="/panel/giris" className="hover:text-zinc-900">
              Satıcı girişi
            </Link>
            {general.supportEmail && (
              <a href={`mailto:${general.supportEmail}`} className="hover:text-zinc-900">
                {general.supportEmail}
              </a>
            )}
          </span>
        </div>
      </footer>
    </div>
  );
}
