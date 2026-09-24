"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireMerchant, requirePanel } from "@/lib/panel";
import { layout, sendMail } from "@/lib/mailer";

export type FormState = { ok?: boolean; error?: string; message?: string } | null;

async function siteIdsFor() {
  const ctx = await requirePanel();
  const rows = ctx.isPlatform ? await db.select({ id: schema.sites.id }).from(schema.sites) : await db.select({ id: schema.sites.id }).from(schema.sites).where(eq(schema.sites.merchantId, ctx.merchant!.id));
  return { ctx, ids: rows.map((r) => r.id) };
}

/* ------------------------------------------------------------------ */
/* Kuponlar                                                             */
/* ------------------------------------------------------------------ */

export async function saveCoupon(couponId: number | null, _: FormState, form: FormData): Promise<FormState> {
  const ctx = await requireMerchant();
  const str = (k: string) => String(form.get(k) ?? "").trim();
  const code = str("code").toUpperCase().replace(/\s+/g, "");
  if (!/^[A-Z0-9_-]{3,30}$/.test(code)) return { error: "Kod 3-30 karakter olmalı; harf, rakam, - ve _ kullanılabilir." };
  const type = str("type") === "fixed" ? "fixed" : "percent";
  const valueRaw = Number(str("value").replace(",", "."));
  if (!Number.isFinite(valueRaw) || valueRaw <= 0) return { error: "İndirim değeri girin." };
  if (type === "percent" && valueRaw > 90) return { error: "Yüzde indirim en fazla %90 olabilir." };
  const siteId = Number(str("siteId")) || null;
  if (siteId) {
    const site = await db.query.sites.findFirst({ where: and(eq(schema.sites.id, siteId), eq(schema.sites.merchantId, ctx.merchant.id)) });
    if (!site) return { error: "Site bulunamadı." };
  }
  const values = {
    merchantId: ctx.merchant.id,
    siteId,
    code,
    type: type as "percent" | "fixed",
    value: type === "percent" ? Math.round(valueRaw) : Math.round(valueRaw * 100),
    minTotal: Math.round((Number(str("minTotal").replace(",", ".")) || 0) * 100),
    usageLimit: Number(str("usageLimit")) || null,
    startsAt: str("startsAt") ? new Date(str("startsAt")) : null,
    endsAt: str("endsAt") ? new Date(str("endsAt")) : null,
    active: form.get("active") === "on",
  };
  const clash = await db.query.coupons.findFirst({ where: and(eq(schema.coupons.merchantId, ctx.merchant.id), eq(schema.coupons.code, code)) });
  if (clash && clash.id !== couponId) return { error: "Bu kod zaten kullanılıyor." };
  if (couponId) await db.update(schema.coupons).set(values).where(and(eq(schema.coupons.id, couponId), eq(schema.coupons.merchantId, ctx.merchant.id)));
  else await db.insert(schema.coupons).values(values);
  revalidatePath("/panel/kuponlar");
  return { ok: true, message: couponId ? "Kupon güncellendi." : `${code} kuponu oluşturuldu.` };
}

export async function toggleCoupon(couponId: number, active: boolean) {
  const ctx = await requireMerchant();
  await db.update(schema.coupons).set({ active }).where(and(eq(schema.coupons.id, couponId), eq(schema.coupons.merchantId, ctx.merchant.id)));
  revalidatePath("/panel/kuponlar");
  return { ok: true, message: active ? "Kupon aktif." : "Kupon durduruldu." };
}

export async function deleteCoupon(couponId: number) {
  const ctx = await requireMerchant();
  await db.delete(schema.coupons).where(and(eq(schema.coupons.id, couponId), eq(schema.coupons.merchantId, ctx.merchant.id)));
  revalidatePath("/panel/kuponlar");
  return { ok: true, message: "Kupon silindi." };
}

/* ------------------------------------------------------------------ */
/* İletişim mesajları                                                   */
/* ------------------------------------------------------------------ */

export async function setMessageRead(id: number, read: boolean) {
  const { ids } = await siteIdsFor();
  await db
    .update(schema.contactMessages)
    .set({ read })
    .where(and(eq(schema.contactMessages.id, id), inArray(schema.contactMessages.siteId, ids.length ? ids : [-1])));
  revalidatePath("/panel/mesajlar");
  revalidatePath("/panel", "layout");
  return { ok: true };
}

export async function deleteMessage(id: number) {
  const { ids } = await siteIdsFor();
  await db.delete(schema.contactMessages).where(and(eq(schema.contactMessages.id, id), inArray(schema.contactMessages.siteId, ids.length ? ids : [-1])));
  revalidatePath("/panel/mesajlar");
  return { ok: true, message: "Mesaj silindi." };
}

/** Mesaja sitenin e-posta adresinden yanıt gönderir. */
export async function replyMessage(id: number, _: FormState, form: FormData): Promise<FormState> {
  const { ids } = await siteIdsFor();
  const m = await db.query.contactMessages.findFirst({ where: and(eq(schema.contactMessages.id, id), inArray(schema.contactMessages.siteId, ids.length ? ids : [-1])) });
  if (!m) return { error: "Mesaj bulunamadı." };
  const body = String(form.get("body") ?? "").trim();
  if (body.length < 5) return { error: "Yanıt yazın." };
  const site = await db.query.sites.findFirst({ where: eq(schema.sites.id, m.siteId) });
  if (!site) return { error: "Site bulunamadı." };
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const html = layout(
    site.name,
    site.settings.colors.primary,
    `Re: ${m.subject}`,
    `<p style="font-size:14px;line-height:1.7;white-space:pre-line">${esc(body)}</p>
<hr style="border:none;border-top:1px solid #eee;margin:24px 0">
<p style="font-size:12px;color:#888;line-height:1.6">Mesajınız:<br>${esc(m.message).slice(0, 1500)}</p>`,
  );
  const r = await sendMail({ to: m.email, subject: `Re: ${m.subject}`, html, template: "contact-reply", siteId: site.id, merchantId: site.merchantId, fromName: site.name, replyTo: site.settings.contact.email || undefined });
  await db.update(schema.contactMessages).set({ read: true }).where(eq(schema.contactMessages.id, m.id));
  revalidatePath("/panel/mesajlar");
  if (r.status === "failed") return { error: `Gönderilemedi: ${r.error}` };
  return { ok: true, message: r.status === "sent" ? "Yanıt gönderildi." : "SMTP tanımlı olmadığı için yanıt yalnızca kaydedildi." };
}

export async function deleteSubscriber(id: number) {
  const { ids } = await siteIdsFor();
  await db.delete(schema.newsletterSubscribers).where(and(eq(schema.newsletterSubscribers.id, id), inArray(schema.newsletterSubscribers.siteId, ids.length ? ids : [-1])));
  revalidatePath("/panel/mesajlar");
  return { ok: true, message: "Abone silindi." };
}

export async function deleteStockAlert(id: number) {
  const { ids } = await siteIdsFor();
  await db.delete(schema.stockAlerts).where(and(eq(schema.stockAlerts.id, id), inArray(schema.stockAlerts.siteId, ids.length ? ids : [-1])));
  revalidatePath("/panel/mesajlar");
  return { ok: true, message: "Talep silindi." };
}

/** KVKK silme talebi: müşteri hesabı, adresleri, bülten ve stok talepleri silinir; siparişler yasal süre boyunca korunur. */
export async function deleteCustomer(customerId: number) {
  const { ids } = await siteIdsFor();
  const c = await db.query.customers.findFirst({ where: and(eq(schema.customers.id, customerId), inArray(schema.customers.siteId, ids.length ? ids : [-1])) });
  if (!c) return { error: "Müşteri bulunamadı." };
  await db.delete(schema.newsletterSubscribers).where(and(eq(schema.newsletterSubscribers.siteId, c.siteId), eq(schema.newsletterSubscribers.email, c.email)));
  await db.delete(schema.stockAlerts).where(and(eq(schema.stockAlerts.siteId, c.siteId), eq(schema.stockAlerts.email, c.email)));
  await db.delete(schema.customers).where(eq(schema.customers.id, c.id));
  revalidatePath("/panel/musteriler");
  const { redirect } = await import("next/navigation");
  redirect("/panel/musteriler?silindi=1");
}
