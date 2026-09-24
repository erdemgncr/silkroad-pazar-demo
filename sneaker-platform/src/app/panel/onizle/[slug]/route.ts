import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getAdminSession } from "@/lib/auth";

/** Paneldeki "Önizle": siteyi (taslak olsa bile) panel alan adında açar. */
export async function GET(req: Request, ctx: RouteContext<"/panel/onizle/[slug]">) {
  const { slug } = await ctx.params;
  const session = await getAdminSession();
  if (!session) return NextResponse.redirect(new URL("/panel/giris", req.url));
  const site = await db.query.sites.findFirst({ where: eq(schema.sites.slug, slug) });
  if (!site || (session.mid && site.merchantId !== session.mid)) return NextResponse.redirect(new URL("/panel/siteler", req.url));
  const res = NextResponse.redirect(new URL("/", req.url));
  res.cookies.set("preview_site", slug, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 8 });
  return res;
}
