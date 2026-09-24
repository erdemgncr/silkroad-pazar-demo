import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

/**
 * Çok kiracılı yönlendirme:
 * - ADMIN_HOSTS içindeki alan adları yönetim panelini (/panel) sunar.
 * - Diğer tüm alan adları mağaza sitesidir ve /s/{host}/... yoluna içten yeniden yazılır.
 * - Panelde "Önizle" ile ayarlanan çerez varsa, panel alan adında seçili site önizlenir.
 */
const ADMIN_HOSTS = (process.env.ADMIN_HOSTS ?? "localhost:3000,127.0.0.1:3000")
  .split(",")
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);

const secret = new TextEncoder().encode(process.env.AUTH_SECRET ?? "dev-secret-change-me-please-32-characters-long");

async function isAdmin(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get("admin_session")?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

function withPathHeader(req: NextRequest, host: string) {
  const headers = new Headers(req.headers);
  headers.set("x-url-path", req.nextUrl.pathname + req.nextUrl.search);
  headers.set("x-site-host", host);
  return headers;
}

export async function proxy(req: NextRequest) {
  const url = req.nextUrl;
  const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "").toLowerCase().split(",")[0].trim();

  // İç yollar dışarıdan çağrılamaz.
  if (url.pathname.startsWith("/s/")) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (ADMIN_HOSTS.includes(host)) {
    const preview = req.cookies.get("preview_site")?.value;
    const isPanelPath = url.pathname.startsWith("/panel") || url.pathname.startsWith("/api/") || url.pathname.startsWith("/uploads/");
    if (preview && !isPanelPath && (await isAdmin(req))) {
      const key = `_preview.${preview}`;
      const target = url.clone();
      target.pathname = `/s/${encodeURIComponent(key)}${url.pathname === "/" ? "" : url.pathname}`;
      return NextResponse.rewrite(target, { request: { headers: withPathHeader(req, key) } });
    }
    if (url.pathname === "/") return NextResponse.redirect(new URL("/panel", req.url));
    return NextResponse.next();
  }

  // Yüklenen dosyalar tüm alan adlarında ortak.
  if (url.pathname.startsWith("/uploads/")) return NextResponse.next();

  const target = url.clone();
  target.pathname = `/s/${encodeURIComponent(host)}${url.pathname === "/" ? "" : url.pathname}`;
  return NextResponse.rewrite(target, { request: { headers: withPathHeader(req, host) } });
}

export const config = {
  matcher: ["/((?!_next/|static/|favicon.ico).*)"],
};
