import { describe as suite, expect, it } from "vitest";
import { describe, parseCommand, parseOne, SUGGESTIONS } from "./commands";

suite("Özelleştir komut ayrıştırıcı", () => {
  it("fiyat zammı ve indirimi", () => {
    expect(parseOne("Tüm fiyatlara %5 zam yap")).toEqual({ kind: "price", percent: 5, brand: undefined, category: undefined });
    expect(parseOne("Nike ürünlerinde %10 indirim yap")).toMatchObject({ kind: "price", percent: -10, brand: "Nike" });
    expect(parseOne("koşu ayakkabılarını yüzde 15 düşür")).toMatchObject({ kind: "price", percent: -15, category: "kosu" });
  });
  it("kupon, kargo, duyuru", () => {
    expect(parseOne("YAZ20 kodlu %20 indirim kuponu oluştur")).toEqual({ kind: "coupon", code: "YAZ20", percent: 20 });
    expect(parseOne("1000 TL üzeri kargo bedava olsun")).toEqual({ kind: "freeShipping", threshold: 1000 });
    expect(parseOne("1.500 TL üzeri kargo ücretsiz")).toEqual({ kind: "freeShipping", threshold: 1500 });
    expect(parseOne("Duyuru: Bu hafta kargo bedava")).toEqual({ kind: "announcement", text: "Bu hafta kargo bedava" });
    expect(parseOne("duyuruları kaldır")).toEqual({ kind: "clearAnnouncements" });
  });
  it("tema, renk, durum, stok, havuz", () => {
    expect(parseOne("Temayı Luxe yap")).toEqual({ kind: "theme", theme: "luxe" });
    expect(parseOne("Ana rengi lacivert yap")).toEqual({ kind: "color", primary: "#1e3a8a" });
    expect(parseOne("rengi #FF0000 yap")).toEqual({ kind: "color", primary: "#ff0000" });
    expect(parseOne("Siteyi yayına al")).toEqual({ kind: "status", status: "active" });
    expect(parseOne("Nike ürünlerini yayına al")).toMatchObject({ kind: "activate", brand: "Nike", active: true });
    expect(parseOne("Stoksuz ürünleri gizle")).toEqual({ kind: "hideOutOfStock" });
    expect(parseOne("Havuzdan 20 Adidas ürünü ekle")).toMatchObject({ kind: "importPool", brand: "adidas", limit: 20 });
    expect(parseOne("New Balance ürünlerini öne çıkar")).toMatchObject({ kind: "feature", brand: "New Balance" });
  });
  it("birden fazla istek ve anlaşılmayan metin", () => {
    expect(parseCommand("Tüm fiyatlara %5 zam yap ve 1000 TL üzeri kargo bedava olsun")).toHaveLength(2);
    expect(parseCommand("merhaba nasılsın")).toEqual([]);
  });
  it("tüm öneriler anlaşılır", () => {
    for (const s of SUGGESTIONS) {
      const a = parseCommand(s);
      expect(a.length, s).toBeGreaterThan(0);
      expect(describe(a[0]).length).toBeGreaterThan(5);
    }
  });
});

suite("Katalog doğal dil araması", () => {
  it("marka, kategori ve cinsiyeti ayırır", async () => {
    const { smartQuery } = await import("./commands");
    expect(smartQuery("kadın nike koşu ayakkabıları")).toEqual({ brand: "Nike", category: "kosu", gender: "kadin", rest: "" });
    expect(smartQuery("adidas samba")).toMatchObject({ brand: "adidas", rest: "samba" });
    expect(smartQuery("air force")).toMatchObject({ brand: undefined, rest: "air force" });
  });
});
