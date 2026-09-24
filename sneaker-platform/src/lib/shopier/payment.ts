import { createHmac, randomInt, timingSafeEqual } from "crypto";

/**
 * Shopier Ödeme Modülü (api_pay4).
 * Bir Shopier hesabına Modül Yönetimi'nden en fazla 5 web sitesi bağlanabilir (website_index 1-5);
 * her site kendi geri dönüş (callback) adresine sahiptir.
 *
 * İmza: base64(HMAC-SHA256(random_nr + platform_order_id + total_order_value + currency, API_SECRET))
 * Dönüş doğrulaması: base64(HMAC-SHA256(random_nr + platform_order_id, API_SECRET)) === signature
 */
export const SHOPIER_PAYMENT_URL = "https://www.shopier.com/ShowProduct/api_pay4.php";

export const SHOPIER_CURRENCY = { TRY: 0, USD: 1, EUR: 2 } as const;
export const SHOPIER_PRODUCT_TYPE = { REAL: 0, DOWNLOADABLE_VIRTUAL: 1, DEFAULT: 2 } as const;

export type PaymentBuyer = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  accountAgeDays?: number;
};
export type PaymentAddress = { address: string; city: string; country: string; postcode: string };

export type PaymentRequest = {
  apiKey: string;
  apiSecret: string;
  websiteIndex: number;
  orderId: string;
  /** TL cinsinden, "1299.90" biçiminde */
  total: string;
  productName: string;
  buyer: PaymentBuyer;
  billing: PaymentAddress;
  shipping: PaymentAddress;
  currency?: keyof typeof SHOPIER_CURRENCY;
  callbackUrl?: string;
  randomNr?: number;
};

export function paymentSignature(apiSecret: string, randomNr: number | string, orderId: string, total: string, currency: number | string): string {
  return createHmac("sha256", apiSecret).update(`${randomNr}${orderId}${total}${currency}`).digest("base64");
}

/** Shopier'e POST edilecek form alanlarını üretir. */
export function buildPaymentFields(req: PaymentRequest): Record<string, string> {
  if (req.websiteIndex < 1 || req.websiteIndex > 5) throw new Error("website_index 1 ile 5 arasında olmalıdır");
  const currency = SHOPIER_CURRENCY[req.currency ?? "TRY"];
  const randomNr = req.randomNr ?? randomInt(100000, 999999);
  const fields: Record<string, string> = {
    API_key: req.apiKey,
    website_index: String(req.websiteIndex),
    platform_order_id: req.orderId,
    product_name: req.productName.slice(0, 250),
    product_type: String(SHOPIER_PRODUCT_TYPE.REAL),
    buyer_name: req.buyer.firstName,
    buyer_surname: req.buyer.lastName,
    buyer_email: req.buyer.email,
    buyer_account_age: String(req.buyer.accountAgeDays ?? 0),
    buyer_id_nr: req.buyer.id,
    buyer_phone: req.buyer.phone,
    billing_address: req.billing.address,
    billing_city: req.billing.city,
    billing_country: req.billing.country,
    billing_postcode: req.billing.postcode || "00000",
    shipping_address: req.shipping.address,
    shipping_city: req.shipping.city,
    shipping_country: req.shipping.country,
    shipping_postcode: req.shipping.postcode || "00000",
    total_order_value: req.total,
    currency: String(currency),
    platform: "0",
    is_in_frame: "0",
    current_language: "0",
    modul_version: "1.0.4",
    random_nr: String(randomNr),
    signature: paymentSignature(req.apiSecret, randomNr, req.orderId, req.total, currency),
  };
  if (req.callbackUrl) fields.callback = req.callbackUrl;
  return fields;
}

export type PaymentCallback = {
  platform_order_id?: string;
  status?: string;
  installment?: string;
  payment_id?: string;
  random_nr?: string;
  signature?: string;
  API_key?: string;
};

/** Shopier'den dönen ödeme sonucunu doğrular. */
export function verifyPaymentCallback(data: PaymentCallback, apiSecret: string): { valid: boolean; success: boolean } {
  const { platform_order_id, random_nr, signature, status } = data;
  if (!platform_order_id || !random_nr || !signature) return { valid: false, success: false };
  const expected = createHmac("sha256", apiSecret).update(`${random_nr}${platform_order_id}`).digest();
  let given: Buffer;
  try {
    given = Buffer.from(signature, "base64");
  } catch {
    return { valid: false, success: false };
  }
  const valid = given.length === expected.length && timingSafeEqual(given, expected);
  return { valid, success: valid && String(status).toLowerCase() === "success" };
}

/** Test/demoda sahte Shopier dönüşü üretmek için. */
export function signCallbackForTest(apiSecret: string, orderId: string, randomNr: string) {
  return createHmac("sha256", apiSecret).update(`${randomNr}${orderId}`).digest("base64");
}

export function autoSubmitHtml(action: string, fields: Record<string, string>, title = "Ödeme sayfasına yönlendiriliyorsunuz"): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const inputs = Object.entries(fields)
    .map(([k, v]) => `<input type="hidden" name="${esc(k)}" value="${esc(v)}">`)
    .join("");
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<style>body{font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;background:#f6f6f6;color:#111}div{text-align:center}button{margin-top:16px;padding:12px 24px;border:0;border-radius:8px;background:#111;color:#fff;font-weight:600}</style></head>
<body><div><p>${esc(title)}…</p><form id="f" method="post" action="${esc(action)}">${inputs}<noscript><button type="submit">Ödemeye devam et</button></noscript></form></div>
<script>document.getElementById("f").submit();</script></body></html>`;
}
