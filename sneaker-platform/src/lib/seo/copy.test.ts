import { describe, expect, it } from "vitest";
import { listingCopy, productCopy, type CopySite } from "./copy";
import { slugify } from "@/lib/taxonomy";

const site = (seed: number, name: string): CopySite => ({
  name,
  settings: {
    seo: { seed, targetCity: "" },
    shipping: { freeShippingThreshold: 1500, fee: 89, carrier: "Yurtiçi Kargo", dispatchDays: "1-2 iş günü", returnDays: 14 },
    installmentText: "Tüm kartlara 12 aya varan taksit",
  },
});

const product = {
  id: 7,
  title: "Nike Air Force 1 '07",
  brand: "Nike",
  model: "Air Force 1 '07",
  colorName: "Beyaz",
  gender: "erkek" as const,
  category: "sneaker",
  productType: "ayakkabi" as const,
  price: 479900,
  compareAtPrice: null,
  description: "Zamansız court klasiği.",
  material: "Deri saya",
  variants: [{ size: "42", stock: 3 }],
  sku: "SP-1",
};

describe("SEO metin motoru", () => {
  it("aynı site için deterministik", () => {
    expect(productCopy(site(1, "A"), product)).toEqual(productCopy(site(1, "A"), product));
  });

  it("farklı sitelerde farklı metin üretir", () => {
    const texts = new Set(Array.from({ length: 12 }, (_, i) => productCopy(site(i * 7919 + 3, `Site${i}`), product).metaDescription));
    expect(texts.size).toBeGreaterThan(8);
  });

  it("meta açıklama 160, başlık 70 karakteri aşmaz", () => {
    for (let i = 0; i < 30; i++) {
      const c = productCopy(site(i * 31 + 1, "Uzun İsimli Sneaker Mağazası"), product);
      expect(c.metaDescription.length).toBeLessThanOrEqual(160);
      expect(c.metaTitle.length).toBeLessThanOrEqual(70);
    }
  });

  it("panelden girilen metinler önceliklidir", () => {
    const c = productCopy(site(1, "A"), product, { title: "Özel Başlık", metaDescription: "Özel açıklama", description: "Paragraf 1\n\nParagraf 2" });
    expect(c.h1).toBe("Özel Başlık");
    expect(c.metaDescription).toBe("Özel açıklama");
    expect(c.paragraphs).toEqual(["Paragraf 1", "Paragraf 2"]);
  });

  it("kategori metni üretir", () => {
    const c = listingCopy(site(5, "A"), "erkek-sneaker", { label: "Erkek Sneaker", count: 10, minPrice: 100000, maxPrice: 900000, topBrands: ["Nike", "adidas"], topModels: ["Air Force 1"] });
    expect(c.h1).toContain("Erkek Sneaker");
    expect(c.content.length).toBe(3);
    expect(c.faq.length).toBe(3);
  });
});

describe("Türkçe slug", () => {
  it("Türkçe karakterleri dönüştürür", () => {
    expect(slugify("Kadın Koşu Ayakkabısı Çocuk Şapka Işık Öğrenci Üzüm")).toBe("kadin-kosu-ayakkabisi-cocuk-sapka-isik-ogrenci-uzum");
    expect(slugify("Nike Air Force 1 '07")).toBe("nike-air-force-1-07");
  });
});
