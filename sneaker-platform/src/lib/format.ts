const tl = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const tl0 = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 });

/** Kuruş cinsinden tutarı "1.299,90 TL" biçiminde yazar. */
export function formatPrice(kurus: number): string {
  return `${tl.format(kurus / 100)} TL`;
}

export function formatPriceShort(kurus: number): string {
  return `${tl0.format(Math.round(kurus / 100))} TL`;
}

export function discountPercent(price: number, compareAt: number | null | undefined): number {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

const dateFmt = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" });
const dateShort = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long" });
const dateTime = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(d: Date | string): string {
  return dateFmt.format(new Date(d));
}
export function formatDateShort(d: Date | string): string {
  return dateShort.format(new Date(d));
}
export function formatDateTime(d: Date | string): string {
  return dateTime.format(new Date(d));
}

/** Seeded RNG (mulberry32). */
export function seededRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function trLower(s: string): string {
  return s.toLocaleLowerCase("tr-TR");
}

export function trUpper(s: string): string {
  return s.toLocaleUpperCase("tr-TR");
}

export function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > max * 0.6 ? lastSpace : cut.length).replace(/[,.;:\s]+$/, "")}…`;
}

export function joinTr(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} ve ${items[items.length - 1]}`;
}

/** Sipariş kalemi adı: başlık markayı zaten içeriyorsa tekrar etmez. */
export function itemName(brand: string, title: string): string {
  return trLower(title).startsWith(trLower(brand)) ? title : `${brand} ${title}`;
}
