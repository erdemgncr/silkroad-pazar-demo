"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { clearAdminSession, setAdminSession, verifyPassword } from "@/lib/auth";

export type LoginState = { error: string } | null;

export async function panelLogin(_: LoginState, form: FormData): Promise<LoginState> {
  const parsed = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "E-posta ve şifre gerekli." };
  const user = await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.email, parsed.data.email) });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) return { error: "E-posta veya şifre hatalı." };
  if (user.merchantId) {
    const m = await db.query.merchants.findFirst({ where: eq(schema.merchants.id, user.merchantId) });
    if (m?.status === "suspended") return { error: "Hesabınız askıya alınmış. Lütfen destek ile iletişime geçin." };
  }
  await db.update(schema.adminUsers).set({ lastLoginAt: new Date() }).where(eq(schema.adminUsers.id, user.id));
  await setAdminSession({ uid: user.id, role: user.role, mid: user.merchantId });
  redirect("/panel");
}

export async function panelLogout() {
  await clearAdminSession();
  redirect("/panel/giris");
}

/* ------------------------------------------------------------------ */
/* Şifremi unuttum                                                      */
/* ------------------------------------------------------------------ */

export type SimpleState = { ok?: boolean; error?: string; message?: string } | null;

export async function requestAdminReset(_: SimpleState, form: FormData): Promise<SimpleState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Geçerli bir e-posta girin." };
  const user = await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.email, email) });
  if (user) {
    const { randomBytes } = await import("crypto");
    const { sendMail, passwordResetHtml } = await import("@/lib/mailer");
    const { panelUrl } = await import("@/lib/notify");
    const { getPlatformSetting } = await import("@/lib/platform-settings");
    const token = randomBytes(32).toString("hex");
    await db.insert(schema.passwordResets).values({ token, adminUserId: user.id, expiresAt: new Date(Date.now() + 3600_000) });
    const general = await getPlatformSetting("general");
    await sendMail({ to: user.email, subject: `${general.platformName} panel şifre sıfırlama`, html: passwordResetHtml(general.platformName, "#111111", panelUrl(`/panel/sifre-sifirla?token=${token}`)), template: "admin_password_reset", merchantId: user.merchantId });
  }
  // Hesabın var olup olmadığı açığa çıkmasın diye her durumda aynı yanıt verilir.
  return { ok: true, message: "Bu e-posta ile kayıtlı bir hesap varsa şifre sıfırlama bağlantısı gönderildi. Gelen kutunu (ve spam klasörünü) kontrol et." };
}

export async function resetAdminPassword(_: SimpleState, form: FormData): Promise<SimpleState> {
  const token = String(form.get("token") ?? "");
  const password = String(form.get("password") ?? "");
  if (password.length < 8) return { error: "Şifre en az 8 karakter olmalı." };
  if (password !== String(form.get("confirm") ?? "")) return { error: "Şifreler eşleşmiyor." };
  const row = await db.query.passwordResets.findFirst({ where: eq(schema.passwordResets.token, token) });
  if (!row || !row.adminUserId || row.usedAt || row.expiresAt < new Date()) return { error: "Bağlantı geçersiz ya da süresi dolmuş. Yeniden şifre sıfırlama talebinde bulun." };
  const { hashPassword } = await import("@/lib/auth");
  await db.update(schema.adminUsers).set({ passwordHash: await hashPassword(password) }).where(eq(schema.adminUsers.id, row.adminUserId));
  await db.update(schema.passwordResets).set({ usedAt: new Date() }).where(eq(schema.passwordResets.token, token));
  redirect("/panel/giris?sifirlandi=1");
}

/* ------------------------------------------------------------------ */
/* Satıcı kaydı (Platform Ayarları > Genel > Satıcı kaydı açık)          */
/* ------------------------------------------------------------------ */

export async function panelSignup(_: SimpleState, form: FormData): Promise<SimpleState> {
  const { getPlatformSetting } = await import("@/lib/platform-settings");
  const general = await getPlatformSetting("general");
  if (!general.signupOpen) return { error: "Yeni satıcı kaydı şu an kapalı." };
  if (String(form.get("website") ?? "")) return { error: "Kayıt tamamlanamadı." }; // bot tuzağı
  const s = (k: string) => String(form.get(k) ?? "").trim();
  const storeName = s("storeName");
  const name = s("name");
  const email = s("email").toLowerCase();
  const password = String(form.get("password") ?? "");
  if (storeName.length < 2 || name.length < 2) return { error: "Mağaza adı ve ad soyad girin." };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Geçerli bir e-posta girin." };
  if (password.length < 8) return { error: "Şifre en az 8 karakter olmalı." };
  if (form.get("kvkk") !== "on") return { error: "Devam etmek için kullanım koşullarını ve KVKK metnini onaylayın." };
  if (await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.email, email) })) return { error: "Bu e-posta ile zaten bir hesap var. Giriş yapmayı deneyin." };
  const { PLANS } = await import("@/lib/plans");
  const planKey = (["baslangic", "pro", "kurumsal"].includes(s("plan")) ? s("plan") : general.defaultPlan) as keyof typeof PLANS;
  const plan = PLANS[planKey];
  const { hashPassword } = await import("@/lib/auth");
  const [m] = await db
    .insert(schema.merchants)
    .values({
      name: storeName,
      email,
      phone: s("phone") || null,
      plan: plan.key,
      status: "trial",
      siteLimit: plan.siteLimit,
      productLimit: plan.productLimit,
      aiMonthlyLimit: plan.aiMonthlyLimit,
      trialEndsAt: new Date(Date.now() + Math.max(1, general.trialDays) * 86400000),
    })
    .returning();
  const [u] = await db.insert(schema.adminUsers).values({ merchantId: m.id, email, name, role: "merchant_owner", passwordHash: await hashPassword(password), lastLoginAt: new Date() }).returning();
  const { notify, panelUrl } = await import("@/lib/notify");
  const { sendMail, welcomeMerchantHtml } = await import("@/lib/mailer");
  await notify({ merchantId: null, type: "merchant", title: `Yeni kayıt: ${storeName}`, body: `${name} · ${email} · ${plan.name} deneme`, link: `/panel/saticilar/${m.id}` });
  await notify({ merchantId: m.id, type: "system", title: `${general.platformName}'a hoş geldin!`, body: "Kurulum adımlarını tamamlayarak ilk siteni dakikalar içinde yayına alabilirsin.", link: "/panel" });
  await sendMail({ to: email, subject: `${general.platformName} hesabın hazır`, html: welcomeMerchantHtml(general.platformName, panelUrl("/panel"), { name, email }), template: "welcome_merchant", merchantId: m.id });
  await setAdminSession({ uid: u.id, role: u.role, mid: m.id });
  redirect("/panel?hosgeldin=1");
}
