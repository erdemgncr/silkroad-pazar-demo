export const THEME_KEYS = ["urban", "arena", "neon", "studio", "pulse"] as const;
export type ThemeKey = (typeof THEME_KEYS)[number];

export type ThemeMeta = {
  key: ThemeKey;
  name: string;
  description: string;
  /** Panelde gösterilen örnek renkler ve yeni site oluştururken önerilen varsayılanlar. */
  defaults: { primary: string; accent: string; sale: string };
  dark: boolean;
};

export const THEMES: Record<ThemeKey, ThemeMeta> = {
  urban: {
    key: "urban",
    name: "Urban",
    description:
      "Siyah-beyaz, büyük tipografili klasik sneaker mağazası. Tam genişlik slider, mega menü, sol filtre paneli, 2 sütun ürün galerisi.",
    defaults: { primary: "#111111", accent: "#ff4d00", sale: "#e11d2e" },
    dark: false,
  },
  arena: {
    key: "arena",
    name: "Arena",
    description:
      "Çift satırlı header ve geniş arama çubuğu, kampanya ızgarası, üst filtre çubuğu ve hızlı sepete ekleme. Büyük perakende mağaza düzeni.",
    defaults: { primary: "#0b1f44", accent: "#ffd400", sale: "#e30613" },
    dark: false,
  },
  neon: {
    key: "neon",
    name: "Neon",
    description:
      "Koyu tema, neon vurgu, kayan yazı bandı ve drop takvimi. Hype/limited ürün satan mağazalar için.",
    defaults: { primary: "#c6ff00", accent: "#c6ff00", sale: "#ff2e63" },
    dark: true,
  },
  studio: {
    key: "studio",
    name: "Studio",
    description:
      "Krem tonlar, serif başlıklar, editoryal düzen. Premium/butik sneaker mağazası görünümü.",
    defaults: { primary: "#1c1917", accent: "#9a3412", sale: "#b91c1c" },
    dark: false,
  },
  pulse: {
    key: "pulse",
    name: "Pulse",
    description:
      "Yuvarlak köşeli, canlı renkli, spor odaklı düzen. Aktivite kategorileri, günün fırsatı sayacı ve uygulama benzeri mobil deneyim.",
    defaults: { primary: "#1d4ed8", accent: "#f97316", sale: "#dc2626" },
    dark: false,
  },
};

export function isThemeKey(v: string): v is ThemeKey {
  return (THEME_KEYS as readonly string[]).includes(v);
}
