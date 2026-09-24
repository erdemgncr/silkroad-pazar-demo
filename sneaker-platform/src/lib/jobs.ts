import "server-only";
import { and, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { dailySummaryHtml, sendMail } from "@/lib/mailer";
import { notify, panelUrl } from "@/lib/notify";
import { getPlatformSetting, setPlatformSetting } from "@/lib/platform-settings";
import { importRecentOrders } from "@/lib/shopier/sync";

/**
 * Zamanlanmış işler (instrumentation.ts tarafından her 10 dakikada bir tetiklenir):
 *  - Her sabah 08:00 (TSİ): günlük satış özeti e-postası, deneme süresi uyarıları
 *  - Saatlik: Shopier'den kaçırılmış siparişlerin çekilmesi (webhook yedeği)
 */

const TR_OFFSET = 3 * 3600 * 1000;
const trDate = (ms: number) => new Date(ms + TR_OFFSET).toISOString().slice(0, 10);

export async function runScheduledJobs(now = Date.now()) {
  const state = await getPlatformSetting("jobs");
  const today = trDate(now);
  const trHour = new Date(now + TR_OFFSET).getUTCHours();
  if (state.lastDaily !== today && trHour >= 8) {
    await setPlatformSetting("jobs", { ...state, lastDaily: today });
    await dailySummaries(now).catch((e) => console.error("[jobs] günlük özet", e));
    await trialReminders(now).catch((e) => console.error("[jobs] deneme uyarısı", e));
  }
  const hourKey = new Date(now).toISOString().slice(0, 13);
  if (state.lastHourly !== hourKey) {
    await setPlatformSetting("jobs", { ...(await getPlatformSetting("jobs")), lastHourly: hourKey });
    await pullShopierOrders().catch((e) => console.error("[jobs] shopier sipariş", e));
  }
}

async function dailySummaries(now: number) {
  const end = new Date(`${trDate(now)}T00:00:00+03:00`);
  const start = new Date(end.getTime() - 86400000);
  const general = await getPlatformSetting("general");
  const merchants = await db.select().from(schema.merchants).where(inArray(schema.merchants.status, ["active", "trial"]));
  for (const m of merchants) {
    if (!m.notifyPrefs.dailySummary) continue;
    const sites = await db.select({ id: schema.sites.id, name: schema.sites.name }).from(schema.sites).where(eq(schema.sites.merchantId, m.id));
    if (!sites.length) continue;
    const ids = sites.map((s) => s.id);
    const perSite = await db
      .select({ siteId: schema.orders.siteId, n: sql<number>`count(*)::int`, sum: sql<number>`coalesce(sum(${schema.orders.total}),0)::int` })
      .from(schema.orders)
      .where(and(inArray(schema.orders.siteId, ids), gte(schema.orders.createdAt, start), lt(schema.orders.createdAt, end), inArray(schema.orders.status, ["paid", "preparing", "shipped", "delivered"])))
      .groupBy(schema.orders.siteId);
    const pending = await db.$count(schema.orders, and(inArray(schema.orders.siteId, ids), inArray(schema.orders.status, ["paid", "preparing"])));
    const messages = await db.$count(schema.contactMessages, and(inArray(schema.contactMessages.siteId, ids), eq(schema.contactMessages.read, false)));
    const low = await db
      .select({ title: schema.products.title })
      .from(schema.products)
      .where(and(eq(schema.products.catalogKey, `m:${m.id}`), eq(schema.products.active, true), sql`coalesce((select sum((v->>'stock')::int) from jsonb_array_elements(${schema.products.variants}) v),0) between 1 and 2`))
      .limit(8);
    const orders = perSite.reduce((a, r) => a + r.n, 0);
    const revenue = perSite.reduce((a, r) => a + r.sum, 0);
    await sendMail({
      to: m.notifyEmail || m.email,
      subject: `${general.platformName} günlük özet: ${orders} sipariş`,
      html: dailySummaryHtml(general.platformName, panelUrl("/panel"), {
        merchant: m.name,
        date: new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long" }).format(start),
        orders,
        revenue,
        pending,
        messages,
        lowStock: low.map((l) => l.title),
        perSite: perSite.map((r) => ({ name: sites.find((s) => s.id === r.siteId)?.name ?? "", orders: r.n, revenue: r.sum })),
      }),
      template: "daily_summary",
      merchantId: m.id,
    });
  }
}

async function trialReminders(now: number) {
  const soon = new Date(now + 3 * 86400000);
  // Ücretli abonelik: 3 gün kala ve bittiği gün uyarı
  const subs = await db.select().from(schema.merchants).where(and(eq(schema.merchants.status, "active"), lt(schema.merchants.paidUntil, soon)));
  for (const m of subs) {
    if (!m.paidUntil) continue;
    const days = Math.ceil((m.paidUntil.getTime() - now) / 86400000);
    if (days === 3 || days === 0 || days === -1) {
      await notify({
        merchantId: m.id,
        type: "system",
        title: days < 0 ? "Aboneliğiniz sona erdi" : days === 0 ? "Aboneliğiniz bugün bitiyor" : "Aboneliğiniz 3 gün sonra bitiyor",
        body: "Kesintisiz kullanım için Hesap > Paket bölümünden paketinizi yenileyin.",
        link: "/panel/hesap?sekme=paket",
        email: { subject: days < 0 ? "Aboneliğiniz sona erdi" : "Aboneliğiniz bitmek üzere", html: `<p>Merhaba ${m.name}, aboneliğiniz ${days < 0 ? "sona erdi" : days === 0 ? "bugün bitiyor" : "3 gün sonra bitiyor"}. Paketinizi panelden yenileyebilirsiniz: ${panelUrl("/panel/hesap?sekme=paket")}</p>`, template: "subscription_reminder" },
      });
      if (days < 0) await notify({ merchantId: null, type: "merchant", title: `Abonelik bitti: ${m.name}`, body: m.email, link: `/panel/saticilar/${m.id}` });
    }
  }
  const trials = await db.select().from(schema.merchants).where(and(eq(schema.merchants.status, "trial"), lt(schema.merchants.trialEndsAt, soon)));
  for (const m of trials) {
    const ended = m.trialEndsAt && m.trialEndsAt.getTime() < now;
    await notify({ merchantId: m.id, type: "system", title: ended ? "Deneme süreniz sona erdi" : "Deneme süreniz bitmek üzere", body: "Kesintisiz kullanım için Hesap > Paket bölümünden paket seçin.", link: "/panel/hesap?sekme=paket" });
    if (ended) await notify({ merchantId: null, type: "merchant", title: `Deneme bitti: ${m.name}`, body: m.email, link: `/panel/saticilar/${m.id}` });
  }
}

async function pullShopierOrders() {
  const accounts = await db.select().from(schema.shopierAccounts).where(eq(schema.shopierAccounts.productApiEnabled, true));
  for (const a of accounts) await importRecentOrders(a.id, 2).catch(() => undefined);
}
