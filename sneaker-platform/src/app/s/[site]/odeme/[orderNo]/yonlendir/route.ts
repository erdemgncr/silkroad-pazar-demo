import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { resolveSite } from "@/lib/site";
import { paymentConfig } from "@/lib/payment-config";
import { autoSubmitHtml, buildPaymentFields } from "@/lib/shopier/payment";

function html(body: string, status = 200) {
  return new Response(body, { status, headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex", "Cache-Control": "no-store" } });
}

function errorPage(siteName: string, message: string) {
  return html(
    `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ödeme başlatılamadı</title></head>
<body style="font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;background:#f6f6f6"><div style="max-width:420px;text-align:center;padding:24px">
<h1 style="font-size:20px">Ödeme başlatılamadı</h1><p style="color:#555">${message.replace(/</g, "&lt;")}</p>
<p style="color:#777;font-size:13px">${siteName.replace(/</g, "&lt;")} müşteri hizmetleriyle iletişime geçebilirsin.</p><a href="/sepet" style="display:inline-block;margin-top:12px;padding:12px 20px;background:#111;color:#fff;border-radius:8px;text-decoration:none">Sepete Dön</a></div></body></html>`,
    400,
  );
}

export async function GET(_req: Request, ctx: RouteContext<"/s/[site]/odeme/[orderNo]/yonlendir">) {
  const { site: key, orderNo } = await ctx.params;
  const site = await resolveSite(key);
  if (!site) return new Response("Not found", { status: 404 });
  const order = await db.query.orders.findFirst({ where: and(eq(schema.orders.orderNo, orderNo), eq(schema.orders.siteId, site.id)) });
  if (!order) return errorPage(site.name, "Sipariş bulunamadı.");
  if (order.status !== "pending_payment") return Response.redirect(new URL(`/odeme/sonuc/${order.orderNo}`, site.baseUrl), 303);

  const cfg = await paymentConfig(site);
  if (cfg.mode === "invalid") return errorPage(site.name, `Ödeme altyapısı yapılandırılmamış: ${cfg.reason}`);
  if (cfg.mode === "demo") return new Response(null, { status: 303, headers: { Location: `/odeme/${order.orderNo}/demo` } });

  const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, order.id));

  if (cfg.mode === "hosted") {
    // Shopier'in kendi ödeme sayfası ürün bazlıdır; yalnızca tek ürünlü sepetlerde kullanılabilir.
    if (items.length !== 1 || !items[0].productId) return errorPage(site.name, "Bu sitede sepette tek ürün ile ödeme yapılabilir.");
    const link = await db.query.productShopierLinks.findFirst({
      where: and(eq(schema.productShopierLinks.productId, items[0].productId), eq(schema.productShopierLinks.shopierAccountId, cfg.accountId)),
    });
    if (!link?.shopierProductId) return errorPage(site.name, "Ürün Shopier'e aktarılmamış.");
    return html(
      autoSubmitHtml(`https://www.shopier.com/s/shipping/${encodeURIComponent(cfg.shopSlug)}`, { product_id: link.shopierProductId, quantity: String(items[0].quantity) }, "Shopier güvenli ödeme sayfasına yönlendiriliyorsunuz"),
    );
  }

  const s = order.shippingAddress;
  const b = order.billingAddress;
  const fields = buildPaymentFields({
    apiKey: cfg.apiKey,
    apiSecret: cfg.apiSecret,
    websiteIndex: cfg.websiteIndex,
    orderId: order.orderNo,
    total: (order.total / 100).toFixed(2),
    productName: items.length === 1 ? `${items[0].title} (Beden ${items[0].size})` : `${site.name} siparişi ${order.orderNo} (${items.reduce((a, i) => a + i.quantity, 0)} ürün)`,
    buyer: {
      id: String(order.customerId ?? order.id),
      firstName: order.firstName,
      lastName: order.lastName,
      email: order.email,
      phone: order.phone.replace(/\D/g, ""),
      accountAgeDays: 0,
    },
    billing: { address: `${b.line} ${b.district}`, city: b.city, country: "Türkiye", postcode: b.postcode ?? "" },
    shipping: { address: `${s.line} ${s.district}`, city: s.city, country: "Türkiye", postcode: s.postcode ?? "" },
    callbackUrl: `${site.baseUrl}/api/shopier/callback`,
  });
  return html(autoSubmitHtml("https://www.shopier.com/ShowProduct/api_pay4.php", fields, "Shopier güvenli ödeme sayfasına yönlendiriliyorsunuz"));
}
