import "server-only";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCustomerSession } from "@/lib/auth";
import type { SiteContext } from "@/lib/site";

export async function currentCustomer(site: SiteContext) {
  const s = await getCustomerSession(site.id);
  if (!s) return null;
  return (await db.query.customers.findFirst({ where: eq(schema.customers.id, s.cid) })) ?? null;
}

export async function requireCustomer(site: SiteContext, next: string) {
  const c = await currentCustomer(site);
  if (!c) redirect(`/hesabim/giris?devam=${encodeURIComponent(next)}`);
  return c;
}
