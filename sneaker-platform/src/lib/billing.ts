import "server-only";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { PlanKey } from "@/db/schema";
import { PLANS } from "@/lib/plans";
import { getPlatformSetting } from "@/lib/platform-settings";
import { notify } from "@/lib/notify";
import { formatPrice } from "@/lib/format";

/** Paket fiyatı (kuruş). 12 aylık alımda platform ayarındaki yıllık indirim uygulanır. */
export async function planPrice(plan: PlanKey, months: 1 | 12) {
  const billing = await getPlatformSetting("billing");
  const monthly = PLANS[plan].priceMonthly * 100;
  if (months === 1) return { amount: monthly, discount: 0 };
  const full = monthly * 12;
  const amount = Math.round((full * (100 - billing.yearlyDiscountPercent)) / 100 / 100) * 100;
  return { amount, discount: full - amount };
}

export const invoiceNo = (id: number) => `SUB-${String(id).padStart(6, "0")}`;
export const invoiceIdFromNo = (no: string) => Number(no.replace(/^SUB-/, "")) || 0;

/**
 * Ödenen faturayı işler: paket ve limitler güncellenir, abonelik süresi uzatılır, hesap aktifleşir.
 * Tekrar çağrılırsa (ör. Shopier aynı dönüşü iki kez gönderirse) bir şey yapmaz.
 */
export async function applyPaidInvoice(invoiceId: number, payment: { provider: "shopier" | "demo" | "manual"; ref?: string | null; note?: string }) {
  const inv = await db.query.subscriptionInvoices.findFirst({ where: eq(schema.subscriptionInvoices.id, invoiceId) });
  if (!inv) return null;
  if (inv.status === "paid") return inv;
  const m = await db.query.merchants.findFirst({ where: eq(schema.merchants.id, inv.merchantId) });
  if (!m) return null;
  const now = new Date();
  const base = m.paidUntil && m.paidUntil > now ? m.paidUntil : now;
  const paidUntil = new Date(base);
  paidUntil.setMonth(paidUntil.getMonth() + inv.months);
  const plan = PLANS[inv.plan];
  const [updated] = await db
    .update(schema.subscriptionInvoices)
    .set({ status: "paid", paidAt: now, provider: payment.provider, paymentRef: payment.ref ?? null, note: payment.note ?? inv.note })
    .where(and(eq(schema.subscriptionInvoices.id, inv.id), eq(schema.subscriptionInvoices.status, "pending")))
    .returning();
  if (!updated) return inv;
  await db
    .update(schema.merchants)
    .set({
      plan: inv.plan,
      status: "active",
      paidUntil,
      trialEndsAt: null,
      siteLimit: Math.max(plan.siteLimit, inv.plan === m.plan ? m.siteLimit : 0),
      productLimit: Math.max(plan.productLimit, inv.plan === m.plan ? m.productLimit : 0),
      aiMonthlyLimit: Math.max(plan.aiMonthlyLimit, inv.plan === m.plan ? m.aiMonthlyLimit : 0),
    })
    .where(eq(schema.merchants.id, m.id));
  const until = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" }).format(paidUntil);
  await notify({ merchantId: m.id, type: "system", title: `Ödemeniz alındı: ${plan.name} paket`, body: `${inv.months} aylık abonelik ${until} tarihine kadar aktif.`, link: "/panel/hesap?sekme=paket" });
  await notify({
    merchantId: null,
    type: "merchant",
    title: `Abonelik ödemesi: ${m.name} (${formatPrice(inv.amount)})`,
    body: `${plan.name} · ${inv.months} ay · ${payment.provider === "shopier" ? "Shopier" : payment.provider === "manual" ? "Elle onay" : "Test"}`,
    link: `/panel/saticilar/${m.id}`,
  });
  return updated;
}
