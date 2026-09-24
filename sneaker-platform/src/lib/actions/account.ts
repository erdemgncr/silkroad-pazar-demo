"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { and, eq, gt, isNull } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { resolveSite } from "@/lib/site";
import { clearCustomerSession, getCustomerSession, hashPassword, setCustomerSession, verifyPassword } from "@/lib/auth";
import { passwordResetHtml, sendMail, welcomeCustomerHtml } from "@/lib/mailer";
import { TR_CITIES } from "@/lib/tr-cities";

export type AccountState = { ok?: boolean; message?: string; errors?: Record<string, string> } | null;

async function currentSite() {
  const host = (await headers()).get("x-site-host");
  const site = host ? await resolveSite(host) : null;
  if (!site) throw new Error("Site bulunamadı");
  return site;
}

function errs(e: z.ZodError) {
  const o: Record<string, string> = {};
  for (const i of e.issues) {
    const k = String(i.path[0]);
    if (!o[k]) o[k] = i.message;
  }
  return o;
}

function safeNext(v: FormDataEntryValue | null) {
  const s = String(v ?? "");
  return s.startsWith("/") && !s.startsWith("//") ? s : "/hesabim";
}

export async function registerCustomer(_: AccountState, form: FormData): Promise<AccountState> {
  const site = await currentSite();
  const parsed = z
    .object({
      firstName: z.string().trim().min(2, "Adını yaz"),
      lastName: z.string().trim().min(2, "Soyadını yaz"),
      email: z.string().trim().toLowerCase().email("Geçerli bir e-posta gir"),
      phone: z.string().trim().max(20).optional().or(z.literal("")),
      password: z.string().min(8, "Şifre en az 8 karakter olmalı"),
      terms: z.literal("on", { message: "Üyelik sözleşmesini onaylamalısın" }),
      marketing: z.string().optional(),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { errors: errs(parsed.error), message: "Lütfen formu kontrol et." };
  const d = parsed.data;
  const exists = await db.query.customers.findFirst({ where: and(eq(schema.customers.siteId, site.id), eq(schema.customers.email, d.email)) });
  if (exists) return { errors: { email: "Bu e-posta ile kayıtlı bir hesap var. Giriş yapmayı dene." } };
  const [c] = await db
    .insert(schema.customers)
    .values({ siteId: site.id, email: d.email, firstName: d.firstName, lastName: d.lastName, phone: d.phone || null, passwordHash: await hashPassword(d.password), marketingConsent: d.marketing === "on" })
    .returning();
  await setCustomerSession({ cid: c.id, sid: site.id });
  void sendMail({ to: c.email, subject: `${site.name} ailesine hoş geldin!`, fromName: site.name, template: "welcome_customer", siteId: site.id, merchantId: site.merchantId, html: welcomeCustomerHtml(site.name, site.settings.colors.primary, site.baseUrl, c.firstName) });
  redirect(safeNext(form.get("devam")));
}

export async function loginCustomer(_: AccountState, form: FormData): Promise<AccountState> {
  const site = await currentSite();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const c = await db.query.customers.findFirst({ where: and(eq(schema.customers.siteId, site.id), eq(schema.customers.email, email)) });
  if (!c || !(await verifyPassword(password, c.passwordHash))) return { message: "E-posta veya şifre hatalı." };
  await setCustomerSession({ cid: c.id, sid: site.id });
  redirect(safeNext(form.get("devam")));
}

export async function logoutCustomer() {
  await clearCustomerSession();
  redirect("/");
}

export async function updateProfile(_: AccountState, form: FormData): Promise<AccountState> {
  const site = await currentSite();
  const s = await getCustomerSession(site.id);
  if (!s) redirect("/hesabim/giris");
  const parsed = z
    .object({ firstName: z.string().trim().min(2), lastName: z.string().trim().min(2), phone: z.string().trim().max(20).optional().or(z.literal("")), marketing: z.string().optional() })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { errors: errs(parsed.error), message: "Bilgileri kontrol et." };
  await db
    .update(schema.customers)
    .set({ firstName: parsed.data.firstName, lastName: parsed.data.lastName, phone: parsed.data.phone || null, marketingConsent: parsed.data.marketing === "on" })
    .where(eq(schema.customers.id, s.cid));
  return { ok: true, message: "Bilgilerin güncellendi." };
}

export async function changePassword(_: AccountState, form: FormData): Promise<AccountState> {
  const site = await currentSite();
  const s = await getCustomerSession(site.id);
  if (!s) redirect("/hesabim/giris");
  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  if (next.length < 8) return { errors: { next: "Yeni şifre en az 8 karakter olmalı" } };
  const c = await db.query.customers.findFirst({ where: eq(schema.customers.id, s.cid) });
  if (!c || !(await verifyPassword(current, c.passwordHash))) return { errors: { current: "Mevcut şifre hatalı" } };
  await db.update(schema.customers).set({ passwordHash: await hashPassword(next) }).where(eq(schema.customers.id, c.id));
  return { ok: true, message: "Şifren değiştirildi." };
}

const addressSchema = z.object({
  title: z.string().trim().min(2, "Adres başlığı gir (örn. Ev)"),
  fullName: z.string().trim().min(3, "Ad soyad gerekli"),
  phone: z.string().trim().min(10, "Telefon gerekli"),
  city: z.string().refine((v) => (TR_CITIES as readonly string[]).includes(v), "İl seçin"),
  district: z.string().trim().min(2, "İlçe gerekli"),
  line: z.string().trim().min(10, "Açık adres gerekli"),
  postcode: z.string().trim().max(10).optional().or(z.literal("")),
});

export async function saveAddress(_: AccountState, form: FormData): Promise<AccountState> {
  const site = await currentSite();
  const s = await getCustomerSession(site.id);
  if (!s) redirect("/hesabim/giris");
  const parsed = addressSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { errors: errs(parsed.error), message: "Adres bilgilerini kontrol et." };
  const id = Number(form.get("id") || 0);
  const values = { ...parsed.data, postcode: parsed.data.postcode || null };
  if (id) await db.update(schema.addresses).set(values).where(and(eq(schema.addresses.id, id), eq(schema.addresses.customerId, s.cid)));
  else await db.insert(schema.addresses).values({ ...values, customerId: s.cid });
  return { ok: true, message: "Adres kaydedildi." };
}

export async function deleteAddress(id: number) {
  const site = await currentSite();
  const s = await getCustomerSession(site.id);
  if (!s) return;
  await db.delete(schema.addresses).where(and(eq(schema.addresses.id, id), eq(schema.addresses.customerId, s.cid)));
}

export async function requestPasswordReset(_: AccountState, form: FormData): Promise<AccountState> {
  const site = await currentSite();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const c = await db.query.customers.findFirst({ where: and(eq(schema.customers.siteId, site.id), eq(schema.customers.email, email)) });
  if (c) {
    const token = randomBytes(24).toString("hex");
    await db.insert(schema.passwordResets).values({ token, customerId: c.id, expiresAt: new Date(Date.now() + 3600_000) });
    const link = `${site.baseUrl}/hesabim/sifre-sifirla?t=${token}`;
    await sendMail({ to: c.email, subject: `${site.name} şifre sıfırlama`, fromName: site.name, template: "password_reset", siteId: site.id, merchantId: site.merchantId, html: passwordResetHtml(site.name, site.settings.colors.primary, link) });
    if (!process.env.SMTP_HOST) console.info(`[mail] şifre sıfırlama bağlantısı: ${link}`);
  }
  // Hesabın var olup olmadığı açığa çıkmasın diye her durumda aynı mesaj.
  return { ok: true, message: "Bu e-posta ile kayıtlı bir hesap varsa şifre sıfırlama bağlantısı gönderildi." };
}

export async function resetPassword(_: AccountState, form: FormData): Promise<AccountState> {
  const site = await currentSite();
  const token = String(form.get("token") ?? "");
  const next = String(form.get("password") ?? "");
  if (next.length < 8) return { errors: { password: "Şifre en az 8 karakter olmalı" } };
  const r = await db.query.passwordResets.findFirst({
    where: and(eq(schema.passwordResets.token, token), isNull(schema.passwordResets.usedAt), gt(schema.passwordResets.expiresAt, new Date())),
  });
  if (!r?.customerId) return { message: "Bağlantının süresi dolmuş ya da geçersiz. Yeniden şifre sıfırlama talep et." };
  const c = await db.query.customers.findFirst({ where: and(eq(schema.customers.id, r.customerId), eq(schema.customers.siteId, site.id)) });
  if (!c) return { message: "Hesap bulunamadı." };
  await db.update(schema.customers).set({ passwordHash: await hashPassword(next) }).where(eq(schema.customers.id, c.id));
  await db.update(schema.passwordResets).set({ usedAt: new Date() }).where(eq(schema.passwordResets.token, token));
  await setCustomerSession({ cid: c.id, sid: site.id });
  redirect("/hesabim");
}

/** KVKK: müşteri kendi hesabını siler. Yasal saklama gereği siparişler korunur, hesapla bağlantısı kaldırılır. */
export async function deleteMyAccount(_: AccountState, form: FormData): Promise<AccountState> {
  const site = await currentSite();
  const s = await getCustomerSession(site.id);
  if (!s) redirect("/hesabim/giris");
  const c = await db.query.customers.findFirst({ where: eq(schema.customers.id, s.cid) });
  if (!c) redirect("/hesabim/giris");
  if (form.get("confirm") !== "on") return { errors: { confirm: "Onay kutusunu işaretle" } };
  if (!(await verifyPassword(String(form.get("password") ?? ""), c.passwordHash))) return { errors: { password: "Şifre hatalı" } };
  await db.delete(schema.newsletterSubscribers).where(and(eq(schema.newsletterSubscribers.siteId, site.id), eq(schema.newsletterSubscribers.email, c.email)));
  await db.delete(schema.stockAlerts).where(and(eq(schema.stockAlerts.siteId, site.id), eq(schema.stockAlerts.email, c.email)));
  await db.delete(schema.customers).where(eq(schema.customers.id, c.id));
  await clearCustomerSession();
  redirect("/?hesap=silindi");
}
