export type Gender = "erkek" | "kadin" | "cocuk" | "unisex";
export type ProductType = "ayakkabi" | "giyim" | "aksesuar";

export const GENDERS: Record<Exclude<Gender, "unisex">, { label: string; slug: string }> = {
  erkek: { label: "Erkek", slug: "erkek" },
  kadin: { label: "Kadın", slug: "kadin" },
  cocuk: { label: "Çocuk", slug: "cocuk" },
};

export const GENDER_LABEL: Record<Gender, string> = {
  erkek: "Erkek",
  kadin: "Kadın",
  cocuk: "Çocuk",
  unisex: "Unisex",
};

export const PRODUCT_TYPES: Record<ProductType, { label: string; slug: string }> = {
  ayakkabi: { label: "Ayakkabı", slug: "ayakkabi" },
  giyim: { label: "Giyim", slug: "giyim" },
  aksesuar: { label: "Aksesuar", slug: "aksesuar" },
};

export type CategoryDef = { key: string; type: ProductType; label: string; slug: string; singular: string };

export const CATEGORIES: CategoryDef[] = [
  { key: "sneaker", type: "ayakkabi", label: "Sneaker", singular: "Sneaker", slug: "sneaker" },
  { key: "kosu", type: "ayakkabi", label: "Koşu Ayakkabısı", singular: "Koşu Ayakkabısı", slug: "kosu-ayakkabisi" },
  { key: "basketbol", type: "ayakkabi", label: "Basketbol Ayakkabısı", singular: "Basketbol Ayakkabısı", slug: "basketbol-ayakkabisi" },
  { key: "outdoor", type: "ayakkabi", label: "Bot & Outdoor", singular: "Bot", slug: "bot-outdoor" },
  { key: "terlik", type: "ayakkabi", label: "Terlik & Sandalet", singular: "Terlik", slug: "terlik-sandalet" },
  { key: "tisort", type: "giyim", label: "Tişört", singular: "Tişört", slug: "tisort" },
  { key: "sweatshirt", type: "giyim", label: "Sweatshirt & Hoodie", singular: "Sweatshirt", slug: "sweatshirt-hoodie" },
  { key: "esofman", type: "giyim", label: "Eşofman", singular: "Eşofman", slug: "esofman" },
  { key: "mont", type: "giyim", label: "Mont & Ceket", singular: "Mont", slug: "mont-ceket" },
  { key: "canta", type: "aksesuar", label: "Çanta", singular: "Çanta", slug: "canta" },
  { key: "sapka", type: "aksesuar", label: "Şapka", singular: "Şapka", slug: "sapka" },
  { key: "corap", type: "aksesuar", label: "Çorap", singular: "Çorap", slug: "corap" },
];

export const CATEGORY_BY_KEY = Object.fromEntries(CATEGORIES.map((c) => [c.key, c])) as Record<string, CategoryDef>;

export type BrandDef = { name: string; slug: string; country: string; since: number; blurb: string };

export const BRANDS: BrandDef[] = [
  { name: "Nike", slug: "nike", country: "ABD", since: 1964, blurb: "Performans ve sokak stilini aynı çizgide buluşturan, sneaker kültürünün en bilinen isimlerinden." },
  { name: "Jordan", slug: "jordan", country: "ABD", since: 1984, blurb: "Basketbol sahasından doğup sokak modasının ikonuna dönüşen efsanevi seri." },
  { name: "adidas", slug: "adidas", country: "Almanya", since: 1949, blurb: "Terrace klasiklerinden Boost teknolojisine uzanan, spor ve stil mirasına sahip marka." },
  { name: "New Balance", slug: "new-balance", country: "ABD", since: 1906, blurb: "Konfor odaklı üretim anlayışı ve retro koşu silüetleriyle öne çıkan köklü marka." },
  { name: "Puma", slug: "puma", country: "Almanya", since: 1948, blurb: "Motorsporları ve futbol mirasını günlük stile taşıyan ikonik modellerin adresi." },
  { name: "Converse", slug: "converse", country: "ABD", since: 1908, blurb: "Kanvas sayası ve kauçuk tabanıyla nesiller boyu değişmeyen bir klasik." },
  { name: "Vans", slug: "vans", country: "ABD", since: 1966, blurb: "Kaykay kültüründen doğan, sağlam yapılı ve zamansız sneaker modelleri." },
  { name: "Asics", slug: "asics", country: "Japonya", since: 1949, blurb: "GEL teknolojisiyle bilinen, koşu performansı ve Y2K stilini buluşturan Japon markası." },
  { name: "Reebok", slug: "reebok", country: "ABD", since: 1958, blurb: "Club C ve Classic Leather gibi sade, temiz çizgili klasikleriyle tanınır." },
  { name: "Salomon", slug: "salomon", country: "Fransa", since: 1947, blurb: "Dağ koşusu mühendisliğini şehir stiline taşıyan teknik outdoor ayakkabılar." },
  { name: "Hoka", slug: "hoka", country: "Fransa", since: 2009, blurb: "Maksimum yastıklama anlayışıyla uzun mesafe koşucularının favorisi." },
  { name: "Skechers", slug: "skechers", country: "ABD", since: 1992, blurb: "Hafif, rahat ve gün boyu konfor sunan günlük ayakkabılar." },
  { name: "Timberland", slug: "timberland", country: "ABD", since: 1952, blurb: "Su geçirmez deri botlarıyla dört mevsim dayanıklılığın simgesi." },
  { name: "The North Face", slug: "the-north-face", country: "ABD", since: 1966, blurb: "Zorlu hava koşulları için tasarlanmış teknik mont ve outdoor giyim." },
];

export const BRAND_BY_NAME = Object.fromEntries(BRANDS.map((b) => [b.name.toLowerCase(), b])) as Record<string, BrandDef>;
export const BRAND_BY_SLUG = Object.fromEntries(BRANDS.map((b) => [b.slug, b])) as Record<string, BrandDef>;

export const COLOR_FAMILIES: { key: string; label: string; hex: string }[] = [
  { key: "beyaz", label: "Beyaz", hex: "#ffffff" },
  { key: "siyah", label: "Siyah", hex: "#111111" },
  { key: "gri", label: "Gri", hex: "#9ca3af" },
  { key: "bej", label: "Bej", hex: "#e7d8bf" },
  { key: "kahverengi", label: "Kahverengi", hex: "#7c4a21" },
  { key: "kirmizi", label: "Kırmızı", hex: "#dc2626" },
  { key: "pembe", label: "Pembe", hex: "#f9a8d4" },
  { key: "turuncu", label: "Turuncu", hex: "#f97316" },
  { key: "sari", label: "Sarı", hex: "#facc15" },
  { key: "yesil", label: "Yeşil", hex: "#16a34a" },
  { key: "mavi", label: "Mavi", hex: "#3b82f6" },
  { key: "lacivert", label: "Lacivert", hex: "#1e3a8a" },
  { key: "mor", label: "Mor", hex: "#7c3aed" },
];

export const SIZE_ORDER = [
  "XS", "S", "M", "L", "XL", "XXL", "STD", "35-38", "39-42", "43-46",
];

export function sortSizes(sizes: string[]): string[] {
  return [...sizes].sort((a, b) => {
    const na = parseFloat(a.replace(",", "."));
    const nb = parseFloat(b.replace(",", "."));
    const aNum = !Number.isNaN(na) && !a.includes("-");
    const bNum = !Number.isNaN(nb) && !b.includes("-");
    if (aNum && bNum) return na - nb;
    if (aNum) return -1;
    if (bNum) return 1;
    return SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b);
  });
}

/** Türkçe karakterleri sadeleştirerek URL uyumlu slug üretir. */
export function slugify(input: string): string {
  return input
    .toLocaleLowerCase("tr-TR")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/i̇/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .replace(/â/g, "a")
    .replace(/['’`]/g, "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

/** Arama için metni normalize eder (ı/i, ş/s gibi farkları yok sayar). */
export function normalizeSearch(input: string): string {
  return slugify(input).replace(/-/g, " ");
}

export function colorFamilyOf(colorName: string): string {
  const first = colorName.split(/[\/,-]/)[0].trim();
  return slugify(first);
}

export function brandSlug(brand: string): string {
  return BRAND_BY_NAME[brand.toLowerCase()]?.slug ?? slugify(brand);
}

export const SIZE_CHARTS: Record<"erkek" | "kadin" | "cocuk" | "giyim" | "aksesuar", { head: string[]; rows: string[][] }> = {
  erkek: {
    head: ["EU", "US", "UK", "CM"],
    rows: [
      ["40", "7", "6", "25"],
      ["40.5", "7.5", "6.5", "25.5"],
      ["41", "8", "7", "26"],
      ["42", "8.5", "7.5", "26.5"],
      ["42.5", "9", "8", "27"],
      ["43", "9.5", "8.5", "27.5"],
      ["44", "10", "9", "28"],
      ["44.5", "10.5", "9.5", "28.5"],
      ["45", "11", "10", "29"],
      ["46", "12", "11", "30"],
    ],
  },
  kadin: {
    head: ["EU", "US", "UK", "CM"],
    rows: [
      ["36", "5.5", "3.5", "22.5"],
      ["36.5", "6", "4", "23"],
      ["37.5", "6.5", "4.5", "23.5"],
      ["38", "7", "5", "24"],
      ["38.5", "7.5", "5.5", "24.5"],
      ["39", "8", "6", "25"],
      ["40", "8.5", "6.5", "25.5"],
      ["40.5", "9", "7", "26"],
    ],
  },
  cocuk: {
    head: ["EU", "US", "CM"],
    rows: [
      ["28", "11C", "17"],
      ["29", "11.5C", "17.5"],
      ["30", "12.5C", "18"],
      ["31", "13C", "19"],
      ["32", "1Y", "20"],
      ["33", "2Y", "20.5"],
      ["34", "2.5Y", "21"],
      ["35", "3.5Y", "22"],
      ["36", "4Y", "22.5"],
      ["37.5", "5Y", "23.5"],
    ],
  },
  giyim: {
    head: ["Beden", "Göğüs", "Bel", "Boy"],
    rows: [
      ["XS", "82-88", "66-72", "160-166"],
      ["S", "88-94", "72-78", "166-172"],
      ["M", "94-100", "78-84", "172-178"],
      ["L", "100-106", "84-90", "178-184"],
      ["XL", "106-112", "90-96", "184-190"],
      ["XXL", "112-120", "96-104", "190-196"],
    ],
  },
  aksesuar: {
    head: ["Beden", "Ayak numarası"],
    rows: [
      ["35-38", "35 - 38"],
      ["39-42", "39 - 42"],
      ["43-46", "43 - 46"],
      ["STD", "Standart / ayarlanabilir"],
    ],
  },
};
