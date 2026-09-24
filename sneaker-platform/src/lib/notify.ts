import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { sendMail } from "@/lib/mailer";
import { getPlatformSetting } from "@/lib/platform-settings";

export type NotifyType = "order" | "message" | "stock" | "sync" | "system" | "merchant";

const PREF_KEY: Partial<Record<NotifyType, "newOrder" | "contactMessage" | "lowStock" | "syncError">> = {
  order: "newOrder",
  message: "contactMessage",
  stock: "lowStock",
  sync: "syncError",
};

/**
 * Panel bildirimi oluşturur; satıcının bildirim tercihine göre e-posta da gönderir.
 * merchantId boşsa bildirim platform (süper admin) içindir.
 */
export async function notify(opts: {
  merchantId: number | null;
  siteId?: number | null;
  type: NotifyType;
  title: string;
  body?: string;
  link?: string;
  email?: { subject: string; html: string; template: string };
}) {
  await db.insert(schema.notifications).values({
    merchantId: opts.merchantId,
    siteId: opts.siteId ?? null,
    type: opts.type,
    title: opts.title.slice(0, 200),
    body: (opts.body ?? "").slice(0, 1000),
    link: opts.link ?? null,
  });
  if (!opts.email) return;

  let to: string | null = null;
  if (opts.merchantId) {
    const m = await db.query.merchants.findFirst({ where: eq(schema.merchants.id, opts.merchantId) });
    const pref = PREF_KEY[opts.type];
    if (!m || (pref && !m.notifyPrefs[pref])) return;
    to = m.notifyEmail || m.email;
    if (opts.siteId) {
      const sm = await db.query.siteMailSettings.findFirst({ where: eq(schema.siteMailSettings.siteId, opts.siteId) });
      if (sm?.notifyEmail) to = sm.notifyEmail;
    }
  } else {
    to = (await getPlatformSetting("general")).supportEmail || null;
  }
  if (!to) return;
  await sendMail({ to, subject: opts.email.subject, html: opts.email.html, template: opts.email.template, siteId: opts.siteId ?? null, merchantId: opts.merchantId });
}

export function panelUrl(path: string) {
  return `${(process.env.PLATFORM_URL ?? "http://localhost:3000").replace(/\/$/, "")}${path}`;
}
