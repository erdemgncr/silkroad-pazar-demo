"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { db, schema } from "@/db";
import type { PlanKey } from "@/db/schema";
import { PANEL_MERCHANT_COOKIE, requirePlatform } from "@/lib/panel";
import { hashPassword } from "@/lib/auth";
import { PLANS } from "@/lib/plans";
import { sendMail, testMailHtml, welcomeMerchantHtml } from "@/lib/mailer";
import { notify, panelUrl } from "@/lib/notify";
import { getPlatformSetting, setPlatformSetting } from "@/lib/platform-settings";
import { importFromPool } from "@/lib/catalog-admin";
import { createSite } from "@/lib/site-factory";
import { isThemeKey } from "@/themes/registry";
import { slugify } from "@/lib/taxonomy";
import { invalidateAll } from "@/lib/cache";
import { testGemini } from "@/lib/ai/gemini";

export type FormState = { ok?: boolean; error?: string; message?: string } | null;
const isEmail = (s: string) => /^\S+@\S+\.\S+$/.test(s);
const planKey = (v: unknown): PlanKey => (["baslangic", "pro", "kurumsal"].includes(String(v)) ? (String(v) as PlanKey) : "baslangic");

/* ------------------------------------------------------------------ */
/* Satıcılar                                                            */
/* ------------------------------------------------------------------ */

export async function createMerchant(_: FormState, form: FormData): Promise<FormState> {
  await requirePlatform();
  const s = (k: string) => String(form.get(k) ?? "").trim();
  const name = s("name");
  const email = s("email").toLowerCase();
  if (name.length < 2 || !isEmail(email)) return { error: "Mağaza adı ve geçerli e-posta girin." };
  if (await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.email, email) })) return { error: "Bu e-posta ile bir panel kullanıcısı zaten var." };
  const plan = PLANS[planKey(s("plan"))];
  const trialDays = Number(s("trialDays") || 0);
  const password = s("password") || randomBytes(6).toString("base64url");
  const [m] = await db
    .insert(schema.merchants)
    .values({
      name,
      email,
      phone: s("phone") || null,
      plan: plan.key,
      status: trialDays > 0 ? "trial" : "active",
      siteLimit: plan.siteLimit,
      productLimit: plan.productLimit,
      aiMonthlyLimit: plan.aiMonthlyLimit,
      trialEndsAt: trialDays > 0 ? new Date(Date.now() + trialDays * 86400000) : null,
    })
    .returning();
  await db.insert(schema.adminUsers).values({ merchantId: m.id, email, name: s("ownerName") || name, role: "merchant_owner", passwordHash: await hashPassword(password) });

  const notes: string[] = [];
  if (form.get("importPool") === "on") {
    const r = await importFromPool(m.id, "all");
    notes.push(`${r.added} havuz ürünü eklendi`);
  }
  const theme = s("theme");
  if (s("siteName") && isThemeKey(theme)) {
    let slug = slugify(s("siteName"));
    for (let i = 2; await db.query.sites.findFirst({ where: eq(schema.sites.slug, slug) }); i++) slug = `${slugify(s("siteName"))}-${i}`;
    await createSite({ merchantId: m.id, name: s("siteName"), slug, theme, status: "draft" });
    notes.push(`${s("siteName")} sitesi oluşturuldu`);
  }
  let mailNote = "";
  if (form.get("sendWelcome") === "on") {
    const general = await getPlatformSetting("general");
    const r = await sendMail({ to: email, subject: `${general.platformName} hesabınız hazır`, html: welcomeMerchantHtml(general.platformName, panelUrl("/panel/giris"), { name, email, password }), template: "welcome_merchant", merchantId: m.id });
    mailNote = r.status === "sent" ? " Hoş geldin e-postası gönderildi." : ` (SMTP yok, e-posta gönderilemedi) Geçici şifre: ${password}`;
  } else mailNote = ` Geçici şifre: ${password}`;
  await notify({ merchantId: null, type: "merchant", title: `Yeni satıcı: ${name}`, body: `${plan.name} paket${notes.length ? ` · ${notes.join(", ")}` : ""}`, link: `/panel/saticilar/${m.id}` });
  invalidateAll();
  revalidatePath("/panel/saticilar");
  return { ok: true, message: `${name} oluşturuldu.${notes.length ? ` ${notes.join(", ")}.` : ""}${mailNote}` };
}

export async function updateMerchant(id: number, _: FormState, form: FormData): Promise<FormState> {
  await requirePlatform();
  const s = (k: string) => String(form.get(k) ?? "").trim();
  const m = await db.query.merchants.findFirst({ where: eq(schema.merchants.id, id) });
  if (!m) return { error: "Satıcı bulunamadı." };
  const plan = planKey(s("plan"));
  const applyPlan = form.get("applyPlanLimits") === "on" && plan !== m.plan;
  const status = (["trial", "active", "suspended"].includes(s("status")) ? s("status") : m.status) as "trial" | "active" | "suspended";
  const num = (k: string, fallback: number) => (s(k) === "" ? fallback : Math.max(0, Math.floor(Number(s(k)) || 0)));
  await db
    .update(schema.merchants)
    .set({
      name: s("name") || m.name,
      email: isEmail(s("email")) ? s("email").toLowerCase() : m.email,
      phone: s("phone") || null,
      plan,
      status,
      siteLimit: applyPlan ? PLANS[plan].siteLimit : num("siteLimit", m.siteLimit),
      productLimit: applyPlan ? PLANS[plan].productLimit : num("productLimit", m.productLimit),
      aiMonthlyLimit: applyPlan ? PLANS[plan].aiMonthlyLimit : num("aiMonthlyLimit", m.aiMonthlyLimit),
      trialEndsAt: s("trialEndsAt") ? new Date(s("trialEndsAt")) : null,
      adminNote: s("adminNote") || null,
    })
    .where(eq(schema.merchants.id, id));
  if (status !== m.status) {
    await notify({
      merchantId: id,
      type: "system",
      title: status === "suspended" ? "Hesabınız askıya alındı" : status === "active" ? "Hesabınız aktif" : "Deneme sürümü",
      body: status === "suspended" ? "Sitelerinize erişim devam eder ancak panel girişi kapatılmıştır. Destek ile iletişime geçin." : "",
    });
  }
  if (plan !== m.plan) await notify({ merchantId: id, type: "system", title: `Paketiniz ${PLANS[plan].name} olarak güncellendi`, body: `Site: ${PLANS[plan].siteLimit}, ürün: ${PLANS[plan].productLimit}, AI: ${PLANS[plan].aiMonthlyLimit}/ay` });
  revalidatePath(`/panel/saticilar/${id}`);
  revalidatePath("/panel/saticilar");
  return { ok: true, message: applyPlan ? `Kaydedildi; ${PLANS[plan].name} paket limitleri uygulandı.` : "Kaydedildi." };
}

export async function resetMerchantPassword(userId: number): Promise<FormState> {
  await requirePlatform();
  const u = await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.id, userId) });
  if (!u || !u.merchantId) return { error: "Kullanıcı bulunamadı." };
  const password = randomBytes(6).toString("base64url");
  await db.update(schema.adminUsers).set({ passwordHash: await hashPassword(password) }).where(eq(schema.adminUsers.id, u.id));
  const general = await getPlatformSetting("general");
  const r = await sendMail({ to: u.email, subject: `${general.platformName} şifreniz sıfırlandı`, html: welcomeMerchantHtml(general.platformName, panelUrl("/panel/giris"), { name: u.name, email: u.email, password }), template: "merchant_password_reset", merchantId: u.merchantId });
  return { ok: true, message: r.status === "sent" ? `Yeni şifre ${u.email} adresine gönderildi.` : `Yeni geçici şifre: ${password}` };
}

export async function deleteMerchant(id: number, _: FormState, form: FormData): Promise<FormState> {
  await requirePlatform();
  const m = await db.query.merchants.findFirst({ where: eq(schema.merchants.id, id) });
  if (!m) return { error: "Satıcı bulunamadı." };
  if (String(form.get("confirm") ?? "").trim() !== m.name) return { error: `Onay için satıcı adını ("${m.name}") yazın.` };
  await db.delete(schema.products).where(eq(schema.products.catalogKey, `m:${m.id}`));
  await db.delete(schema.merchants).where(eq(schema.merchants.id, id));
  invalidateAll();
  redirect("/panel/saticilar");
}

/** Üst bardaki satıcı seçiciyi bu satıcıya çevirip satıcı sayfasına gider. */
export async function actAsMerchant(id: number, to: string) {
  await requirePlatform();
  (await cookies()).set(PANEL_MERCHANT_COOKIE, String(id), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  redirect(to.startsWith("/panel") ? to : "/panel/urunler");
}

/* ------------------------------------------------------------------ */
/* Platform ayarları                                                    */
/* ------------------------------------------------------------------ */

export async function saveGeneralSettings(_: FormState, form: FormData): Promise<FormState> {
  await requirePlatform();
  const s = (k: string) => String(form.get(k) ?? "").trim();
  if (s("supportEmail") && !isEmail(s("supportEmail"))) return { error: "Destek e-postası geçerli değil." };
  await setPlatformSetting("general", {
    platformName: s("platformName") || "SneakerOS",
    supportEmail: s("supportEmail"),
    signupOpen: form.get("signupOpen") === "on",
    defaultPlan: planKey(s("defaultPlan")),
    trialDays: Math.max(0, Number(s("trialDays")) || 0),
    serverIp: s("serverIp"),
  });
  revalidatePath("/panel/platform-ayarlari");
  return { ok: true, message: "Genel ayarlar kaydedildi." };
}

export async function saveSmtpSettings(_: FormState, form: FormData): Promise<FormState> {
  await requirePlatform();
  const s = (k: string) => String(form.get(k) ?? "").trim();
  const cur = await getPlatformSetting("smtp");
  if (s("fromEmail") && !isEmail(s("fromEmail"))) return { error: "Gönderen e-posta geçerli değil." };
  const port = Number(s("port") || 587);
  await setPlatformSetting("smtp", {
    host: s("host"),
    port,
    secure: form.get("secure") === "on" || port === 465,
    username: s("username"),
    password: s("password") || cur.password,
    fromEmail: s("fromEmail"),
    fromName: s("fromName"),
  });
  revalidatePath("/panel/platform-ayarlari");
  return { ok: true, message: "SMTP ayarları kaydedildi. Test e-postası göndererek doğrulayın." };
}

export async function sendPlatformTestMail(_: FormState, form: FormData): Promise<FormState> {
  await requirePlatform();
  const to = String(form.get("to") ?? "").trim();
  if (!isEmail(to)) return { error: "Geçerli bir e-posta girin." };
  const general = await getPlatformSetting("general");
  const r = await sendMail({ to, subject: `${general.platformName} - SMTP testi`, html: testMailHtml(general.platformName, "platform SMTP"), template: "test", fromName: general.platformName });
  if (r.status === "sent") return { ok: true, message: `Test e-postası ${to} adresine gönderildi.` };
  if (r.status === "logged") return { error: "SMTP sunucusu tanımlı değil." };
  return { error: `Gönderilemedi: ${r.error}` };
}

export async function saveAiSettings(_: FormState, form: FormData): Promise<FormState> {
  await requirePlatform();
  const s = (k: string) => String(form.get(k) ?? "").trim();
  const cur = await getPlatformSetting("ai");
  const key = s("geminiApiKey") || cur.geminiApiKey;
  const model = s("geminiModel") || "gemini-2.5-flash";
  if (s("geminiApiKey")) {
    try {
      await testGemini(key, model);
    } catch (e) {
      return { error: `Anahtar doğrulanamadı: ${(e as Error).message}` };
    }
  }
  await setPlatformSetting("ai", { geminiApiKey: key, geminiModel: model, tone: s("tone") || cur.tone });
  revalidatePath("/panel/platform-ayarlari");
  return { ok: true, message: s("geminiApiKey") ? "Gemini anahtarı doğrulandı ve kaydedildi." : "AI ayarları kaydedildi." };
}

export async function testPlatformAi(): Promise<FormState> {
  await requirePlatform();
  const ai = await getPlatformSetting("ai");
  const key = ai.geminiApiKey || process.env.GEMINI_API_KEY || "";
  if (!key) return { error: "Gemini anahtarı tanımlı değil." };
  try {
    await testGemini(key, ai.geminiModel);
    return { ok: true, message: `Gemini çalışıyor (${ai.geminiModel}).` };
  } catch (e) {
    return { error: (e as Error).message };
  }
}


export async function saveBillingSettings(_: FormState, form: FormData): Promise<FormState> {
  await requirePlatform();
  const s = (k: string) => String(form.get(k) ?? "").trim();
  const cur = await getPlatformSetting("billing");
  const mode = s("mode") === "shopier" ? "shopier" : "demo";
  const next = {
    mode: mode as "demo" | "shopier",
    shopierApiKey: s("shopierApiKey") || cur.shopierApiKey,
    shopierApiSecret: s("shopierApiSecret") || cur.shopierApiSecret,
    websiteIndex: Math.min(5, Math.max(1, Number(s("websiteIndex")) || 1)),
    yearlyDiscountPercent: Math.min(60, Math.max(0, Number(s("yearlyDiscountPercent")) || 0)),
    bankInfo: s("bankInfo"),
  };
  if (mode === "shopier" && (!next.shopierApiKey || !next.shopierApiSecret)) return { error: "Shopier ile tahsilat için API Key ve API Secret girin." };
  await setPlatformSetting("billing", next);
  revalidatePath("/panel/platform-ayarlari");
  return { ok: true, message: mode === "shopier" ? "Abonelik ödemeleri artık Shopier üzerinden alınacak." : "Test modunda: satıcılar ödemeyi test olarak onaylayabilir." };
}
