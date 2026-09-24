import { describe, expect, it } from "vitest";
import { buildPaymentFields, paymentSignature, verifyPaymentCallback } from "./payment";
import { ShopierClient, verifyWebhookSignature } from "./client";

// Beklenen değerler Python hmac/hashlib ile bağımsız olarak hesaplandı.
describe("Shopier ödeme modülü", () => {
  it("resmi SDK ile aynı imzayı üretir", () => {
    expect(paymentSignature("test-secret", 123456, "SP-1001", "1299.90", 0)).toBe("FC2FEZwV3r5V5vSRhkrr/057HZkLSvXGY2w694Kl5ds=");
  });

  it("form alanlarını eksiksiz üretir", () => {
    const f = buildPaymentFields({
      apiKey: "key",
      apiSecret: "test-secret",
      websiteIndex: 3,
      orderId: "SP-1001",
      total: "1299.90",
      productName: "Sipariş SP-1001",
      buyer: { id: "42", firstName: "Ayşe", lastName: "Yılmaz", email: "a@b.com", phone: "05000000000" },
      billing: { address: "Adres", city: "İstanbul", country: "Türkiye", postcode: "34000" },
      shipping: { address: "Adres", city: "İstanbul", country: "Türkiye", postcode: "34000" },
      randomNr: 123456,
      callbackUrl: "https://site.com/api/shopier/callback",
    });
    expect(f.website_index).toBe("3");
    expect(f.currency).toBe("0");
    expect(f.random_nr).toBe("123456");
    expect(f.signature).toBe("FC2FEZwV3r5V5vSRhkrr/057HZkLSvXGY2w694Kl5ds=");
    for (const k of ["API_key", "platform_order_id", "buyer_email", "billing_city", "shipping_postcode", "total_order_value", "modul_version"]) expect(f[k]).toBeTruthy();
  });

  it("website_index 1-5 dışında hata verir", () => {
    expect(() =>
      buildPaymentFields({
        apiKey: "k",
        apiSecret: "s",
        websiteIndex: 6,
        orderId: "1",
        total: "1.00",
        productName: "x",
        buyer: { id: "1", firstName: "a", lastName: "b", email: "e", phone: "p" },
        billing: { address: "a", city: "c", country: "t", postcode: "" },
        shipping: { address: "a", city: "c", country: "t", postcode: "" },
      }),
    ).toThrow();
  });

  it("geri dönüş imzasını doğrular ve sahte imzayı reddeder", () => {
    const ok = verifyPaymentCallback({ platform_order_id: "SP-1001", random_nr: "123456", status: "success", signature: "IM9j4mV7jnArXr30tm+AoSV018sfPnNPcGnGg2TGIVA=" }, "test-secret");
    expect(ok).toEqual({ valid: true, success: true });
    const failed = verifyPaymentCallback({ platform_order_id: "SP-1001", random_nr: "123456", status: "failed", signature: "IM9j4mV7jnArXr30tm+AoSV018sfPnNPcGnGg2TGIVA=" }, "test-secret");
    expect(failed).toEqual({ valid: true, success: false });
    const forged = verifyPaymentCallback({ platform_order_id: "SP-1002", random_nr: "123456", status: "success", signature: "IM9j4mV7jnArXr30tm+AoSV018sfPnNPcGnGg2TGIVA=" }, "test-secret");
    expect(forged.valid).toBe(false);
  });
});

describe("Shopier webhook", () => {
  const body = '{"id":"1"}';
  it("hex imzayı doğrular", () => {
    expect(verifyWebhookSignature(body, "b536f6db3da89fa6654998c6ef2c7d231672dc95a37582ab1589bba8bbab7aae", "whtoken")).toBe(true);
  });
  it("base64 imzayı doğrular", () => {
    const b64 = Buffer.from("b536f6db3da89fa6654998c6ef2c7d231672dc95a37582ab1589bba8bbab7aae", "hex").toString("base64");
    expect(verifyWebhookSignature(body, b64, "whtoken")).toBe(true);
  });
  it("yanlış anahtarı reddeder", () => {
    expect(verifyWebhookSignature(body, "b536f6db3da89fa6654998c6ef2c7d231672dc95a37582ab1589bba8bbab7aae", "baska")).toBe(false);
    expect(verifyWebhookSignature(body, null, "whtoken")).toBe(false);
  });
});

describe("Shopier REST istemcisi", () => {
  it("Bearer anahtarı gönderir ve sayfalama başlıklarını okur", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const fake = (async (url: URL | RequestInfo, init?: RequestInit) => {
      calls.push({ url: String(url), init: init! });
      const page = Number(new URL(String(url)).searchParams.get("page"));
      return new Response(JSON.stringify([{ id: `p${page}`, title: "x" }]), {
        status: 200,
        headers: { "Shopier-Pagination-Page": String(page), "Shopier-Pagination-Total-Pages": "2" },
      });
    }) as typeof fetch;
    const c = new ShopierClient("pat-123", "https://api.test/v1", fake);
    const all = await c.allProducts();
    expect(all.map((p) => p.id)).toEqual(["p1", "p2"]);
    expect((calls[0].init.headers as Record<string, string>).Authorization).toBe("Bearer pat-123");
    expect(calls[0].url).toContain("/products?limit=50&page=1");
  });

  it("403 hatasını anlaşılır mesajla fırlatır", async () => {
    const fake = (async () => new Response("", { status: 403 })) as typeof fetch;
    const c = new ShopierClient("pat", "https://api.test/v1", fake);
    await expect(c.listProducts()).rejects.toThrow(/yetki/);
  });
});
