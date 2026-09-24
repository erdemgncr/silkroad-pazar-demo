import { resolveSite } from "@/lib/site";
import { getCatalog } from "@/lib/catalog";
import { productCopy } from "@/lib/seo/copy";
import { CATEGORY_BY_KEY, GENDER_LABEL } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const money = (kurus: number) => `${(kurus / 100).toFixed(2)} TRY`;
const GOOGLE_CATEGORY: Record<string, string> = { ayakkabi: "187", giyim: "1604", aksesuar: "167" };
const GENDER: Record<string, string> = { erkek: "male", kadin: "female", cocuk: "unisex", unisex: "unisex" };

/**
 * Google Merchant Center / Meta (Facebook, Instagram) ürün kataloğu feed'i.
 * Her beden ayrı ürün olarak, aynı modelin bedenleri item_group_id ile gruplanır.
 * Adres: https://{alanadi}/google-merchant.xml
 */
export async function GET(_req: Request, ctx: RouteContext<"/s/[site]/google-merchant.xml">) {
  const { site: key } = await ctx.params;
  const site = await resolveSite(key);
  if (!site || site.status !== "active" || site.isPreview) return new Response("Not found", { status: 404 });
  const all = await getCatalog(site);
  const now = new Date();
  const s = site.settings.shipping;
  const items: string[] = [];
  for (const p of all) {
    if (p.releaseDate && p.releaseDate > now) continue;
    const copy = productCopy(site, p, p.override);
    const link = `${site.baseUrl}/urun/${p.slug}`;
    const images = p.images.map((i) => (i.url.startsWith("http") ? i.url : `${site.baseUrl}${i.url}`));
    const cat = CATEGORY_BY_KEY[p.category];
    const sale = p.compareAtPrice && p.compareAtPrice > p.price;
    const shipPrice = p.price >= s.freeShippingThreshold * 100 ? 0 : s.fee * 100;
    const variants = p.variants.length ? p.variants : [{ size: "STD", stock: 0 }];
    for (const v of variants) {
      items.push(
        [
          "<item>",
          `<g:id>${esc(`${p.id}-${v.size}`)}</g:id>`,
          `<g:item_group_id>${p.id}</g:item_group_id>`,
          `<g:title>${esc(copy.h1.slice(0, 150))}</g:title>`,
          `<g:description>${esc((copy.paragraphs.join(" ") || p.description).slice(0, 4900))}</g:description>`,
          `<g:link>${esc(link)}</g:link>`,
          images[0] ? `<g:image_link>${esc(images[0])}</g:image_link>` : "",
          ...images.slice(1, 10).map((u) => `<g:additional_image_link>${esc(u)}</g:additional_image_link>`),
          `<g:availability>${v.stock > 0 ? "in_stock" : "out_of_stock"}</g:availability>`,
          `<g:price>${money(sale ? p.compareAtPrice! : p.price)}</g:price>`,
          sale ? `<g:sale_price>${money(p.price)}</g:sale_price>` : "",
          `<g:brand>${esc(p.brand)}</g:brand>`,
          `<g:mpn>${esc(v.sku || p.sku)}</g:mpn>`,
          "<g:identifier_exists>no</g:identifier_exists>",
          "<g:condition>new</g:condition>",
          `<g:google_product_category>${GOOGLE_CATEGORY[p.productType] ?? "187"}</g:google_product_category>`,
          `<g:product_type>${esc([GENDER_LABEL[p.gender], cat?.label ?? ""].filter(Boolean).join(" > "))}</g:product_type>`,
          `<g:gender>${GENDER[p.gender]}</g:gender>`,
          `<g:age_group>${p.gender === "cocuk" ? "kids" : "adult"}</g:age_group>`,
          `<g:color>${esc(p.colorName)}</g:color>`,
          v.size !== "STD" ? `<g:size>${esc(v.size)}</g:size><g:size_system>EU</g:size_system>` : "",
          `<g:shipping><g:country>TR</g:country><g:service>${esc(s.carrier)}</g:service><g:price>${money(shipPrice)}</g:price></g:shipping>`,
          "</item>",
        ]
          .filter(Boolean)
          .join(""),
      );
    }
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>${esc(site.name)}</title>
<link>${esc(site.baseUrl)}</link>
<description>${esc(site.settings.seo.homeDescription || site.settings.tagline)}</description>
${items.join("\n")}
</channel>
</rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
