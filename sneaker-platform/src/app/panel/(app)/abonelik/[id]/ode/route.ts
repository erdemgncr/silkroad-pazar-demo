import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getAdminSession } from "@/lib/auth";
import { getPlatformSetting } from "@/lib/platform-settings";
import { PLANS } from "@/lib/plans";
import { invoiceNo } from "@/lib/billing";
import { SHOPIER_PAYMENT_URL, autoSubmitHtml, buildPaymentFields } from "@/lib/shopier/payment";
import { panelUrl } from "@/lib/notify";

/** Abonelik faturasını platformun Shopier ödeme modülüne yönlendirir. */
export async function GET(req: Request, ctx: RouteContext<"/panel/abonelik/[id]/ode">) {
  const s = await getAdminSession();
  if (!s) return NextResponse.redirect(new URL("/panel/giris", req.url));
  const { id } = await ctx.params;
  const inv = await db.query.subscriptionInvoices.findFirst({ where: eq(schema.subscriptionInvoices.id, Number(id)) });
  if (!inv || (s.mid && inv.merchantId !== s.mid) || inv.status !== "pending") return NextResponse.redirect(new URL("/panel/hesap?sekme=paket", req.url));
  const m = await db.query.merchants.findFirst({ where: eq(schema.merchants.id, inv.merchantId) });
  const billing = await getPlatformSetting("billing");
  if (!m || billing.mode !== "shopier" || !billing.shopierApiKey || !billing.shopierApiSecret) return NextResponse.redirect(new URL(`/panel/abonelik/${inv.id}`, req.url));
  const [first, ...rest] = (m.companyInfo.legalName || m.name).split(" ");
  const address = { address: m.companyInfo.address || "Türkiye", city: "İstanbul", country: "Türkiye", postcode: "34000" };
  const fields = buildPaymentFields({
    apiKey: billing.shopierApiKey,
    apiSecret: billing.shopierApiSecret,
    websiteIndex: billing.websiteIndex,
    orderId: invoiceNo(inv.id),
    total: (inv.amount / 100).toFixed(2),
    productName: `${PLANS[inv.plan].name} paket - ${inv.months} ay`,
    buyer: { id: String(m.id), firstName: first || m.name, lastName: rest.join(" ") || "-", email: m.email, phone: m.phone || m.companyInfo.phone || "05000000000" },
    billing: address,
    shipping: address,
    callbackUrl: panelUrl("/api/billing/shopier"),
  });
  return new Response(autoSubmitHtml(SHOPIER_PAYMENT_URL, fields, "Shopier güvenli ödeme sayfasına yönlendiriliyorsunuz"), { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
