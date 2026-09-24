import "server-only";
import { and, eq, isNull, or, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { OrderAddress } from "@/db/schema";
import type { SiteContext } from "@/lib/site";
import { getCatalog } from "@/lib/catalog";
import { invalidate } from "@/lib/cache";
import { formatPrice } from "@/lib/format";
import { orderConfirmationHtml, sendMail } from "@/lib/mailer";

export type CartInput = { productId: number; size: string; quantity: number }[];

export type PricedLine = {
  productId: number;
  slug: string;
  title: string;
  brand: string;
  colorName: string;
  image: string;
  size: string;
  quantity: number;
  unitPrice: number;
  compareAtPrice: number | null;
  available: number;
  problem?: string;
};

export type Pricing = {
  lines: PricedLine[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  coupon: { code: string; label: string } | null;
  couponError: string | null;
  freeShippingLeft: number;
  hasProblems: boolean;
};

async function findCoupon(site: SiteContext, code: string) {
  const c = await db.query.coupons.findFirst({
    where: and(
      eq(schema.coupons.code, code.trim().toUpperCase()),
      eq(schema.coupons.active, true),
      or(eq(schema.coupons.siteId, site.id), and(isNull(schema.coupons.siteId), eq(schema.coupons.merchantId, site.merchantId)), and(isNull(schema.coupons.siteId), isNull(schema.coupons.merchantId))),
    ),
  });
  return c ?? null;
}

/** Sepeti güncel katalog fiyatı ve stoğuyla yeniden hesaplar (istemciden gelen fiyatlara güvenilmez). */
export async function priceCart(site: SiteContext, cart: CartInput, couponCode?: string | null): Promise<Pricing> {
  const all = await getCatalog(site);
  const byId = new Map(all.map((p) => [p.id, p]));
  const lines: PricedLine[] = [];
  for (const item of cart.slice(0, 50)) {
    const p = byId.get(item.productId);
    const qty = Math.max(1, Math.min(10, Math.floor(item.quantity)));
    if (!p) {
      lines.push({ productId: item.productId, slug: "", title: "Ürün artık satışta değil", brand: "", colorName: "", image: "", size: item.size, quantity: qty, unitPrice: 0, compareAtPrice: null, available: 0, problem: "Ürün satıştan kaldırıldı" });
      continue;
    }
    const v = p.variants.find((x) => x.size === item.size);
    const available = v?.stock ?? 0;
    const upcoming = p.releaseDate && p.releaseDate > new Date();
    lines.push({
      productId: p.id,
      slug: p.slug,
      title: p.title,
      brand: p.brand,
      colorName: p.colorName,
      image: p.images[0]?.url ?? "",
      size: item.size,
      quantity: qty,
      unitPrice: p.price,
      compareAtPrice: p.compareAtPrice,
      available,
      problem: upcoming ? "Henüz satışa çıkmadı" : available < 1 ? "Bu beden tükendi" : available < qty ? `Stokta yalnızca ${available} adet var` : undefined,
    });
  }
  const valid = lines.filter((l) => !l.problem);
  const subtotal = valid.reduce((a, l) => a + l.unitPrice * l.quantity, 0);
  let discount = 0;
  let coupon: Pricing["coupon"] = null;
  let couponError: string | null = null;
  if (couponCode?.trim()) {
    const c = await findCoupon(site, couponCode);
    const now = new Date();
    if (!c) couponError = "Kupon kodu geçersiz.";
    else if ((c.startsAt && c.startsAt > now) || (c.endsAt && c.endsAt < now)) couponError = "Bu kuponun süresi geçerli değil.";
    else if (c.usageLimit != null && c.usedCount >= c.usageLimit) couponError = "Bu kuponun kullanım limiti doldu.";
    else if (subtotal < c.minTotal) couponError = `Bu kupon ${formatPrice(c.minTotal)} ve üzeri alışverişlerde geçerli.`;
    else {
      discount = c.type === "percent" ? Math.round((subtotal * c.value) / 100) : Math.min(c.value, subtotal);
      coupon = { code: c.code, label: c.type === "percent" ? `%${c.value} indirim` : `${formatPrice(c.value)} indirim` };
    }
  }
  const threshold = site.settings.shipping.freeShippingThreshold * 100;
  const afterDiscount = subtotal - discount;
  const shippingFee = subtotal === 0 || afterDiscount >= threshold ? 0 : site.settings.shipping.fee * 100;
  return {
    lines,
    subtotal,
    discount,
    shippingFee,
    total: afterDiscount + shippingFee,
    coupon,
    couponError,
    freeShippingLeft: Math.max(0, threshold - afterDiscount),
    hasProblems: lines.some((l) => l.problem),
  };
}

export function newOrderNo(site: SiteContext): string {
  const prefix = site.slug.replace(/[^a-z]/g, "").slice(0, 2).toUpperCase() || "SP";
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `${prefix}${ymd}${Math.floor(100000 + Math.random() * 900000)}`;
}

export type PlaceOrderInput = {
  cart: CartInput;
  couponCode?: string | null;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  shipping: OrderAddress;
  billing: OrderAddress & { company?: string; taxOffice?: string; taxNumber?: string; nationalId?: string };
  note?: string;
  customerId?: number | null;
};

export async function createOrder(site: SiteContext, input: PlaceOrderInput) {
  const pricing = await priceCart(site, input.cart, input.couponCode);
  if (pricing.hasProblems) return { ok: false as const, pricing, message: "Sepetindeki bazı ürünlerin stok durumu değişti. Lütfen sepetini kontrol et." };
  if (!pricing.lines.length) return { ok: false as const, pricing, message: "Sepetin boş." };
  const orderNo = newOrderNo(site);
  const order = await db.transaction(async (tx) => {
    const [o] = await tx
      .insert(schema.orders)
      .values({
        siteId: site.id,
        orderNo,
        customerId: input.customerId ?? null,
        email: input.email,
        phone: input.phone,
        firstName: input.firstName,
        lastName: input.lastName,
        shippingAddress: input.shipping,
        billingAddress: input.billing,
        subtotal: pricing.subtotal,
        discount: pricing.discount,
        shippingFee: pricing.shippingFee,
        total: pricing.total,
        couponCode: pricing.coupon?.code ?? null,
        note: input.note || null,
        status: "pending_payment",
        paymentProvider: site.paymentMode === "demo" ? "demo" : "shopier",
      })
      .returning();
    await tx.insert(schema.orderItems).values(
      pricing.lines.map((l) => ({
        orderId: o.id,
        productId: l.productId,
        title: `${l.title} - ${l.colorName}`,
        brand: l.brand,
        size: l.size,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        image: l.image,
      })),
    );
    return o;
  });
  return { ok: true as const, order, pricing };
}

/** Ödeme onaylandığında: durum güncellenir, stok düşülür, kupon sayacı artar, e-posta gönderilir. Tekrar çağrılırsa (idempotent) bir şey yapmaz. */
export async function markOrderPaid(site: SiteContext, orderNo: string, payment: { ref?: string; installment?: number }) {
  const result = await db.transaction(async (tx) => {
    const [o] = await tx
      .select()
      .from(schema.orders)
      .where(and(eq(schema.orders.orderNo, orderNo), eq(schema.orders.siteId, site.id)))
      .for("update");
    if (!o) return null;
    if (o.status !== "pending_payment") return { order: o, changed: false };
    const items = await tx.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, o.id));
    for (const it of items) {
      if (!it.productId) continue;
      const [p] = await tx.select().from(schema.products).where(eq(schema.products.id, it.productId)).for("update");
      if (!p) continue;
      const variants = p.variants.map((v) => (v.size === it.size ? { ...v, stock: Math.max(0, v.stock - it.quantity) } : v));
      await tx.update(schema.products).set({ variants, popularity: p.popularity + it.quantity * 5, updatedAt: new Date() }).where(eq(schema.products.id, p.id));
    }
    if (o.couponCode) {
      await tx
        .update(schema.coupons)
        .set({ usedCount: sql`${schema.coupons.usedCount} + 1` })
        .where(eq(schema.coupons.code, o.couponCode));
    }
    const [updated] = await tx
      .update(schema.orders)
      .set({ status: "paid", paymentRef: payment.ref ?? null, installment: payment.installment ?? null, updatedAt: new Date() })
      .where(eq(schema.orders.id, o.id))
      .returning();
    return { order: updated, changed: true, items };
  });
  if (result?.changed) {
    invalidate(`catalog:${site.catalogKey}`);
    const o = result.order;
    const a = o.shippingAddress;
    void sendMail({
      to: o.email,
      subject: `${site.name} - ${o.orderNo} numaralı siparişin alındı`,
      fromName: site.name,
      replyTo: site.settings.contact.email || undefined,
      html: orderConfirmationHtml(site.name, site.settings.colors.primary, site.baseUrl, {
        orderNo: o.orderNo,
        firstName: o.firstName,
        total: o.total,
        subtotal: o.subtotal,
        discount: o.discount,
        shippingFee: o.shippingFee,
        items: (result.items ?? []).map((i) => ({ title: i.title, size: i.size, quantity: i.quantity, unitPrice: i.unitPrice })),
        address: `${a.line}, ${a.district} / ${a.city}`,
      }),
    });
    // Satış sonrası stoklar Shopier'e aktarılır (bağlıysa).
    void import("@/lib/shopier/sync").then((m) => m.pushStockForOrder(site, o.id)).catch((e) => console.error("[shopier] stok aktarımı", e));
  }
  return result?.order ?? null;
}

export async function markOrderFailed(site: SiteContext, orderNo: string) {
  await db
    .update(schema.orders)
    .set({ status: "cancelled", adminNote: "Ödeme başarısız / iptal edildi", updatedAt: new Date() })
    .where(and(eq(schema.orders.orderNo, orderNo), eq(schema.orders.siteId, site.id), eq(schema.orders.status, "pending_payment")));
}

export { ORDER_STATUS_LABEL } from "@/lib/order-status";
