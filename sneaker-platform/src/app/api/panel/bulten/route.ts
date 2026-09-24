import { NextResponse } from "next/server";
import { desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { getAdminSession } from "@/lib/auth";

/** Bülten abonelerini CSV olarak dışa aktarır. */
export async function GET() {
  const s = await getAdminSession();
  if (!s) return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  const sites = s.mid ? await db.select().from(schema.sites).where(eq(schema.sites.merchantId, s.mid)) : await db.select().from(schema.sites);
  const rows = sites.length
    ? await db.select().from(schema.newsletterSubscribers).where(inArray(schema.newsletterSubscribers.siteId, sites.map((x) => x.id))).orderBy(desc(schema.newsletterSubscribers.createdAt))
    : [];
  const csv = "﻿" + ["E-posta;Site;Tarih", ...rows.map((r) => `${r.email};${sites.find((x) => x.id === r.siteId)?.name ?? ""};${r.createdAt.toISOString().slice(0, 10)}`)].join("\r\n");
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="bulten-aboneleri.csv"` } });
}
