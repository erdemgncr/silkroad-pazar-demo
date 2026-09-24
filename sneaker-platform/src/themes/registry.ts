/**
 * Mağaza temaları. Her tema kendi header, ana sayfa, ürün kartı ve ürün sayfası düzenine sahiptir.
 * "family" alanı; sepet, filtre, ödeme gibi ortak bileşenlerin hangi temel stil ailesiyle çizileceğini belirler.
 */
export const STYLE_KEYS = ["urban", "arena", "neon", "studio", "pulse"] as const;
export type StyleKey = (typeof STYLE_KEYS)[number];

export const THEME_KEYS = ["urban", "arena", "neon", "studio", "pulse", "volt", "metro", "brut", "luxe", "outlet"] as const;
export type ThemeKey = (typeof THEME_KEYS)[number];

export type ThemeMeta = {
  key: ThemeKey;
  name: string;
  tagline: string;
  description: string;
  family: StyleKey;
  /** Panelde gösterilen örnek renkler ve yeni site oluştururken önerilen varsayılanlar. */
  defaults: { primary: string; accent: string; sale: string };
  dark: boolean;
  /** Tema seçim ekranındaki öne çıkan özellikler. */
  highlights: string[];
  /** Hangi mağaza tipine uygun olduğu. */
  bestFor: string;
};

export const THEMES: Record<ThemeKey, ThemeMeta> = {
  urban: {
    key: "urban",
    name: "Urban",
    tagline: "Klasik sneaker mağazası",
    description: "Siyah-beyaz, büyük tipografili klasik sneaker mağazası. Tam genişlik slider, mega menü, sol filtre paneli, 2 sütun ürün galerisi.",
    family: "urban",
    defaults: { primary: "#111111", accent: "#ff4d00", sale: "#e11d2e" },
    dark: false,
    highlights: ["Tam ekran slider", "Mega menü", "2 sütun ürün galerisi", "Sol filtre paneli"],
    bestFor: "Çok markalı sneaker mağazaları",
  },
  arena: {
    key: "arena",
    name: "Arena",
    tagline: "Büyük perakende düzeni",
    description: "Çift satırlı header ve geniş arama çubuğu, kampanya ızgarası, üst filtre çubuğu ve hızlı sepete ekleme. Büyük perakende mağaza düzeni.",
    family: "arena",
    defaults: { primary: "#0b1f44", accent: "#ffd400", sale: "#e30613" },
    dark: false,
    highlights: ["Geniş arama çubuğu", "Kampanya ızgarası", "Hızlı sepete ekle", "Sekmeli ürün detayları"],
    bestFor: "Geniş ürün yelpazesi olan spor mağazaları",
  },
  neon: {
    key: "neon",
    name: "Neon",
    tagline: "Hype ve drop mağazası",
    description: "Koyu tema, neon vurgu, kayan yazı bandı ve drop takvimi. Hype/limited ürün satan mağazalar için.",
    family: "neon",
    defaults: { primary: "#c6ff00", accent: "#c6ff00", sale: "#ff2e63" },
    dark: true,
    highlights: ["Koyu tema", "Kayan yazı bandı", "Drop takvimi", "Parlayan ürün kartları"],
    bestFor: "Limited / hype ürün satanlar",
  },
  studio: {
    key: "studio",
    name: "Studio",
    tagline: "Editoryal butik",
    description: "Krem tonlar, serif başlıklar, editoryal düzen. Premium/butik sneaker mağazası görünümü.",
    family: "studio",
    defaults: { primary: "#1c1917", accent: "#9a3412", sale: "#b91c1c" },
    dark: false,
    highlights: ["Serif tipografi", "Editoryal bloklar", "Dikey görsel akışı", "Sade ürün kartları"],
    bestFor: "Butik ve premium mağazalar",
  },
  pulse: {
    key: "pulse",
    name: "Pulse",
    tagline: "Canlı spor mağazası",
    description: "Yuvarlak köşeli, canlı renkli, spor odaklı düzen. Aktivite kategorileri, günün fırsatı sayacı ve uygulama benzeri mobil deneyim.",
    family: "pulse",
    defaults: { primary: "#1d4ed8", accent: "#f97316", sale: "#dc2626" },
    dark: false,
    highlights: ["Uygulama hissi", "Günün fırsatı sayacı", "Kategori baloncukları", "Yuvarlak kartlar"],
    bestFor: "Koşu, fitness ve spor mağazaları",
  },
  volt: {
    key: "volt",
    name: "Volt",
    tagline: "Tam ekran ürün vitrini",
    description:
      "Dar ve kalın başlık fontu, ortalanmış logo ve yarı saydam header. Ürün sayfasında kenardan kenara yatay görsel şeridi ve üzerinde yüzen koyu satın alma kutusu.",
    family: "urban",
    defaults: { primary: "#1f1bff", accent: "#1f1bff", sale: "#e11d2e" },
    dark: false,
    highlights: ["Yatay tam ekran galeri", "Yüzen koyu satın alma kutusu", "Ortalanmış logo", "Dar büyük harf tipografi"],
    bestFor: "Görsel ağırlıklı sneaker mağazaları",
  },
  metro: {
    key: "metro",
    name: "Metro",
    tagline: "Modern AVM mağazası",
    description:
      "Kırmızı logo, üstte kampanya bandı, ortalanmış kategori menüsü. Ürün sayfasında solda dikey küçük görseller, büyük ana görsel, sağda net beden ızgarası ve oval sepet butonu.",
    family: "urban",
    defaults: { primary: "#111111", accent: "#d0021b", sale: "#d0021b" },
    dark: false,
    highlights: ["Dikey küçük görseller", "Model numarası ve renk seçimi", "Beden tavsiyesi", "Oval butonlar"],
    bestFor: "Zincir mağaza görünümü isteyenler",
  },
  brut: {
    key: "brut",
    name: "Brut",
    tagline: "Streetwear / brutalist",
    description: "Kalın siyah çizgiler, sarı vurgu, mono yazı tipi ve ızgara düzeni. Sokak modası ve streetwear markaları için cesur, akılda kalan bir görünüm.",
    family: "urban",
    defaults: { primary: "#111111", accent: "#ffe600", sale: "#ff3b30" },
    dark: false,
    highlights: ["Kalın çerçeveli ızgara", "Mono tipografi", "Sarı vurgu blokları", "Kayan başlıklar"],
    bestFor: "Streetwear ve genç kitle",
  },
  luxe: {
    key: "luxe",
    name: "Luxe",
    tagline: "Premium koyu vitrin",
    description: "Siyah zemin, altın vurgular, ince serif başlıklar ve geniş boşluklar. Nadir ve yüksek fiyatlı modeller için lüks butik deneyimi.",
    family: "neon",
    defaults: { primary: "#c9a45c", accent: "#c9a45c", sale: "#e0654f" },
    dark: true,
    highlights: ["Siyah & altın palet", "İnce serif başlıklar", "Büyük tekli galeri", "Minimal ürün kartları"],
    bestFor: "Premium / koleksiyon ürünler",
  },
  outlet: {
    key: "outlet",
    name: "Outlet",
    tagline: "Kampanya & indirim pazarı",
    description:
      "Turuncu vurgulu, yoğun ürün ızgarası, büyük indirim rozetleri, geri sayımlı fırsatlar ve mobilde alt menü. Kampanya ağırlıklı satış yapan mağazalar için.",
    family: "arena",
    defaults: { primary: "#ff6000", accent: "#ffb400", sale: "#e3001b" },
    dark: false,
    highlights: ["Büyük indirim rozetleri", "Geri sayımlı fırsatlar", "Mobil alt menü", "5 sütun yoğun ızgara"],
    bestFor: "İndirim ve outlet satışları",
  },
};

export function isThemeKey(v: string): v is ThemeKey {
  return (THEME_KEYS as readonly string[]).includes(v);
}

/** Ortak bileşenlerin (sepet, filtre, ödeme…) kullanacağı stil ailesi. */
export function styleOf(t: ThemeKey): StyleKey {
  return THEMES[t]?.family ?? "urban";
}
