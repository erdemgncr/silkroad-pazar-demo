import { siteSettingsSchema, type SiteSettings } from "@/lib/site-settings";
import { THEMES, type ThemeKey } from "@/themes/registry";
import { hashString } from "@/lib/format";

/** Yeni oluşturulan site için eksiksiz varsayılan içerik üretir. Panelden her alan değiştirilebilir. */
export function defaultSettings(opts: { name: string; slug: string; theme: ThemeKey; city?: string }): SiteSettings {
  const t = THEMES[opts.theme];
  const seed = hashString(opts.slug) % 100000;
  const img = (k: string, w = 1920, h = 900) => `https://picsum.photos/seed/${opts.slug}-${k}/${w}/${h}`;
  const domainGuess = `${opts.slug}.com`;
  const heroByTheme: Record<ThemeKey, SiteSettings["heroSlides"]> = {
    urban: [
      { eyebrow: "Yeni Sezon", title: "Sokağın Yeni Kuralları", subtitle: "Air Force 1'dan Samba'ya, sezonun en çok aranan modelleri stokta.", cta: "Yeni Gelenleri Keşfet", href: "/yeni-gelenler", image: img("hero-1"), bg: "#111111", fg: "#ffffff" },
      { eyebrow: "Sadece Online", title: "Sepette Ekstra %15", subtitle: "Seçili sneaker modellerinde sepette ekstra indirim fırsatını kaçırma.", cta: "İndirimleri Gör", href: "/indirim", image: img("hero-2"), bg: "#ff4d00", fg: "#ffffff" },
      { eyebrow: "Retro Koşu", title: "New Balance 9060", subtitle: "99X mirası, cesur orantılar. Yeni renkler şimdi mağazada.", cta: "Şimdi Al", href: "/marka/new-balance", image: img("hero-3"), bg: "#e8e4dc", fg: "#111111" },
    ],
    arena: [
      { eyebrow: "Kampanya", title: "2. Üründe %30 İndirim", subtitle: "Tüm sneaker kategorisinde geçerli, sepette otomatik uygulanır.", cta: "Alışverişe Başla", href: "/sneaker", image: img("hero-1"), bg: "#0b1f44", fg: "#ffffff" },
      { eyebrow: "Yeni", title: "Terrace Klasikleri", subtitle: "Samba, Gazelle ve Speedcat ile sezonun ruhunu yakala.", cta: "Koleksiyonu Gör", href: "/yeni-gelenler", image: img("hero-2"), bg: "#ffd400", fg: "#0b1f44" },
      { eyebrow: "Çocuk", title: "Okula Dönüş Seçkisi", subtitle: "Çocuklar için rahat ve dayanıklı modeller.", cta: "Çocuk Ürünleri", href: "/cocuk", image: img("hero-3"), bg: "#e30613", fg: "#ffffff" },
    ],
    neon: [
      { eyebrow: "Drop 04", title: "Limitli Seri Yayında", subtitle: "Stoklar sınırlı. Bedenini kaptırmadan sepete ekle.", cta: "Drop'u Gör", href: "/yeni-gelenler", image: img("hero-1"), bg: "#0a0a0a", fg: "#c6ff00" },
      { eyebrow: "Yakında", title: "Takvimi Takip Et", subtitle: "Çıkış tarihi yaklaşan modeller ve 'Gelince Haber Ver' listesi.", cta: "Drop Takvimi", href: "/yakinda", image: img("hero-2"), bg: "#111111", fg: "#ffffff" },
    ],
    studio: [
      { eyebrow: "Sonbahar Seçkisi", title: "Sade. Zamansız. Rafine.", subtitle: "Editörlerimizin seçtiği premium sneaker ve tamamlayıcı parçalar.", cta: "Seçkiyi İncele", href: "/cok-satanlar", image: img("hero-1"), bg: "#efe9df", fg: "#1c1917" },
      { eyebrow: "Yeni", title: "Süet Mevsimi", subtitle: "Toprak tonlarında süet modeller ve el işçiliği detaylar.", cta: "Keşfet", href: "/yeni-gelenler", image: img("hero-2"), bg: "#d6c7b0", fg: "#1c1917" },
    ],
    pulse: [
      { eyebrow: "Koşuya Hazır", title: "Her Adımda Daha Hızlı", subtitle: "Pegasus, Clifton ve Nimbus: yeni sezon koşu ayakkabıları.", cta: "Koşu Ayakkabıları", href: "/kosu-ayakkabisi", image: img("hero-1"), bg: "#1d4ed8", fg: "#ffffff" },
      { eyebrow: "Fırsat", title: "Haftanın Fırsatları", subtitle: "Seçili ürünlerde %40'a varan indirim.", cta: "Fırsatları Gör", href: "/indirim", image: img("hero-2"), bg: "#f97316", fg: "#ffffff" },
      { eyebrow: "Basketbol", title: "Sahaya Çık", subtitle: "Luka, Giannis ve MB serisi basketbol ayakkabıları.", cta: "Basketbol", href: "/basketbol-ayakkabisi", image: img("hero-3"), bg: "#111827", fg: "#ffffff" },
    ],
    volt: [
      { eyebrow: "Yeni Sezon", title: "Adımını Büyük At", subtitle: "Sezonun en çok konuşulan modelleri, sınırlı bedenlerle stokta.", cta: "Keşfet", href: "/yeni-gelenler", image: img("hero-1"), bg: "#111111", fg: "#ffffff" },
      { eyebrow: "Online Özel", title: "Retro Koşu Günleri", subtitle: "9060, 2002R ve Gel-1130: arşivden gelen silüetler.", cta: "Modelleri Gör", href: "/sneaker", image: img("hero-2"), bg: "#1f1bff", fg: "#ffffff" },
      { eyebrow: "İndirim", title: "Sezon Sonu Fırsatları", subtitle: "Seçili modellerde %40'a varan indirim.", cta: "Alışverişe Başla", href: "/indirim", image: img("hero-3"), bg: "#e11d2e", fg: "#ffffff" },
    ],
    metro: [
      { eyebrow: "Uygulamaya Özel", title: "Seçili Ürünlerde %15 İndirim", subtitle: "Trend modellerde sepette ekstra indirim fırsatı.", cta: "Hemen Keşfet", href: "/cok-satanlar", image: img("hero-1"), bg: "#111111", fg: "#ffffff" },
      { eyebrow: "Yeni Sezon", title: "Trend Modeller Burada", subtitle: "Samba, 9060, Dunk ve daha fazlası yeni renkleriyle.", cta: "Yeni Gelenler", href: "/yeni-gelenler", image: img("hero-2"), bg: "#d0021b", fg: "#ffffff" },
      { eyebrow: "Çocuk", title: "Minik Adımlar, Büyük Stil", subtitle: "Çocuklar için rahat ve dayanıklı sneakerlar.", cta: "Çocuk Ürünleri", href: "/cocuk", image: img("hero-3"), bg: "#f4f4f4", fg: "#111111" },
    ],
    brut: [
      { eyebrow: "Drop 07", title: "Sokak Senin. Kuralları Sen Koy.", subtitle: "Streetwear'in en sert parçaları ve ikonik sneakerlar.", cta: "Drop'u Gör", href: "/yeni-gelenler", image: img("hero-1"), bg: "#ffe600", fg: "#0a0a0a" },
    ],
    luxe: [
      { eyebrow: "Özel Koleksiyon", title: "Nadir Olanın Adresi", subtitle: "Sınırlı üretim modeller, orijinallik garantisiyle ve özenle paketlenerek kapında.", cta: "Koleksiyonu Keşfet", href: "/yeni-gelenler", image: img("hero-1"), bg: "#0b0b0c", fg: "#f3efe6" },
    ],
    outlet: [
      { eyebrow: "Büyük Outlet", title: "%70'e Varan İndirim", subtitle: "Binlerce üründe sezonun en düşük fiyatları.", cta: "Fırsatları Gör", href: "/indirim", image: img("hero-1"), bg: "#ff6000", fg: "#ffffff" },
      { eyebrow: "Sadece Bugün", title: "Sepette Ekstra İndirim", subtitle: "Seçili markalarda sepette ek indirim.", cta: "Alışverişe Başla", href: "/indirim", image: img("hero-2"), bg: "#e3001b", fg: "#ffffff" },
      { eyebrow: "Yeni Eklenenler", title: "Outlet'e Yeni Gelenler", subtitle: "Her gün yeni ürünler outlet fiyatlarıyla.", cta: "Keşfet", href: "/yeni-gelenler", image: img("hero-3"), bg: "#1b1b1b", fg: "#ffffff" },
    ],
  };
  return siteSettingsSchema.parse({
    tagline: "Orijinal sneaker, spor giyim ve aksesuar",
    logoText: opts.name,
    colors: t.defaults,
    announcements: [
      "1.500 TL ve üzeri siparişlerde ücretsiz kargo",
      "14 gün içinde ücretsiz iade ve değişim",
      "Tüm kartlara 12 aya varan taksit",
      "%100 orijinal ve faturalı ürünler",
    ],
    heroSlides: heroByTheme[opts.theme],
    promoBanners: [
      { title: "Erkek Sneaker", subtitle: "Sezonun ikonik modelleri", cta: "Keşfet", href: "/erkek-sneaker", image: img("promo-1", 1200, 900), bg: "#f2f2f2", fg: "#111111" },
      { title: "Kadın Sneaker", subtitle: "Yeni renkler, yeni formlar", cta: "Keşfet", href: "/kadin-sneaker", image: img("promo-2", 1200, 900), bg: "#f2f2f2", fg: "#111111" },
      { title: "Çocuk Koleksiyonu", subtitle: "Minik adımlar için büyük stil", cta: "Keşfet", href: "/cocuk", image: img("promo-3", 1200, 900), bg: "#f2f2f2", fg: "#111111" },
      { title: "Outlet Fırsatları", subtitle: "%40'a varan indirim", cta: "İndirimleri Gör", href: "/indirim", image: img("promo-4", 1200, 900), bg: "#111111", fg: "#ffffff" },
    ],
    contact: {
      phone: "0850 000 00 00",
      email: `destek@${domainGuess}`,
      whatsapp: "905000000000",
      address: "Örnek Mah. Sneaker Sok. No: 1",
      district: "Kadıköy",
      city: opts.city ?? "İstanbul",
      postcode: "34710",
      workingHours: "Hafta içi 09:00 - 18:00, Cumartesi 10:00 - 16:00",
      mapEmbedUrl: "",
    },
    social: { instagram: `https://instagram.com/${opts.slug}`, tiktok: `https://tiktok.com/@${opts.slug}`, x: "", facebook: "", youtube: "" },
    company: {
      legalName: `${opts.name} E-Ticaret Ltd. Şti.`,
      taxOffice: "Kadıköy Vergi Dairesi",
      taxNumber: "0000000000",
      mersisNo: "0000000000000000",
      kepAddress: "",
      address: "Örnek Mah. Sneaker Sok. No: 1, Kadıköy / İstanbul",
    },
    seo: {
      homeTitle: `${opts.name} | Orijinal Sneaker ve Spor Ayakkabı Modelleri`,
      homeDescription: `Nike, adidas, New Balance, Puma ve daha fazlası ${opts.name} güvencesinde. Orijinal sneaker, spor giyim ve aksesuarlar; ücretsiz kargo ve 14 gün kolay iade.`,
      titleSuffix: opts.name,
      keywords: ["sneaker", "spor ayakkabı", "erkek sneaker", "kadın sneaker", "orijinal spor ayakkabı"],
      targetCity: opts.city ?? "",
      seed,
    },
    about: `${opts.name}, sneaker kültürünü seven bir ekip tarafından kuruldu. Amacımız dünyanın önde gelen markalarının orijinal ürünlerini, doğru fiyat ve hızlı teslimatla Türkiye'nin her yerine ulaştırmak.`,
    footerText: `${opts.name}; orijinal sneaker, spor giyim ve aksesuar ürünlerini güvenli ödeme ve hızlı kargo ile sunar.`,
  });
}
