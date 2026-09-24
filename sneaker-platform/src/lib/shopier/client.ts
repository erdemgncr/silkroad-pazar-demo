import { createHmac, timingSafeEqual } from "crypto";

/**
 * Shopier REST API (https://api.shopier.com/v1) istemcisi.
 * Kimlik doğrulama: Kişisel Erişim Anahtarı (PAT) ile "Authorization: Bearer ...".
 * Sayfalama bilgisi yanıt başlıklarında gelir: Shopier-Pagination-Page / -Limit / -Total-Pages / -Total-Items.
 * Not: Ürün uç noktaları için mağazanın Shopier tarafından ürün API'sine yetkilendirilmiş olması gerekebilir
 * (aksi halde 403 döner; destek: hello@shopier.com).
 */
export const SHOPIER_API_BASE = process.env.SHOPIER_API_BASE ?? "https://api.shopier.com/v1";

export type ShopierMedia = { id?: string; type: "image"; url: string; placement: number };
export type ShopierPriceData = { currency: "TRY" | "USD" | "EUR"; price: string; discount?: boolean; discountedPrice?: string; shippingPrice?: string };
export type ShopierVariant = {
  variationId?: string;
  variationTitle?: string;
  selectionId?: string | string[];
  selectionTitle?: string;
  stockStatus?: "inStock" | "outOfStock";
  stockQuantity: number;
  priceData?: Pick<ShopierPriceData, "currency" | "price">;
  primary?: boolean;
};
export type ShopierProduct = {
  id: string;
  title: string;
  description?: string;
  type: "physical" | "digital";
  url?: string;
  dateCreated?: string;
  media: ShopierMedia[];
  priceData: ShopierPriceData;
  stockStatus?: "inStock" | "outOfStock";
  stockQuantity?: number;
  shippingPayer?: "sellerPays" | "buyerPays";
  categories?: { id?: string; categoryId?: string; title?: string }[];
  variants?: ShopierVariant[];
  dispatchDuration?: number;
};
export type ShopierProductInput = {
  title: string;
  description?: string;
  type: "physical" | "digital";
  media: { type: "image"; url: string; placement: number }[];
  priceData: ShopierPriceData;
  stockQuantity?: number;
  shippingPayer: "sellerPays" | "buyerPays";
  categories?: { categoryId: string }[];
  variants?: { selectionId: string[]; stockQuantity: number; priceData?: Pick<ShopierPriceData, "currency" | "price">; primary?: boolean }[];
  dispatchDuration?: 1 | 2 | 3;
  customNote?: string;
};
export type ShopierCategory = { id: string; title: string; placement?: number };
export type ShopierVariation = { id: string; title: string; placement?: number };
export type ShopierSelection = { id: string; title: string; variationId: string };
export type ShopierOrder = {
  id: string;
  status: string;
  paymentStatus: string;
  dateCreated: string;
  currency: string;
  totals: { subtotal: string; shipping: string; discount: string; total: string };
  shippingInfo: { firstName: string; lastName: string; email: string; phone: string; address: string; district: string; city: string; postcode?: string; country: string };
  billingInfo?: { firstName: string; lastName: string; email: string; phone: string; address: string; district: string; city: string; postcode?: string; country: string };
  note?: string;
  lineItems: { productId: string; title: string; quantity: number; price: string; selection?: { id: string; title: string; variationTitle: string }[] }[];
};
export type ShopierWebhook = { id: string; event: string; url: string; token?: string };
export type ShopierShippingCompany = "yurtici" | "mng" | "ptt" | "aras" | "surat" | "ups" | "fedex" | "dhl" | "tnt" | "pts" | "aramex" | "interGlobal" | "other";

export class ShopierApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: unknown,
  ) {
    super(message);
  }
}

export type Page<T> = { items: T[]; page: number; totalPages: number; totalItems: number };

export class ShopierClient {
  constructor(
    private pat: string,
    private base = SHOPIER_API_BASE,
    private fetchImpl: typeof fetch = fetch,
  ) {}

  private async request<T>(method: "GET" | "POST" | "PUT" | "DELETE", path: string, opts: { query?: Record<string, string | number | undefined>; body?: unknown } = {}): Promise<{ data: T; headers: Headers }> {
    const url = new URL(`${this.base}${path}`);
    for (const [k, v] of Object.entries(opts.query ?? {})) if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
    let attempt = 0;
    for (;;) {
      attempt++;
      const res = await this.fetchImpl(url, {
        method,
        headers: {
          Authorization: `Bearer ${this.pat}`,
          Accept: "application/json",
          ...(opts.body ? { "Content-Type": "application/json" } : {}),
        },
        body: opts.body ? JSON.stringify(opts.body) : undefined,
        signal: AbortSignal.timeout(20_000),
      });
      const retryable = res.status === 429 || (method !== "POST" && res.status >= 500);
      if (retryable && attempt < 3) {
        const ra = Number(res.headers.get("retry-after"));
        await new Promise((r) => setTimeout(r, Number.isFinite(ra) && ra > 0 ? Math.min(ra * 1000, 8000) : 400 * 2 ** attempt));
        continue;
      }
      const text = await res.text();
      let body: unknown = null;
      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        body = text;
      }
      if (!res.ok) {
        const apiMessage = body && typeof body === "object" && "message" in body ? String((body as { message: unknown }).message) : "";
        const msg =
          apiMessage ||
          (res.status === 401 ? "Erişim anahtarı geçersiz" : res.status === 403 ? "Bu işlem için yetki yok (ürün API'si Shopier tarafından etkinleştirilmemiş olabilir)" : `Shopier API hatası (${res.status})`);
        throw new ShopierApiError(msg, res.status, body);
      }
      return { data: body as T, headers: res.headers };
    }
  }

  private async list<T>(path: string, query: Record<string, string | number | undefined> = {}): Promise<Page<T>> {
    const { data, headers } = await this.request<T[]>("GET", path, { query: { limit: 50, ...query } });
    return {
      items: Array.isArray(data) ? data : [],
      page: Number(headers.get("shopier-pagination-page") ?? query.page ?? 1),
      totalPages: Number(headers.get("shopier-pagination-total-pages") ?? 1),
      totalItems: Number(headers.get("shopier-pagination-total-items") ?? (Array.isArray(data) ? data.length : 0)),
    };
  }

  async listAll<T>(path: string, query: Record<string, string | number | undefined> = {}, maxPages = 200): Promise<T[]> {
    const out: T[] = [];
    for (let page = 1; page <= maxPages; page++) {
      const r = await this.list<T>(path, { ...query, page });
      out.push(...r.items);
      if (page >= r.totalPages || r.items.length === 0) break;
    }
    return out;
  }

  /* Mağaza */
  shopSettings() {
    return this.request<Record<string, unknown>>("GET", "/shop/settings").then((r) => r.data);
  }
  shopOwner() {
    return this.request<Record<string, unknown>>("GET", "/shop/owner").then((r) => r.data);
  }

  /* Ürünler */
  listProducts(page = 1) {
    return this.list<ShopierProduct>("/products", { page });
  }
  allProducts() {
    return this.listAll<ShopierProduct>("/products");
  }
  getProduct(id: string) {
    return this.request<ShopierProduct>("GET", `/products/${encodeURIComponent(id)}`).then((r) => r.data);
  }
  createProduct(input: ShopierProductInput) {
    return this.request<ShopierProduct>("POST", "/products", { body: input }).then((r) => r.data);
  }
  updateProduct(id: string, input: Partial<ShopierProductInput>) {
    return this.request<ShopierProduct>("PUT", `/products/${encodeURIComponent(id)}`, { body: input }).then((r) => r.data);
  }
  deleteProduct(id: string) {
    return this.request<unknown>("DELETE", `/products/${encodeURIComponent(id)}`).then(() => undefined);
  }

  /* Kategoriler, varyasyonlar, seçimler */
  allCategories() {
    return this.listAll<ShopierCategory>("/categories");
  }
  createCategory(title: string) {
    return this.request<ShopierCategory>("POST", "/categories", { body: { title } }).then((r) => r.data);
  }
  allVariations() {
    return this.listAll<ShopierVariation>("/variations");
  }
  createVariation(title: string) {
    return this.request<ShopierVariation>("POST", "/variations", { body: { title } }).then((r) => r.data);
  }
  allSelections(variationId?: string) {
    return this.listAll<ShopierSelection>("/selections", { variationId });
  }
  createSelection(variationId: string, title: string) {
    return this.request<ShopierSelection>("POST", "/selections", { body: { variationId, title } }).then((r) => r.data);
  }

  /* Siparişler */
  listOrders(dateStart: string, dateEnd: string, page = 1) {
    // Not: Shopier, tarih aralığı verilmezse boş liste döndürür.
    return this.list<ShopierOrder>("/orders", { dateStart, dateEnd, page });
  }
  getOrder(id: string) {
    return this.request<ShopierOrder>("GET", `/orders/${encodeURIComponent(id)}`).then((r) => r.data);
  }
  fulfillOrder(id: string, input: { shippingCompany: ShopierShippingCompany; trackingNumber: string; note?: string }) {
    return this.request<ShopierOrder>("PUT", `/orders/${encodeURIComponent(id)}`, { body: { fulfillments: { productType: "physical", ...input } } }).then((r) => r.data);
  }

  /* Webhook abonelikleri */
  listWebhooks() {
    return this.request<ShopierWebhook[]>("GET", "/webhooks").then((r) => r.data ?? []);
  }
  createWebhook(event: string, url: string) {
    return this.request<ShopierWebhook>("POST", "/webhooks", { body: { event, url } }).then((r) => r.data);
  }
  deleteWebhook(id: string) {
    return this.request<unknown>("DELETE", `/webhooks/${encodeURIComponent(id)}`).then(() => undefined);
  }
}

export const WEBHOOK_EVENTS = ["product.created", "product.updated", "order.created", "order.addressUpdated", "order.fulfilled", "refund.requested", "refund.updated"] as const;

/** Webhook imzası: ham gövdenin HMAC-SHA256 değeri (hex ya da base64), Shopier-Signature başlığında. */
export function verifyWebhookSignature(rawBody: string, signature: string | null, token: string): boolean {
  if (!signature || !token) return false;
  const mac = createHmac("sha256", token).update(rawBody).digest();
  const hex = Buffer.from(mac.toString("hex"));
  const b64 = Buffer.from(mac.toString("base64"));
  const sig = Buffer.from(signature.trim());
  const sigLower = Buffer.from(signature.trim().toLowerCase());
  return (sigLower.length === hex.length && timingSafeEqual(sigLower, hex)) || (sig.length === b64.length && timingSafeEqual(sig, b64));
}

export function shippingCompanyCode(name: string): ShopierShippingCompany {
  const n = name.toLocaleLowerCase("tr-TR");
  if (n.includes("yurtiçi") || n.includes("yurtici")) return "yurtici";
  if (n.includes("mng")) return "mng";
  if (n.includes("ptt")) return "ptt";
  if (n.includes("aras")) return "aras";
  if (n.includes("sürat") || n.includes("surat")) return "surat";
  if (n.includes("ups")) return "ups";
  if (n.includes("dhl")) return "dhl";
  if (n.includes("fedex")) return "fedex";
  return "other";
}
