import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getAdminSession } from "@/lib/auth";
import { isThemeKey } from "@/themes/registry";

/** Paneldeki "Önizle": siteyi (taslak olsa bile) panel alan adında açar. */
export async function GET(req: Request, ctx: RouteContext<"/panel/onizle/[slug]">) {
  const { slug } = await ctx.params;
  const session = await getAdminSession();
  if (!session) return NextResponse.redirect(new URL("/panel/giris", req.url));
  const site = await db.query.sites.findFirst({ where: eq(schema.sites.slug, slug) });
  if (!site || (session.mid && site.merchantId !== session.mid)) return NextResponse.redirect(new URL("/panel/siteler", req.url));
  // ?tema=volt ile site, temayı uygulamadan farklı bir temayla önizlenebilir.
  const theme = new URL(req.url).searchParams.get("tema") ?? "";
  const target = new URL(req.url).searchParams.get("yol") ?? "/";
  const res = NextResponse.redirect(new URL(target.startsWith("/") && !target.startsWith("//") ? target : "/", req.url));
  res.cookies.set("preview_site", isThemeKey(theme) ? `${slug}~${theme}` : slug, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 8 });
  return res;
}
