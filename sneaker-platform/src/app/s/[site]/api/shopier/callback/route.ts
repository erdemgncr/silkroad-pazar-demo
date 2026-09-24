import { resolveSite } from "@/lib/site";
import { callbackSecret } from "@/lib/payment-config";
import { verifyPaymentCallback, type PaymentCallback } from "@/lib/shopier/payment";
import { markOrderFailed, markOrderPaid } from "@/lib/orders";

/**
 * Shopier ödeme modülü geri dönüşü. Shopier, ödeme sonrası müşterinin tarayıcısını bu adrese POST eder.
 * Shopier panelinde (Entegrasyonlar > Modül Yönetimi) bu sitenin geri dönüş adresi olarak
 *   https://{alanadi}/api/shopier/callback
 * tanımlanmalıdır.
 */
export async function POST(req: Request, ctx: RouteContext<"/s/[site]/api/shopier/callback">) {
  const { site: key } = await ctx.params;
  const site = await resolveSite(key);
  if (!site) return new Response("Not found", { status: 404 });
  const form = await req.formData();
  const data = Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)])) as PaymentCallback;
  const secret = await callbackSecret(site);
  if (!secret) return new Response("Payment not configured", { status: 400 });
  const { valid, success } = verifyPaymentCallback(data, secret);
  if (!valid || !data.platform_order_id) {
    console.warn("[shopier] geçersiz imza", site.slug, data.platform_order_id);
    return new Response("Geçersiz imza", { status: 400 });
  }
  const orderNo = data.platform_order_id;
  if (success) {
    await markOrderPaid(site, orderNo, { ref: data.payment_id, installment: data.installment ? Number(data.installment) : undefined });
    return new Response(null, { status: 303, headers: { Location: `/odeme/sonuc/${orderNo}` } });
  }
  await markOrderFailed(site, orderNo);
  return new Response(null, { status: 303, headers: { Location: `/odeme/sonuc/${orderNo}?durum=hata` } });
}
