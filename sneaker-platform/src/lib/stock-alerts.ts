import "server-only";
import { and, eq, inArray, isNull, or } from "drizzle-orm";
import { db, schema } from "@/db";
import { sendMail, stockBackHtml } from "@/lib/mailer";
import { siteUrl } from "@/lib/panel";

/**
 * "Gelince haber ver" listesindeki müşterilere, ürün (veya istedikleri beden) stoğa girdiğinde e-posta gönderir.
 * Gönderilen talepler silinir. Gönderilen e-posta sayısını döndürür.
 */
export async function sendStockAlerts(productId: number, sizes?: string[]) {
  const product = await db.query.products.findFirst({ where: eq(schema.products.id, productId) });
  if (!product) return 0;
  const inStock = new Set(product.variants.filter((v) => v.stock > 0).map((v) => v.size));
  const wanted = sizes?.length ? sizes.filter((s) => inStock.has(s)) : [...inStock];
  if (!wanted.length) return 0;
  const alerts = await db
    .select()
    .from(schema.stockAlerts)
    .where(and(eq(schema.stockAlerts.productId, productId), or(isNull(schema.stockAlerts.size), inArray(schema.stockAlerts.size, wanted))));
  if (!alerts.length) return 0;
  const siteIds = [...new Set(alerts.map((a) => a.siteId))];
  const sites = await db.select().from(schema.sites).where(inArray(schema.sites.id, siteIds));
  const domains = await db.select().from(schema.siteDomains).where(inArray(schema.siteDomains.siteId, siteIds));
  let sent = 0;
  for (const a of alerts) {
    const site = sites.find((s) => s.id === a.siteId);
    if (!site) continue;
    const url = `${siteUrl(site.slug, domains.filter((d) => d.siteId === site.id))}/urun/${product.slug}`;
    await sendMail({
      to: a.email,
      subject: `${product.brand} ${product.model} stoklarda!`,
      html: stockBackHtml(site.name, site.settings.colors.primary, url, { title: product.title, size: a.size, image: product.images[0]?.url }),
      template: "stock-back",
      siteId: site.id,
      merchantId: site.merchantId,
      fromName: site.name,
    });
    sent++;
  }
  await db.delete(schema.stockAlerts).where(inArray(schema.stockAlerts.id, alerts.map((a) => a.id)));
  return sent;
}
