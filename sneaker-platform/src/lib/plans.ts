import type { PlanKey } from "@/db/schema";

export type PlanDef = {
  key: PlanKey;
  name: string;
  priceMonthly: number; // TL
  siteLimit: number;
  productLimit: number;
  aiMonthlyLimit: number;
  features: string[];
};

/** SaaS paketleri. Fiyatlar panelden/koddan güncellenebilir. */
export const PLANS: Record<PlanKey, PlanDef> = {
  baslangic: {
    key: "baslangic",
    name: "Başlangıç",
    priceMonthly: 499,
    siteLimit: 1,
    productLimit: 200,
    aiMonthlyLimit: 100,
    features: ["1 site", "5 hazır tema", "Katalog havuzundan 200 ürün", "Shopier ödeme ve ürün senkronu", "Ayda 100 AI açıklama"],
  },
  pro: {
    key: "pro",
    name: "Pro",
    priceMonthly: 1499,
    siteLimit: 5,
    productLimit: 2000,
    aiMonthlyLimit: 1000,
    features: ["5 site (1 Shopier hesabı)", "Özel alan adı + SSL", "2.000 ürün", "Ayda 1.000 AI açıklama", "Site bazlı benzersiz SEO metinleri"],
  },
  kurumsal: {
    key: "kurumsal",
    name: "Kurumsal",
    priceMonthly: 4999,
    siteLimit: 25,
    productLimit: 20000,
    aiMonthlyLimit: 10000,
    features: ["25 site (5 Shopier hesabı)", "20.000 ürün", "Ayda 10.000 AI açıklama", "Öncelikli destek", "Çoklu kullanıcı"],
  },
};
