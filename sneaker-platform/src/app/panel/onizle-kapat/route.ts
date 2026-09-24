import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const back = url.searchParams.get("geri") ?? "/panel/siteler";
  const res = NextResponse.redirect(new URL(back.startsWith("/panel") ? back : "/panel", req.url));
  res.cookies.delete("preview_site");
  return res;
}
