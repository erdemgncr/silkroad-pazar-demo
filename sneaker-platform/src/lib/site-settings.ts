import { z } from "zod";

export const heroSlideSchema = z.object({
  eyebrow: z.string().default(""),
  title: z.string().min(1),
  subtitle: z.string().default(""),
  cta: z.string().default("Keşfet"),
  href: z.string().default("/yeni-gelenler"),
  /** Görsel URL'si; boşsa slayt, seçili ürünün görselini kullanır. */
  image: z.string().default(""),
  bg: z.string().default("#111111"),
  fg: z.string().default("#ffffff"),
});

export const promoBannerSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().default(""),
  cta: z.string().default("Alışverişe Başla"),
  href: z.string().default("/indirim"),
  image: z.string().default(""),
  bg: z.string().default("#f2f2f2"),
  fg: z.string().default("#111111"),
});

export const siteSettingsSchema = z.object({
  tagline: z.string().default(""),
  logoText: z.string().default(""),
  logoUrl: z.string().default(""),
  colors: z
    .object({
      primary: z.string().default("#111111"),
      accent: z.string().default("#ff4d00"),
      sale: z.string().default("#e11d2e"),
    })
    .default({ primary: "#111111", accent: "#ff4d00", sale: "#e11d2e" }),
  announcements: z.array(z.string()).default([]),
  heroSlides: z.array(heroSlideSchema).default([]),
  promoBanners: z.array(promoBannerSchema).default([]),
  homeSections: z
    .object({
      categoryTiles: z.boolean().default(true),
      featured: z.boolean().default(true),
      newArrivals: z.boolean().default(true),
      bestSellers: z.boolean().default(true),
      brands: z.boolean().default(true),
      sale: z.boolean().default(true),
      upcoming: z.boolean().default(true),
      blog: z.boolean().default(true),
      seoText: z.boolean().default(true),
    })
    .default({
      categoryTiles: true,
      featured: true,
      newArrivals: true,
      bestSellers: true,
      brands: true,
      sale: true,
      upcoming: true,
      blog: true,
      seoText: true,
    }),
  contact: z
    .object({
      phone: z.string().default(""),
      email: z.string().default(""),
      whatsapp: z.string().default(""),
      address: z.string().default(""),
      district: z.string().default(""),
      city: z.string().default("İstanbul"),
      postcode: z.string().default(""),
      workingHours: z.string().default("Hafta içi 09:00 - 18:00"),
      mapEmbedUrl: z.string().default(""),
    })
    .default({
      phone: "",
      email: "",
      whatsapp: "",
      address: "",
      district: "",
      city: "İstanbul",
      postcode: "",
      workingHours: "Hafta içi 09:00 - 18:00",
      mapEmbedUrl: "",
    }),
  social: z
    .object({
      instagram: z.string().default(""),
      tiktok: z.string().default(""),
      x: z.string().default(""),
      facebook: z.string().default(""),
      youtube: z.string().default(""),
    })
    .default({ instagram: "", tiktok: "", x: "", facebook: "", youtube: "" }),
  company: z
    .object({
      legalName: z.string().default(""),
      taxOffice: z.string().default(""),
      taxNumber: z.string().default(""),
      mersisNo: z.string().default(""),
      kepAddress: z.string().default(""),
      address: z.string().default(""),
    })
    .default({ legalName: "", taxOffice: "", taxNumber: "", mersisNo: "", kepAddress: "", address: "" }),
  shipping: z
    .object({
      freeShippingThreshold: z.number().int().min(0).default(1500),
      fee: z.number().int().min(0).default(89),
      carrier: z.string().default("Yurtiçi Kargo"),
      dispatchDays: z.string().default("1-2 iş günü"),
      returnDays: z.number().int().min(14).default(14),
    })
    .default({ freeShippingThreshold: 1500, fee: 89, carrier: "Yurtiçi Kargo", dispatchDays: "1-2 iş günü", returnDays: 14 }),
  seo: z
    .object({
      homeTitle: z.string().default(""),
      homeDescription: z.string().default(""),
      titleSuffix: z.string().default(""),
      keywords: z.array(z.string()).default([]),
      targetCity: z.string().default(""),
      googleVerification: z.string().default(""),
      yandexVerification: z.string().default(""),
      bingVerification: z.string().default(""),
      gaId: z.string().default(""),
      gtmId: z.string().default(""),
      metaPixelId: z.string().default(""),
      /** Aynı ürünün her sitede farklı metinle yayınlanması için kullanılan tohum. */
      seed: z.number().int().default(1),
    })
    .default({
      homeTitle: "",
      homeDescription: "",
      titleSuffix: "",
      keywords: [],
      targetCity: "",
      googleVerification: "",
      yandexVerification: "",
      bingVerification: "",
      gaId: "",
      gtmId: "",
      metaPixelId: "",
      seed: 1,
    }),
  about: z.string().default(""),
  footerText: z.string().default(""),
  priceAdjustPercent: z.number().min(-50).max(100).default(0),
  installmentText: z.string().default("Tüm kartlara 12 aya varan taksit"),
});

export type SiteSettings = z.infer<typeof siteSettingsSchema>;
export type HeroSlide = z.infer<typeof heroSlideSchema>;
export type PromoBanner = z.infer<typeof promoBannerSchema>;

export function parseSettings(raw: unknown): SiteSettings {
  return siteSettingsSchema.parse(raw ?? {});
}
