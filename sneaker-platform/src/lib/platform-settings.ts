import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { cached, invalidate } from "@/lib/cache";

export type GeneralSettings = {
  platformName: string;
  supportEmail: string;
  signupOpen: boolean;
  defaultPlan: "baslangic" | "pro" | "kurumsal";
  trialDays: number;
  serverIp: string;
};
export type SmtpSettings = { host: string; port: number; secure: boolean; username: string; password: string; fromEmail: string; fromName: string };
export type AiSettings = { geminiApiKey: string; geminiModel: string; tone: string };
export type JobsState = { lastDaily: string; lastHourly: string };
export type BillingSettings = {
  /** demo: gerçek ödeme alınmaz (test onayı); shopier: platformun Shopier ödeme modülü ile tahsilat */
  mode: "demo" | "shopier";
  shopierApiKey: string;
  shopierApiSecret: string;
  websiteIndex: number;
  yearlyDiscountPercent: number;
  /** Havale/EFT için banka bilgisi (isteğe bağlı, faturada gösterilir) */
  bankInfo: string;
};

const DEFAULTS = {
  general: { platformName: "SneakerOS", supportEmail: "", signupOpen: false, defaultPlan: "baslangic", trialDays: 14, serverIp: "" } as GeneralSettings,
  smtp: { host: "", port: 587, secure: false, username: "", password: "", fromEmail: "", fromName: "" } as SmtpSettings,
  ai: { geminiApiKey: "", geminiModel: process.env.GEMINI_MODEL ?? "gemini-2.5-flash", tone: "samimi, güven veren, satış odaklı" } as AiSettings,
  jobs: { lastDaily: "", lastHourly: "" } as JobsState,
  billing: { mode: "demo", shopierApiKey: "", shopierApiSecret: "", websiteIndex: 1, yearlyDiscountPercent: 20, bankInfo: "" } as BillingSettings,
};

type Keys = keyof typeof DEFAULTS;

export async function getPlatformSetting<K extends Keys>(key: K): Promise<(typeof DEFAULTS)[K]> {
  return cached(`platform:${key}`, 60_000, async () => {
    const row = await db.query.platformSettings.findFirst({ where: eq(schema.platformSettings.key, key) });
    return { ...DEFAULTS[key], ...((row?.value as object) ?? {}) } as (typeof DEFAULTS)[K];
  });
}

export async function setPlatformSetting<K extends Keys>(key: K, value: (typeof DEFAULTS)[K]) {
  await db
    .insert(schema.platformSettings)
    .values({ key, value })
    .onConflictDoUpdate({ target: schema.platformSettings.key, set: { value, updatedAt: new Date() } });
  invalidate(`platform:${key}`);
}
