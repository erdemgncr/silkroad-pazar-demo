import { NextResponse } from "next/server";
import { resolveSite } from "@/lib/site";
import { allBrandsInCatalog, allCollections, getCatalog } from "@/lib/catalog";
import { toCards } from "@/lib/store-data";
import { normalizeSearch } from "@/lib/taxonomy";

export async function GET(req: Request, ctx: RouteContext<"/s/[site]/api/search">) {
  const { site: key } = await ctx.params;
  const site = await resolveSite(key);
  if (!site) return NextResponse.json({ error: "not found" }, { status: 404 });
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ products: [], brands: [], collections: [] });
  const terms = normalizeSearch(q).split(" ").filter(Boolean);
  const all = await getCatalog(site);
  const hits = all
    .filter((p) => (!p.releaseDate || p.releaseDate < new Date()) && terms.every((t) => p.searchText.includes(t)))
    .sort((a, b) => Number(b.inStock) - Number(a.inStock) || b.popularity - a.popularity)
    .slice(0, 6);
  const brands = allBrandsInCatalog(all)
    .filter((b) => terms.some((t) => normalizeSearch(b.name).includes(t)))
    .slice(0, 4)
    .map((b) => ({ name: b.name, slug: b.slug }));
  const collections = allCollections()
    .filter((c) => terms.every((t) => normalizeSearch(c.label).includes(t)))
    .filter((c) => all.some(c.test))
    .slice(0, 5)
    .map((c) => ({ label: c.label, href: `/${c.slug}` }));
  return NextResponse.json(
    { products: toCards(hits, all), brands, collections },
    { headers: { "Cache-Control": "public, max-age=60", "X-Robots-Tag": "noindex" } },
  );
}
