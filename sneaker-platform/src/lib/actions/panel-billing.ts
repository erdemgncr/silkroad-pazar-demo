"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { PlanKey } from "@/db/schema";
import { requireMerchant, requirePlatform } from "@/lib/panel";
import { PLANS } from "@/lib/plans";
import { applyPaidInvoice, planPrice } from "@/lib/billing";
import { getPlatformSetting } from "@/lib/platform-settings";

export type FormState = { ok?: boolean; error?: string; message?: string } | null;

/** Paket satın alma: bekleyen fatura oluşturur ve ödeme sayfasına yönlendirir. */
export async function startSubscription(plan: PlanKey, months: 1 | 12) {
  const ctx = await requireMerchant();
  if (!PLANS[plan] || ![1, 12].includes(months)) throw new Error("Geçersiz paket");
  const { amount } = await planPrice(plan, months);
  // Aynı paket için bekleyen fatura varsa onu kullan
  const open = await db.query.subscriptionInvoices.findFirst({
    where: and(eq(schema.subscriptionInvoices.merchantId, ctx.merchant.id), eq(schema.subscriptionInvoices.status, "pending"), eq(schema.subscriptionInvoices.plan, plan), eq(schema.subscriptionInvoices.months, months)),
  });
  const billing = await getPlatformSetting("billing");
  const inv =
    open ??
    (
      await db
        .insert(schema.subscriptionInvoices)
        .values({ merchantId: ctx.merchant.id, plan, months, amount, provider: billing.mode === "shopier" ? "shopier" : "demo" })
        .returning()
    )[0];
  redirect(`/panel/abonelik/${inv.id}`);
}

export async function confirmDemoPayment(invoiceId: number): Promise<FormState> {
  const ctx = await requireMerchant();
  const billing = await getPlatformSetting("billing");
  if (billing.mode !== "demo") return { error: "Test ödemesi kapalı; lütfen Shopier ile ödeyin." };
  const inv = await db.query.subscriptionInvoices.findFirst({ where: and(eq(schema.subscriptionInvoices.id, invoiceId), eq(schema.subscriptionInvoices.merchantId, ctx.merchant.id)) });
  if (!inv) return { error: "Fatura bulunamadı." };
  await applyPaidInvoice(inv.id, { provider: "demo", ref: `TEST-${Date.now()}` });
  revalidatePath("/panel", "layout");
  redirect(`/panel/abonelik/${inv.id}?odeme=ok`);
}

export async function cancelInvoice(invoiceId: number): Promise<FormState> {
  const ctx = await requireMerchant();
  await db
    .update(schema.subscriptionInvoices)
    .set({ status: "cancelled" })
    .where(and(eq(schema.subscriptionInvoices.id, invoiceId), eq(schema.subscriptionInvoices.merchantId, ctx.merchant.id), eq(schema.subscriptionInvoices.status, "pending")));
  revalidatePath("/panel/hesap");
  redirect("/panel/hesap?sekme=paket");
}

/** Süper admin: havale/EFT gibi elle alınan ödemeyi onaylar. */
export async function markInvoicePaid(invoiceId: number): Promise<FormState> {
  const ctx = await requirePlatform();
  const r = await applyPaidInvoice(invoiceId, { provider: "manual", ref: `ELLE-${ctx.user.id}`, note: `${ctx.user.name} tarafından onaylandı` });
  if (!r) return { error: "Fatura bulunamadı." };
  revalidatePath("/panel", "layout");
  return { ok: true, message: "Ödeme onaylandı; paket ve süre güncellendi." };
}

/** Süper admin: satıcıya elle fatura (ör. özel fiyat) oluşturur. */
export async function createManualInvoice(merchantId: number, _: FormState, form: FormData): Promise<FormState> {
  await requirePlatform();
  const plan = String(form.get("plan")) as PlanKey;
  const months = Math.max(1, Math.min(36, Number(form.get("months")) || 1));
  const amount = Math.round(Number(String(form.get("amount") ?? "").replace(",", ".")) * 100);
  if (!PLANS[plan] || !amount) return { error: "Paket ve tutar girin." };
  await db.insert(schema.subscriptionInvoices).values({ merchantId, plan, months, amount, provider: "manual", note: String(form.get("note") ?? "").trim() || null });
  revalidatePath(`/panel/saticilar/${merchantId}`);
  return { ok: true, message: "Fatura oluşturuldu. Ödeme alındığında 'Ödendi' ile onaylayın." };
}
