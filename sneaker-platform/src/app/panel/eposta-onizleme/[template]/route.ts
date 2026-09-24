import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getAdminSession } from "@/lib/auth";
import { siteUrl } from "@/lib/panel";
import {
  contactMessageHtml,
  newOrderMerchantHtml,
  orderConfirmationHtml,
  orderShippedHtml,
  orderStatusHtml,
  passwordResetHtml,
  stockBackHtml,
  welcomeCustomerHtml,
  type MailOrder,
} from "@/lib/mailer";

/** Panelde e-posta şablonlarını örnek verilerle önizlemek için. /panel/eposta-onizleme/{sablon}?site={id} */
export async function GET(req: Request, ctx: RouteContext<"/panel/eposta-onizleme/[template]">) {
  const s = await getAdminSession();
  if (!s) return new Response("Oturum gerekli", { status: 401 });
  const { template } = await ctx.params;
  const siteId = Number(new URL(req.url).searchParams.get("site"));
  const site = await db.query.sites.findFirst({ where: eq(schema.sites.id, siteId) });
  if (!site || (s.mid && site.merchantId !== s.mid)) return new Response("Site bulunamadı", { status: 404 });
  const domains = await db.select().from(schema.siteDomains).where(eq(schema.siteDomains.siteId, site.id));
  const url = siteUrl(site.slug, domains);
  const color = site.settings.colors.primary;
  const sample: MailOrder = {
    orderNo: "ORN2609240001",
    firstName: "Ayşe",
    lastName: "Yılmaz",
    email: "ayse@example.com",
    phone: "0532 123 45 67",
    subtotal: 959800,
    discount: 95980,
    shippingFee: 0,
    total: 863820,
    items: [
      { title: "Nike Air Force 1 '07 Beyaz", size: "39", quantity: 1, unitPrice: 479900 },
      { title: "adidas Samba OG Beyaz/Siyah", size: "38.5", quantity: 1, unitPrice: 479900 },
    ],
    address: "Caferağa Mah. Moda Cad. No: 10, Kadıköy / İstanbul",
  };
  const html: Record<string, string> = {
    "siparis-onayi": orderConfirmationHtml(site.name, color, url, sample),
    kargo: orderShippedHtml(site.name, color, url, { orderNo: sample.orderNo, firstName: "Ayşe", company: site.settings.shipping.carrier, trackingNo: "123456789012" }),
    durum: orderStatusHtml(site.name, color, url, { orderNo: sample.orderNo, firstName: "Ayşe", statusLabel: "Hazırlanıyor", note: "Siparişin özenle paketleniyor." }),
    "hos-geldin": welcomeCustomerHtml(site.name, color, url, "Ayşe"),
    "sifre-sifirlama": passwordResetHtml(site.name, color, `${url}/hesabim/sifre-sifirla?token=ornek`),
    "stoga-girdi": stockBackHtml(site.name, color, `${url}/urun/ornek`, { title: "Nike Air Force 1 '07 Beyaz", size: "42", image: undefined }),
    "yeni-siparis": newOrderMerchantHtml(site.name, `${url}`, sample),
    "iletisim-formu": contactMessageHtml(site.name, url, { name: "Mehmet Kaya", email: "mehmet@example.com", phone: "0533 000 00 00", subject: "Beden değişimi", orderNo: sample.orderNo, message: "Merhaba, 42 numara biraz dar geldi; 42.5 ile değiştirebilir miyim?" }),
  };
  const body = html[template];
  if (!body) return new Response("Şablon bulunamadı", { status: 404 });
  return new Response(body, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
