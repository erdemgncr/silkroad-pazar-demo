import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getPlatformSetting } from "@/lib/platform-settings";
import { verifyPaymentCallback, type PaymentCallback } from "@/lib/shopier/payment";
import { applyPaidInvoice, invoiceIdFromNo } from "@/lib/billing";

/**
 * Abonelik ödemesi Shopier dönüşü. Platformun Shopier ödeme modülünde geri dönüş adresi olarak
 *   {PLATFORM_URL}/api/billing/shopier
 * tanımlanmalıdır.
 */
export async function POST(req: Request) {
  const billing = await getPlatformSetting("billing");
  if (!billing.shopierApiSecret) return new Response("Billing not configured", { status: 400 });
  const form = await req.formData();
  const data = Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)])) as PaymentCallback;
  const { valid, success } = verifyPaymentCallback(data, billing.shopierApiSecret);
  const id = invoiceIdFromNo(data.platform_order_id ?? "");
  if (!valid || !id) return new Response("Geçersiz imza", { status: 400 });
  if (success) {
    await applyPaidInvoice(id, { provider: "shopier", ref: data.payment_id ?? null });
    return new Response(null, { status: 303, headers: { Location: `/panel/abonelik/${id}?odeme=ok` } });
  }
  await db.update(schema.subscriptionInvoices).set({ status: "failed" }).where(eq(schema.subscriptionInvoices.id, id));
  return new Response(null, { status: 303, headers: { Location: `/panel/abonelik/${id}?odeme=hata` } });
}
