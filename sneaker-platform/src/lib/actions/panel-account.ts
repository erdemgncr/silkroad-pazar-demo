"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne } from "drizzle-orm";
import { randomBytes } from "crypto";
import { db, schema } from "@/db";
import { canManageTeam, requireMerchant, requirePanel } from "@/lib/panel";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { sendMail, welcomeMerchantHtml } from "@/lib/mailer";
import { panelUrl } from "@/lib/notify";
import { aiConfig, testGemini } from "@/lib/ai/gemini";
import { getPlatformSetting } from "@/lib/platform-settings";

export type FormState = { ok?: boolean; error?: string; message?: string } | null;
const isEmail = (s: string) => /^\S+@\S+\.\S+$/.test(s);

export async function updateProfile(_: FormState, form: FormData): Promise<FormState> {
  const ctx = await requirePanel();
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (name.length < 2 || !isEmail(email)) return { error: "Ad ve geçerli e-posta girin." };
  const clash = await db.query.adminUsers.findFirst({ where: and(eq(schema.adminUsers.email, email), ne(schema.adminUsers.id, ctx.user.id)) });
  if (clash) return { error: "Bu e-posta başka bir kullanıcıya ait." };
  await db.update(schema.adminUsers).set({ name, email }).where(eq(schema.adminUsers.id, ctx.user.id));
  revalidatePath("/panel", "layout");
  return { ok: true, message: "Profil güncellendi." };
}

export async function changeAdminPassword(_: FormState, form: FormData): Promise<FormState> {
  const ctx = await requirePanel();
  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  if (!(await verifyPassword(current, ctx.user.passwordHash))) return { error: "Mevcut şifre hatalı." };
  if (next.length < 8) return { error: "Yeni şifre en az 8 karakter olmalı." };
  if (next !== String(form.get("confirm") ?? "")) return { error: "Şifreler eşleşmiyor." };
  await db.update(schema.adminUsers).set({ passwordHash: await hashPassword(next) }).where(eq(schema.adminUsers.id, ctx.user.id));
  return { ok: true, message: "Şifre değiştirildi." };
}

export async function updateNotifyPrefs(_: FormState, form: FormData): Promise<FormState> {
  const ctx = await requireMerchant();
  const notifyEmail = String(form.get("notifyEmail") ?? "").trim();
  if (notifyEmail && !isEmail(notifyEmail)) return { error: "Bildirim e-postası geçerli değil." };
  const b = (k: string) => form.get(k) === "on";
  await db
    .update(schema.merchants)
    .set({ notifyEmail: notifyEmail || null, notifyPrefs: { newOrder: b("newOrder"), contactMessage: b("contactMessage"), lowStock: b("lowStock"), syncError: b("syncError"), dailySummary: b("dailySummary") } })
    .where(eq(schema.merchants.id, ctx.merchant.id));
  revalidatePath("/panel/bildirimler");
  revalidatePath("/panel/hesap");
  return { ok: true, message: "Bildirim tercihleri kaydedildi." };
}

export async function updateCompany(_: FormState, form: FormData): Promise<FormState> {
  const ctx = await requireMerchant();
  const s = (k: string) => String(form.get(k) ?? "").trim();
  const name = s("name");
  if (name.length < 2) return { error: "Mağaza adı girin." };
  await db
    .update(schema.merchants)
    .set({ name, phone: s("phone") || null, companyInfo: { legalName: s("legalName"), taxOffice: s("taxOffice"), taxNumber: s("taxNumber"), address: s("address"), phone: s("phone") } })
    .where(eq(schema.merchants.id, ctx.merchant.id));
  revalidatePath("/panel", "layout");
  return { ok: true, message: "Firma bilgileri kaydedildi." };
}

export async function updateMerchantAi(_: FormState, form: FormData): Promise<FormState> {
  const ctx = await requireMerchant();
  const key = String(form.get("geminiApiKey") ?? "").trim();
  const clear = form.get("clear") === "on";
  if (key && !clear) {
    const ai = await getPlatformSetting("ai");
    try {
      await testGemini(key, ai.geminiModel);
    } catch (e) {
      return { error: `Anahtar doğrulanamadı: ${(e as Error).message}` };
    }
  }
  await db
    .update(schema.merchants)
    .set({ geminiApiKey: clear ? null : key || ctx.merchant.geminiApiKey })
    .where(eq(schema.merchants.id, ctx.merchant.id));
  revalidatePath("/panel/hesap");
  return { ok: true, message: clear ? "Kendi anahtarınız kaldırıldı; platform kotası kullanılacak." : key ? "Gemini anahtarı doğrulandı ve kaydedildi. Artık aylık kota sınırı uygulanmaz." : "Kaydedildi." };
}

export async function testMyAi(): Promise<FormState> {
  const ctx = await requireMerchant();
  const cfg = await aiConfig(ctx.merchant);
  if (!cfg.key) return { error: "Tanımlı Gemini anahtarı yok." };
  try {
    await testGemini(cfg.key, cfg.model);
    return { ok: true, message: `Gemini bağlantısı çalışıyor (${cfg.model}).` };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

/* ------------------------------------------------------------------ */
/* Ekip                                                                 */
/* ------------------------------------------------------------------ */

export async function addTeamMember(_: FormState, form: FormData): Promise<FormState> {
  const ctx = await requireMerchant();
  if (!canManageTeam(ctx)) return { error: "Ekip üyesi eklemek için hesap sahibi olmalısınız." };
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (name.length < 2 || !isEmail(email)) return { error: "Ad ve geçerli e-posta girin." };
  if (await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.email, email) })) return { error: "Bu e-posta ile bir kullanıcı zaten var." };
  const password = randomBytes(6).toString("base64url");
  const role = String(form.get("role")) === "merchant_owner" ? "merchant_owner" : "merchant_staff";
  await db.insert(schema.adminUsers).values({ merchantId: ctx.merchant.id, name, email, role, passwordHash: await hashPassword(password) });
  const general = await getPlatformSetting("general");
  const r = await sendMail({ to: email, subject: `${general.platformName} paneline davet edildiniz`, html: welcomeMerchantHtml(general.platformName, panelUrl("/panel/giris"), { name, email, password }), template: "team_invite", merchantId: ctx.merchant.id });
  revalidatePath("/panel/hesap");
  return { ok: true, message: r.status === "sent" ? `${name} eklendi; giriş bilgileri e-postayla gönderildi.` : `${name} eklendi. Geçici şifre: ${password} (SMTP tanımlı olmadığı için e-posta gönderilemedi).` };
}

export async function removeTeamMember(userId: number) {
  const ctx = await requireMerchant();
  if (!canManageTeam(ctx)) return { error: "Yetkiniz yok." };
  if (userId === ctx.user.id) return { error: "Kendinizi silemezsiniz." };
  await db.delete(schema.adminUsers).where(and(eq(schema.adminUsers.id, userId), eq(schema.adminUsers.merchantId, ctx.merchant.id)));
  revalidatePath("/panel/hesap");
  return { ok: true, message: "Kullanıcı kaldırıldı." };
}

export async function requestPlanChange(plan: string): Promise<FormState> {
  const ctx = await requireMerchant();
  const { PLANS } = await import("@/lib/plans");
  const p = PLANS[plan as keyof typeof PLANS];
  if (!p) return { error: "Geçersiz paket." };
  const { notify } = await import("@/lib/notify");
  await notify({
    merchantId: null,
    type: "merchant",
    title: `Paket talebi: ${ctx.merchant.name} → ${p.name}`,
    body: `${ctx.user.name} (${ctx.user.email}) ${p.name} paketine geçmek istiyor.`,
    link: `/panel/saticilar/${ctx.merchant.id}`,
    email: { subject: `Paket talebi: ${ctx.merchant.name} → ${p.name}`, html: `<p>${ctx.merchant.name} satıcısı ${p.name} paketine geçmek istiyor.</p>`, template: "plan_request" },
  });
  return { ok: true, message: `${p.name} paketi talebin iletildi. Ekibimiz kısa süre içinde seninle iletişime geçecek.` };
}
