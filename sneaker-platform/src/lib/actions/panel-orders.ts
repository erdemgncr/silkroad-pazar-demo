"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { OrderStatus } from "@/db/schema";
import { requirePanel } from "@/lib/panel";
import { PREVIEW_PREFIX, resolveSite } from "@/lib/site";
import { markOrderPaid } from "@/lib/orders";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";
import { orderShippedHtml, orderStatusHtml, sendMail } from "@/lib/mailer";
import { invalidate } from "@/lib/cache";
import { fulfillOnShopier } from "@/lib/shopier/sync";

export type FormState = { ok?: boolean; error?: string; message?: string } | null;

const STATUSES: OrderStatus[] = ["pending_payment", "paid", "preparing", "shipped", "delivered", "cancelled", "refunded"];

async function ownedOrder(orderId: number) {
  const ctx = await requirePanel();
  const order = await db.query.orders.findFirst({ where: eq(schema.orders.id, orderId) });
  if (!order) throw new Error("Sipariş bulunamadı");
  const site = await db.query.sites.findFirst({ where: eq(schema.sites.id, order.siteId) });
  if (!site || (!ctx.isPlatform && site.merchantId !== ctx.merchant?.id)) throw new Error("Sipariş bulunamadı");
  const sctx = await resolveSite(`${PREVIEW_PREFIX}${site.slug}`);
  if (!sctx) throw new Error("Site bulunamadı");
  return { ctx, order, site: sctx };
}

/** İptal/iade edilen ödenmiş siparişin ürünlerini stoğa geri ekler. */
async function restock(orderId: number, catalogKey: string) {
  const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, orderId));
  for (const it of items) {
    if (!it.productId) continue;
    const p = await db.query.products.findFirst({ where: eq(schema.products.id, it.productId) });
    if (!p) continue;
    const variants = p.variants.map((v) => (v.size === it.size ? { ...v, stock: v.stock + it.quantity } : v));
    await db.update(schema.products).set({ variants, updatedAt: new Date() }).where(eq(schema.products.id, p.id));
  }
  invalidate(`catalog:${catalogKey}`);
}

export async function updateOrder(orderId: number, _: FormState, form: FormData): Promise<FormState> {
  const { order, site } = await ownedOrder(orderId);
  const status = String(form.get("status") ?? order.status) as OrderStatus;
  if (!STATUSES.includes(status)) return { error: "Geçersiz durum." };
  const shippingCompany = String(form.get("shippingCompany") ?? "").trim() || null;
  const trackingNo = String(form.get("trackingNo") ?? "").trim() || null;
  const adminNote = String(form.get("adminNote") ?? "").trim() || null;
  const notifyCustomer = form.get("notifyCustomer") === "on";
  const doRestock = form.get("restock") === "on";
  if (status === "shipped" && (!shippingCompany || !trackingNo)) return { error: "Kargoya verildi durumu için kargo firması ve takip numarası girin." };

  const msgs: string[] = [];
  // Ödeme bekleyen sipariş elle onaylanırsa stok düşümü ve e-postalar normal akışla yapılır.
  if (order.status === "pending_payment" && status !== "pending_payment" && status !== "cancelled") {
    await markOrderPaid(site, order.orderNo, { ref: "panel" });
    msgs.push("ödeme onaylandı ve stok düşüldü");
  }
  await db.update(schema.orders).set({ status, shippingCompany, trackingNo, adminNote, updatedAt: new Date() }).where(eq(schema.orders.id, order.id));

  const wasPaid = ["paid", "preparing", "shipped", "delivered"].includes(order.status);
  if ((status === "cancelled" || status === "refunded") && wasPaid && doRestock) {
    await restock(order.id, site.catalogKey);
    msgs.push("ürünler stoğa geri eklendi");
  }

  if (status === "shipped" && order.shopierOrderId && (order.status !== "shipped" || order.trackingNo !== trackingNo)) {
    try {
      const r = await fulfillOnShopier(order.id);
      if (!r.skipped) msgs.push("kargo bilgisi Shopier'e iletildi");
    } catch (e) {
      msgs.push(`Shopier'e iletilemedi: ${(e as Error).message}`);
    }
  }

  if (notifyCustomer && (status !== order.status || trackingNo !== order.trackingNo)) {
    const color = site.settings.colors.primary;
    const html =
      status === "shipped"
        ? orderShippedHtml(site.name, color, site.baseUrl, { orderNo: order.orderNo, firstName: order.firstName, company: shippingCompany!, trackingNo: trackingNo! })
        : orderStatusHtml(site.name, color, site.baseUrl, { orderNo: order.orderNo, firstName: order.firstName, statusLabel: ORDER_STATUS_LABEL[status], note: String(form.get("customerNote") ?? "").trim() || undefined });
    const r = await sendMail({
      to: order.email,
      subject: status === "shipped" ? `${site.name} - ${order.orderNo} numaralı siparişin kargoya verildi` : `${site.name} - ${order.orderNo} sipariş durumu: ${ORDER_STATUS_LABEL[status]}`,
      html,
      template: status === "shipped" ? "order_shipped" : "order_status",
      siteId: site.id,
      merchantId: site.merchantId,
      fromName: site.name,
      replyTo: site.settings.contact.email || undefined,
    });
    msgs.push(r.status === "sent" ? "müşteriye e-posta gönderildi" : r.status === "logged" ? "e-posta kaydedildi (SMTP tanımlı değil)" : `e-posta gönderilemedi: ${r.error}`);
  }
  revalidatePath(`/panel/siparisler/${order.id}`);
  revalidatePath("/panel/siparisler");
  return { ok: true, message: `Kaydedildi${msgs.length ? `: ${msgs.join(", ")}` : "."}` };
}

export async function resendConfirmation(orderId: number): Promise<FormState> {
  const { order, site } = await ownedOrder(orderId);
  const r = await sendMail({
    to: order.email,
    subject: `${site.name} - ${order.orderNo} sipariş durumu: ${ORDER_STATUS_LABEL[order.status]}`,
    html: orderStatusHtml(site.name, site.settings.colors.primary, site.baseUrl, { orderNo: order.orderNo, firstName: order.firstName, statusLabel: ORDER_STATUS_LABEL[order.status] }),
    template: "order_status",
    siteId: site.id,
    merchantId: site.merchantId,
    fromName: site.name,
  });
  revalidatePath(`/panel/siparisler/${order.id}`);
  return r.status === "failed" ? { error: r.error } : { ok: true, message: r.status === "sent" ? "E-posta gönderildi." : "SMTP tanımlı değil; e-posta kaydedildi." };
}
