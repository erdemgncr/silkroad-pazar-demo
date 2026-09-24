import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { resolveSite } from "@/lib/site";
import { allBrandsInCatalog, allSeries, getCatalog } from "@/lib/catalog";
import { nonEmptyCollections } from "@/lib/listing-page";
import { STATIC_PAGES } from "@/lib/content/pages";
import { GENDERS } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";

type Entry = { loc: string; lastmod?: Date; changefreq?: string; priority?: number; images?: string[] };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Her site kendi alan adıyla ayrı sitemap üretir (ürün görselleri dahil). */
export async function GET(_req: Request, ctx: RouteContext<"/s/[site]/sitemap.xml">) {
  const { site: key } = await ctx.params;
  const site = await resolveSite(key);
  if (!site || site.status !== "active" || site.isPreview) return new Response("Not found", { status: 404 });
  const base = site.baseUrl;
  const all = await getCatalog(site);
  const now = new Date();
  const out: Entry[] = [{ loc: `${base}/`, lastmod: now, changefreq: "daily", priority: 1 }];
  for (const c of nonEmptyCollections(all)) out.push({ loc: `${base}/${c.slug}`, lastmod: now, changefreq: "daily", priority: c.slug.includes("-") ? 0.7 : 0.8 });
  out.push({ loc: `${base}/markalar`, changefreq: "weekly", priority: 0.6 });
  for (const b of allBrandsInCatalog(all)) {
    out.push({ loc: `${base}/marka/${b.slug}`, changefreq: "weekly", priority: 0.7 });
    for (const g of Object.values(GENDERS)) {
      if (all.some((p) => p.brandSlug === b.slug && (g.slug === "cocuk" ? p.gender === "cocuk" : p.gender === g.slug))) out.push({ loc: `${base}/marka/${b.slug}/${g.slug}`, changefreq: "weekly", priority: 0.6 });
    }
  }
  for (const s of allSeries(all)) out.push({ loc: `${base}/seri/${s.slug}`, changefreq: "weekly", priority: 0.6 });
  for (const p of all) out.push({ loc: `${base}/urun/${p.slug}`, lastmod: p.updatedAt, changefreq: "weekly", priority: 0.9, images: p.images.slice(0, 5).map((i) => i.url) });
  const posts = await db
    .select({ slug: schema.blogPosts.slug, updatedAt: schema.blogPosts.updatedAt })
    .from(schema.blogPosts)
    .where(and(eq(schema.blogPosts.siteId, site.id), eq(schema.blogPosts.status, "published")));
  out.push({ loc: `${base}/blog`, changefreq: "weekly", priority: 0.5 });
  for (const p of posts) out.push({ loc: `${base}/blog/${p.slug}`, lastmod: p.updatedAt, changefreq: "monthly", priority: 0.5 });
  for (const p of STATIC_PAGES) out.push({ loc: `${base}/${p.slug}`, changefreq: "monthly", priority: p.group === "yasal" ? 0.2 : 0.4 });
  out.push({ loc: `${base}/yakinda`, changefreq: "daily", priority: 0.5 });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${out
  .map(
    (e) =>
      `<url><loc>${esc(e.loc)}</loc>${e.lastmod ? `<lastmod>${e.lastmod.toISOString()}</lastmod>` : ""}${e.changefreq ? `<changefreq>${e.changefreq}</changefreq>` : ""}${e.priority != null ? `<priority>${e.priority.toFixed(1)}</priority>` : ""}${(e.images ?? []).map((i) => `<image:image><image:loc>${esc(i)}</image:loc></image:image>`).join("")}</url>`,
  )
  .join("\n")}
</urlset>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
