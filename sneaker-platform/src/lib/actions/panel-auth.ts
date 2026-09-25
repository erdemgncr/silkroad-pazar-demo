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
/* Kurulum sihirbazı: hesap + mağaza + tema + katalog tek adımda          */
/* ------------------------------------------------------------------ */

const RESERVED_SLUGS = new Set(["www", "panel", "api", "admin", "app", "static", "mail", "shop"]);

export type WizardCheck = { emailTaken: boolean; slug: string; slugTaken: boolean; suggestion: string };

/** Sihirbaz adımlarında e-posta ve site adresi uygunluğunu kontrol eder. */
export async function checkWizard(email: string, slugInput: string): Promise<WizardCheck> {
  const { slugify } = await import("@/lib/taxonomy");
  const e = email.trim().toLowerCase();
  const emailTaken = e ? Boolean(await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.email, e) })) : false;
  const slug = slugify(slugInput).slice(0, 40);
  const taken = async (s: string) => RESERVED_SLUGS.has(s) || Boolean(await db.query.sites.findFirst({ where: eq(schema.sites.slug, s) }));
  const slugTaken = slug.length < 3 ? true : await taken(slug);
  let suggestion = slug;
  if (slugTaken && slug.length >= 3) for (let i = 2; await taken(suggestion); i++) suggestion = `${slug}-${i}`;
  return { emailTaken, slug, slugTaken, suggestion };
}

const wizardSchema = z.object({
  name: z.string().trim().min(2, "Ad soyad girin."),
  email: z.string().trim().toLowerCase().email("Geçerli bir e-posta girin."),
  phone: z.string().trim().max(30).default(""),
  password: z.string().min(8, "Şifre en az 8 karakter olmalı."),
  kvkk: z.literal(true, { message: "Kullanım koşullarını ve KVKK metnini onaylayın." }),
  storeName: z.string().trim().min(2, "Mağaza adını yazın.").max(60),
  slug: z.string().trim().default(""),
  city: z.string().trim().max(40).default("İstanbul"),
  theme: z.string(),
  primary: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  catalog: z.enum(["top", "select", "empty"]),
  brands: z.array(z.string()).max(30).default([]),
  categories: z.array(z.string()).max(20).default([]),
  plan: z.string().default(""),
  website: z.string().default(""),
});

export type WizardInput = z.input<typeof wizardSchema>;

export async function completeWizard(input: WizardInput): Promise<{ error: string; step?: number }> {
  const { getPlatformSetting } = await import("@/lib/platform-settings");
  const general = await getPlatformSetting("general");
  if (!general.signupOpen) return { error: "Yeni satıcı kaydı şu an kapalı." };
  const parsed = wizardSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = String(issue.path[0] ?? "");
    const step = ["name", "email", "phone", "password", "kvkk"].includes(field) ? 0 : ["storeName", "slug", "city"].includes(field) ? 1 : field === "theme" || field === "primary" ? 2 : 3;
    return { error: issue.message, step };
  }
  const d = parsed.data;
  if (d.website) return { error: "Kayıt tamamlanamadı." };
  const { isThemeKey, THEMES } = await import("@/themes/registry");
  if (!isThemeKey(d.theme)) return { error: "Bir tasarım seçin.", step: 2 };
  if (await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.email, d.email) })) return { error: "Bu e-posta ile zaten bir hesap var. Giriş yapmayı deneyin.", step: 0 };

  const { PLANS } = await import("@/lib/plans");
  const planKey = (["baslangic", "pro", "kurumsal"].includes(d.plan) ? d.plan : general.defaultPlan) as keyof typeof PLANS;
  const plan = PLANS[planKey];
  const check = await checkWizard("", d.slug || d.storeName);
  if (check.slug.length < 3) return { error: "Site adresi en az 3 karakter olmalı.", step: 1 };
  const slug = check.slugTaken ? check.suggestion : check.slug;

  const { hashPassword } = await import("@/lib/auth");
  const [m] = await db
    .insert(schema.merchants)
    .values({
      name: d.storeName,
      email: d.email,
      phone: d.phone || null,
      plan: plan.key,
      status: "trial",
      siteLimit: plan.siteLimit,
      productLimit: plan.productLimit,
      aiMonthlyLimit: plan.aiMonthlyLimit,
      trialEndsAt: new Date(Date.now() + Math.max(1, general.trialDays) * 86400000),
    })
    .returning();
  const [u] = await db.insert(schema.adminUsers).values({ merchantId: m.id, email: d.email, name: d.name, role: "merchant_owner", passwordHash: await hashPassword(d.password), lastLoginAt: new Date() }).returning();

  const { createSite } = await import("@/lib/site-factory");
  const theme = d.theme as keyof typeof THEMES;
  const site = await createSite({
    merchantId: m.id,
    name: d.storeName,
    slug,
    theme,
    status: "draft",
    city: d.city || undefined,
    settingsPatch: d.primary ? { colors: { ...THEMES[theme].defaults, primary: d.primary } } : undefined,
  });

  let added = 0;
  if (d.catalog !== "empty") {
    const { and: andOp, desc: descOp, ilike, inArray, or } = await import("drizzle-orm");
    const { importFromPool, POOL_KEY } = await import("@/lib/catalog-admin");
    const conds = [eq(schema.products.catalogKey, POOL_KEY), eq(schema.products.active, true)];
    if (d.catalog === "select" && d.brands.length) conds.push(or(...d.brands.map((b) => ilike(schema.products.brand, b)))!);
    if (d.catalog === "select" && d.categories.length) conds.push(inArray(schema.products.category, d.categories));
    const ids = await db
      .select({ id: schema.products.id })
      .from(schema.products)
      .where(andOp(...conds))
      .orderBy(descOp(schema.products.popularity))
      .limit(Math.min(plan.productLimit, d.catalog === "top" ? 60 : 300));
    if (ids.length) added = (await importFromPool(m.id, ids.map((x) => x.id))).added;
  }

  const { notify, panelUrl } = await import("@/lib/notify");
  const { sendMail, welcomeMerchantHtml } = await import("@/lib/mailer");
  await notify({ merchantId: null, type: "merchant", title: `Yeni kayıt: ${d.storeName}`, body: `${d.name} · ${d.email} · ${plan.name} deneme · ${THEMES[theme].name} tema · ${added} ürün`, link: `/panel/saticilar/${m.id}` });
  await notify({ merchantId: m.id, type: "system", title: `${general.platformName}'a hoş geldin!`, body: `${d.storeName} mağazan ${THEMES[theme].name} tasarımıyla kuruldu${added ? `, ${added} ürün eklendi` : ""}. Shopier hesabını bağlayıp yayına alabilirsin.`, link: `/panel/siteler/${site.id}` });
  await sendMail({ to: d.email, subject: `${general.platformName} mağazan hazır`, html: welcomeMerchantHtml(general.platformName, panelUrl("/panel"), { name: d.name, email: d.email }), template: "welcome_merchant", merchantId: m.id });
  const { invalidateAll } = await import("@/lib/cache");
  invalidateAll();
  await setAdminSession({ uid: u.id, role: u.role, mid: m.id });
  redirect("/panel?hosgeldin=1");
}
