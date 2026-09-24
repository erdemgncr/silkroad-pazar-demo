import { resolveSite } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: RouteContext<"/s/[site]/robots.txt">) {
  const { site: key } = await ctx.params;
  const site = await resolveSite(key);
  const headers = { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" };
  if (!site || site.status !== "active" || site.isPreview) return new Response("User-agent: *\nDisallow: /\n", { headers });
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /sepet",
    "Disallow: /odeme",
    "Disallow: /hesabim",
    "Disallow: /arama",
    "Disallow: /api/",
    "Disallow: /*?*siralama=",
    "Disallow: /*?*beden=",
    "Disallow: /*?*renk=",
    "Disallow: /*?*fiyat=",
    "",
    `Sitemap: ${site.baseUrl}/sitemap.xml`,
    `Host: ${site.baseUrl}`,
    "",
  ].join("\n");
  return new Response(body, { headers });
}
