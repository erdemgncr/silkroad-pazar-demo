import { z } from "zod";
import { BRANDS, CATEGORIES } from "@/lib/taxonomy";
import { THEME_KEYS, THEMES, type ThemeKey } from "@/themes/registry";

/**
 * "Özelleştir" komut motoru: satıcının doğal dille yazdığı isteği uygulanabilir eylemlere çevirir.
 * Önce kural tabanlı Türkçe ayrıştırıcı çalışır; anlaşılmazsa (anahtar varsa) Gemini'ye sorulur.
 * Eylemler her zaman önce önizlenir, satıcı onaylayınca uygulanır.
 */

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const aiActionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("price"), percent: z.number().min(-90).max(90), brand: z.string().optional(), category: z.string().optional() }),
  z.object({ kind: z.literal("theme"), theme: z.enum(THEME_KEYS as unknown as [ThemeKey, ...ThemeKey[]]) }),
  z.object({ kind: z.literal("color"), primary: hex }),
  z.object({ kind: z.literal("announcement"), text: z.string().min(2).max(160) }),
  z.object({ kind: z.literal("clearAnnouncements") }),
  z.object({ kind: z.literal("coupon"), code: z.string().regex(/^[A-Z0-9_-]{3,30}$/), percent: z.number().int().min(1).max(90) }),
  z.object({ kind: z.literal("freeShipping"), threshold: z.number().int().min(0).max(100000) }),
  z.object({ kind: z.literal("shippingFee"), fee: z.number().int().min(0).max(1000) }),
  z.object({ kind: z.literal("status"), status: z.enum(["active", "draft", "maintenance"]) }),
  z.object({ kind: z.literal("hideOutOfStock") }),
  z.object({ kind: z.literal("feature"), brand: z.string().optional(), category: z.string().optional() }),
  z.object({ kind: z.literal("tagline"), text: z.string().min(2).max(120) }),
  z.object({ kind: z.literal("importPool"), brand: z.string().optional(), category: z.string().optional(), limit: z.number().int().min(1).max(500) }),
  z.object({ kind: z.literal("activate"), brand: z.string().optional(), category: z.string().optional(), active: z.boolean() }),
]);

export type AiAction = z.infer<typeof aiActionSchema>;

export const SUGGESTIONS = [
  "Tüm fiyatlara %5 zam yap",
  "Nike ürünlerinde %10 indirim yap",
  "Duyuru: Bu hafta tüm siparişlerde kargo bedava",
  "1000 TL üzeri kargo bedava olsun",
  "YAZ20 kodlu %20 indirim kuponu oluştur",
  "Temayı Luxe yap",
  "Ana rengi lacivert yap",
  "Stoksuz ürünleri gizle",
  "Havuzdan 20 Adidas ürünü ekle",
  "Siteyi yayına al",
];

const COLORS: Record<string, string> = {
  siyah: "#111111",
  beyaz: "#ffffff",
  kırmızı: "#e11d2e",
  bordo: "#7f1d1d",
  mavi: "#1d4ed8",
  lacivert: "#1e3a8a",
  "açık mavi": "#38bdf8",
  yeşil: "#16a34a",
  "koyu yeşil": "#14532d",
  turuncu: "#f97316",
  sarı: "#facc15",
  mor: "#7c3aed",
  pembe: "#ec4899",
  gri: "#52525b",
  altın: "#c9a45c",
  kahverengi: "#78350f",
  turkuaz: "#0d9488",
};

const lower = (s: string) => s.toLocaleLowerCase("tr-TR");

export function findBrand(t: string): string | undefined {
  const l = lower(t);
  // Uzun adlar önce ("new balance" > "new")
  return [...BRANDS].sort((a, b) => b.name.length - a.name.length).find((b) => l.includes(lower(b.name)))?.name;
}

export function findCategory(t: string): string | undefined {
  const l = lower(t);
  const alias: [string, string][] = [
    ["koşu", "kosu"],
    ["basketbol", "basketbol"],
    ["bot", "outdoor"],
    ["outdoor", "outdoor"],
    ["terlik", "terlik"],
    ["sandalet", "terlik"],
    ["sneaker", "sneaker"],
    ["tişört", "tisort"],
    ["sweatshirt", "sweatshirt"],
    ["hoodie", "sweatshirt"],
    ["eşofman", "esofman"],
    ["mont", "mont"],
    ["ceket", "mont"],
    ["çanta", "canta"],
    ["şapka", "sapka"],
    ["çorap", "corap"],
  ];
  for (const [word, key] of alias) if (l.includes(word) && CATEGORIES.some((c) => c.key === key)) return key;
  return CATEGORIES.find((c) => l.includes(lower(c.label)))?.key;
}

function quoted(t: string): string | null {
  const m = t.match(/["“”'‘’«»]([^"“”'‘’«»]{2,160})["“”'‘’«»]/);
  return m ? m[1].trim() : null;
}

function afterColon(t: string): string | null {
  const i = t.indexOf(":");
  if (i < 0) return null;
  const v = t.slice(i + 1).trim();
  return v.length >= 2 ? v : null;
}

function percentOf(l: string): number | null {
  const m = l.match(/%\s*(\d{1,2}(?:[.,]\d)?)|(\d{1,2}(?:[.,]\d)?)\s*%|yüzde\s*(\d{1,2})/);
  if (!m) return null;
  return Math.round(Number((m[1] ?? m[2] ?? m[3]).replace(",", ".")));
}

function amountTl(l: string): number | null {
  const m = l.match(/(\d{1,3}(?:[.\s]\d{3})+|\d+)\s*(?:tl|₺|lira)/);
  if (!m) return null;
  return Number(m[1].replace(/[.\s]/g, ""));
}

/** Tek bir cümleyi eyleme çevirir; anlaşılamazsa null. */
export function parseOne(text: string): AiAction | null {
  const t = text.trim();
  const l = lower(t);
  if (!l) return null;

  // Duyuru
  if (/duyuru|karşılama|üst şerit|kayan yazı/.test(l)) {
    if (/kaldır|sil|temizle/.test(l) && !afterColon(t) && !quoted(t)) return { kind: "clearAnnouncements" };
    const txt = quoted(t) ?? afterColon(t);
    if (txt) return { kind: "announcement", text: txt.slice(0, 160) };
  }

  // Slogan
  if (/slogan/.test(l)) {
    const txt = quoted(t) ?? afterColon(t) ?? t.replace(/.*slogan[ıi]?\s*/i, "").replace(/\s*(yap|olsun|olarak ayarla)\.?$/i, "").trim();
    if (txt && txt.length >= 2) return { kind: "tagline", text: txt.slice(0, 120) };
  }

  // Kupon
  if (/kupon|indirim kodu|kodlu/.test(l)) {
    const code = t.match(/\b([A-ZÇĞİÖŞÜ0-9_-]{3,30})\b(?=\s*(kodlu|kodu|kupon))/)?.[1] ?? t.match(/\b([A-Z][A-Z0-9_-]{2,29})\b/)?.[1];
    const p = percentOf(l);
    if (code && p) return { kind: "coupon", code: code.toLocaleUpperCase("tr-TR").replace(/[ÇĞİÖŞÜ]/g, (c) => ({ Ç: "C", Ğ: "G", İ: "I", Ö: "O", Ş: "S", Ü: "U" })[c] ?? c), percent: Math.min(90, p) };
  }

  // Kargo
  if (/kargo/.test(l)) {
    const amt = amountTl(l) ?? Number(l.match(/(\d{2,6})/)?.[1] ?? NaN);
    if (/bedava|ücretsiz/.test(l)) {
      if (/(tüm|her|bütün) sipariş/.test(l) && !/üzeri/.test(l)) return { kind: "freeShipping", threshold: 0 };
      if (Number.isFinite(amt)) return { kind: "freeShipping", threshold: amt };
      return { kind: "freeShipping", threshold: 0 };
    }
    if (/(ücret|bedel)/.test(l) && Number.isFinite(amt)) return { kind: "shippingFee", fee: amt };
  }

  // Tema
  if (/tema/.test(l)) {
    const key = THEME_KEYS.find((k) => l.includes(lower(THEMES[k].name)));
    if (key) return { kind: "theme", theme: key };
  }

  // Renk
  if (/renk|rengi/.test(l)) {
    const h = t.match(/#[0-9a-fA-F]{6}\b/)?.[0];
    if (h) return { kind: "color", primary: h.toLowerCase() };
    const name = Object.keys(COLORS)
      .sort((a, b) => b.length - a.length)
      .find((c) => l.includes(c));
    if (name) return { kind: "color", primary: COLORS[name] };
  }

  const brand = findBrand(t);
  const category = findCategory(t);

  // Ürün grubunu satışa aç / kapat (site durumundan önce: "Nike ürünlerini yayına al")
  if (brand || category) {
    if (/(satıştan kaldır|satışa kapat|gizle|pasif yap|yayından kaldır)/.test(l)) return { kind: "activate", brand, category, active: false };
    if (/(satışa aç|aktif yap|yayına al)/.test(l) && !/havuz|katalog/.test(l)) return { kind: "activate", brand, category, active: true };
  }

  // Site durumu
  if (/yayına al|yayınla|siteyi aç/.test(l)) return { kind: "status", status: "active" };
  if (/bakım/.test(l)) return { kind: "status", status: "maintenance" };
  if (/yayından kaldır|taslağa al|siteyi kapat/.test(l)) return { kind: "status", status: "draft" };

  // Stok
  if (/(stoksuz|stokta olmayan|stoğu bitmiş|tükenen)/.test(l) && /(gizle|kaldır|kapat|pasif)/.test(l)) return { kind: "hideOutOfStock" };

  // Havuzdan ürün ekleme
  if (/(havuz|katalog)/.test(l) && /ekle/.test(l)) {
    const n = Number(l.match(/(\d{1,3})\s*(tane|adet|ürün)?/)?.[1] ?? 20);
    return { kind: "importPool", brand, category, limit: Math.min(500, Math.max(1, n)) };
  }

  // Öne çıkarma
  if (/öne çıkar/.test(l) && (brand || category)) return { kind: "feature", brand, category };

  // Fiyat
  const p = percentOf(l);
  if (p && /(fiyat|zam|indirim|artır|arttır|düşür|azalt|ucuzlat|pahalı)/.test(l)) {
    const down = /(indirim|düşür|azalt|ucuzlat)/.test(l);
    return { kind: "price", percent: down ? -Math.min(90, p) : Math.min(90, p), brand, category };
  }
  return null;
}

/** Birden fazla isteği (" ve ", ";", satır) ayırıp her birini çözer. */
export function parseCommand(text: string): AiAction[] {
  const whole = parseOne(text);
  const parts = text
    .split(/\s*(?:;|\n|\s+ve\s+|\s+ayrıca\s+)\s*/i)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length > 1) {
    const each = parts.map(parseOne);
    if (each.every(Boolean)) return each as AiAction[];
  }
  return whole ? [whole] : [];
}

const catLabel = (k?: string) => CATEGORIES.find((c) => c.key === k)?.label;
const scope = (a: { brand?: string; category?: string }) => [a.brand, catLabel(a.category)].filter(Boolean).join(" ") || "Tüm";

/** Önizleme kartında gösterilecek açıklama. */
export function describe(a: AiAction): string {
  switch (a.kind) {
    case "price":
      return `${scope(a)} ürünlerin fiyatı %${Math.abs(a.percent)} ${a.percent > 0 ? "artırılacak" : "düşürülecek"}`;
    case "theme":
      return `Site teması ${THEMES[a.theme].name} olacak`;
    case "color":
      return `Ana renk ${a.primary} olacak`;
    case "announcement":
      return `Duyuru şeridine eklenecek: “${a.text}”`;
    case "clearAnnouncements":
      return "Duyuru şeridi temizlenecek";
    case "coupon":
      return `${a.code} kodlu %${a.percent} indirim kuponu oluşturulacak`;
    case "freeShipping":
      return a.threshold > 0 ? `${a.threshold.toLocaleString("tr-TR")} TL üzeri kargo bedava olacak` : "Tüm siparişlerde kargo bedava olacak";
    case "shippingFee":
      return `Kargo ücreti ${a.fee} TL olacak`;
    case "status":
      return a.status === "active" ? "Site yayına alınacak" : a.status === "maintenance" ? "Site bakım moduna alınacak" : "Site taslağa alınacak";
    case "hideOutOfStock":
      return "Stoğu biten ürünler satıştan kaldırılacak";
    case "feature":
      return `${scope(a)} ürünler öne çıkarılacak`;
    case "tagline":
      return `Slogan “${a.text}” olacak`;
    case "importPool":
      return `Katalog havuzundan en fazla ${a.limit} ${scope(a) === "Tüm" ? "" : `${scope(a)} `}ürün eklenecek`;
    case "activate":
      return `${scope(a)} ürünler ${a.active ? "satışa açılacak" : "satıştan kaldırılacak"}`;
  }
}

/** Gemini için yanıt şeması (eylem listesi). */
export const AI_ACTIONS_JSON_SCHEMA = {
  type: "OBJECT",
  properties: {
    actions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          kind: {
            type: "STRING",
            enum: ["price", "theme", "color", "announcement", "clearAnnouncements", "coupon", "freeShipping", "shippingFee", "status", "hideOutOfStock", "feature", "tagline", "importPool", "activate"],
          },
          percent: { type: "NUMBER" },
          brand: { type: "STRING" },
          category: { type: "STRING" },
          theme: { type: "STRING" },
          primary: { type: "STRING" },
          text: { type: "STRING" },
          code: { type: "STRING" },
          threshold: { type: "NUMBER" },
          fee: { type: "NUMBER" },
          status: { type: "STRING" },
          limit: { type: "NUMBER" },
          active: { type: "BOOLEAN" },
        },
        required: ["kind"],
      },
    },
    reply: { type: "STRING" },
  },
  required: ["actions"],
};

export function aiPrompt(text: string) {
  return `Sen bir e-ticaret mağaza yönetim asistanısın. Satıcının Türkçe isteğini aşağıdaki eylem türlerine çevir. Anlamadığın ya da desteklenmeyen isteklerde actions boş olsun ve reply alanında kısaca neyi yapabileceğini söyle.
Eylemler:
- price {percent (+ zam, - indirim), brand?, category?}
- theme {theme: ${THEME_KEYS.join("|")}}
- color {primary: #rrggbb}
- announcement {text}, clearAnnouncements
- coupon {code: BÜYÜK HARF, percent}
- freeShipping {threshold: TL, 0 = her sipariş}, shippingFee {fee: TL}
- status {status: active|draft|maintenance}
- hideOutOfStock
- feature {brand?, category?}
- tagline {text}
- importPool {brand?, category?, limit}
- activate {brand?, category?, active}
Markalar: ${BRANDS.map((b) => b.name).join(", ")}
Kategori anahtarları: ${CATEGORIES.map((c) => `${c.key} (${c.label})`).join(", ")}
İstek: """${text.slice(0, 500)}"""`;
}

/** Gemini yanıtını doğrular; geçersiz eylemleri atar. */
export function sanitizeAiActions(raw: unknown): AiAction[] {
  const list = (raw as { actions?: unknown[] } | null)?.actions ?? [];
  const out: AiAction[] = [];
  for (const item of list) {
    const clean = Object.fromEntries(Object.entries(item as Record<string, unknown>).filter(([, v]) => v !== null && v !== ""));
    if (clean.kind === "coupon" && typeof clean.code === "string") clean.code = clean.code.toUpperCase();
    const r = aiActionSchema.safeParse(clean);
    if (r.success) out.push(r.data);
  }
  return out;
}

/** Katalog aramasında doğal dil: "kadın nike koşu ayakkabıları" → marka, kategori, cinsiyet ve kalan metin. */
export function smartQuery(text: string): { brand?: string; category?: string; gender?: "erkek" | "kadin" | "cocuk"; rest: string } {
  const brand = findBrand(text);
  const category = findCategory(text);
  const l = lower(text);
  const gender = /\bkadın|bayan/.test(l) ? "kadin" : /\bçocuk|genç/.test(l) ? "cocuk" : /\berkek|bay\b/.test(l) ? "erkek" : undefined;
  let rest = l;
  if (brand) rest = rest.replace(lower(brand), " ");
  const cat = CATEGORIES.find((c) => c.key === category);
  if (cat) for (const w of lower(cat.label).split(/[\s&]+/)) if (w.length > 2) rest = rest.replace(new RegExp(w.slice(0, Math.max(3, w.length - 2)) + "\\S*", "g"), " ");
  rest = rest
    .replace(/\b(kadın|bayan|erkek|bay|çocuk|genç)\S*/g, " ")
    .replace(/\b(ürün\S*|ayakkabı\S*|model\S*|tüm\S*|hepsi\S*|göster\S*|ekle\S*|istiyorum|bul|getir|olan|için|ve|koşu|basketbol|sneaker\S*)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return { brand, category, gender, rest: rest.length >= 2 ? rest : "" };
}
