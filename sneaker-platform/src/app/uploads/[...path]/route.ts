import { readFile, stat } from "fs/promises";
import path from "path";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");
const MIME: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", avif: "image/avif" };

/** Yüklenen dosyaları sunar (tüm alan adlarında ortak). */
export async function GET(_req: Request, ctx: RouteContext<"/uploads/[...path]">) {
  const { path: parts } = await ctx.params;
  const rel = parts.join("/");
  if (rel.includes("..") || !/^[a-z0-9/_.-]+$/i.test(rel)) return new Response("Not found", { status: 404 });
  const file = path.join(UPLOAD_DIR, rel);
  const ext = rel.split(".").pop()?.toLowerCase() ?? "";
  if (!MIME[ext]) return new Response("Not found", { status: 404 });
  try {
    await stat(file);
    const data = await readFile(file);
    return new Response(data, { headers: { "Content-Type": MIME[ext], "Cache-Control": "public, max-age=31536000, immutable" } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
