import { eq } from "drizzle-orm";
import { db, schema } from "@/db";

/**
 * Caddy "on_demand_tls" onay uç noktası: yalnızca platformda kayıtlı alan adları için SSL sertifikası alınır.
 * GET /api/tls/ask?domain=magazam.com → 200 (izin) / 404 (red)
 */
export async function GET(req: Request) {
  const domain = (new URL(req.url).searchParams.get("domain") ?? "").toLowerCase().replace(/\.$/, "");
  if (!domain) return new Response("missing", { status: 400 });
  const admin = (process.env.ADMIN_HOSTS ?? "").split(",").map((h) => h.trim().toLowerCase().replace(/:\d+$/, ""));
  if (admin.includes(domain)) return new Response("ok");
  const bare = domain.replace(/^www\./, "");
  if (await db.query.siteDomains.findFirst({ where: eq(schema.siteDomains.hostname, bare) })) return new Response("ok");
  const root = (process.env.ROOT_DOMAIN ?? "").toLowerCase().replace(/:\d+$/, "");
  if (root && domain.endsWith(`.${root}`)) {
    const slug = domain.slice(0, -(root.length + 1));
    if (await db.query.sites.findFirst({ where: eq(schema.sites.slug, slug) })) return new Response("ok");
  }
  return new Response("unknown domain", { status: 404 });
}
