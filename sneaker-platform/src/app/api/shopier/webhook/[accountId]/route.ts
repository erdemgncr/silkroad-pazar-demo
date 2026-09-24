import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { verifyWebhookSignature } from "@/lib/shopier/client";
import { handleWebhookEvent } from "@/lib/shopier/sync";

/**
 * Shopier webhook alıcısı. Olay adı "Shopier-Event" başlığında, imza "Shopier-Signature" başlığında gelir.
 * İmza, hesabın webhook token'ı ile doğrulanır.
 */
export async function POST(req: Request, ctx: RouteContext<"/api/shopier/webhook/[accountId]">) {
  const { accountId } = await ctx.params;
  const account = await db.query.shopierAccounts.findFirst({ where: eq(schema.shopierAccounts.id, Number(accountId)) });
  if (!account) return NextResponse.json({ error: "not found" }, { status: 404 });
  const raw = await req.text();
  const signature = req.headers.get("shopier-signature");
  if (account.webhookToken && !verifyWebhookSignature(raw, signature, account.webhookToken)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }
  const event = req.headers.get("shopier-event") ?? "";
  let payload: unknown = null;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  try {
    await handleWebhookEvent(account.id, event, payload);
  } catch (e) {
    console.error("[shopier webhook]", e);
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
