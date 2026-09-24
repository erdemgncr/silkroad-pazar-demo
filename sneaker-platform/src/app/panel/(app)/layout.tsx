import type { Metadata } from "next";
import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePanel, selectedMerchantId } from "@/lib/panel";
import { PanelShell } from "@/components/panel/shell";
import { panelLogout } from "@/lib/actions/panel-auth";
import { PLANS } from "@/lib/plans";

export const metadata: Metadata = { title: { default: "Panel", template: "%s | SneakerOS Panel" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

function currentTime() {
  return Date.now();
}

export default async function PanelLayout({ children }: LayoutProps<"/panel">) {
  const ctx = await requirePanel();
  const { user, merchant, isPlatform } = ctx;
  const siteRows = isPlatform
    ? await db.select({ id: schema.sites.id }).from(schema.sites)
    : await db.select({ id: schema.sites.id }).from(schema.sites).where(eq(schema.sites.merchantId, merchant!.id));
  const siteIds = siteRows.map((s) => s.id);
  const notifScope = merchant ? eq(schema.notifications.merchantId, merchant.id) : isNull(schema.notifications.merchantId);

  const [pendingOrders, unreadMessages, unreadNotifications, notifications, merchants, current] = await Promise.all([
    siteIds.length
      ? db
          .select({ n: sql<number>`count(*)::int` })
          .from(schema.orders)
          .where(and(inArray(schema.orders.siteId, siteIds), inArray(schema.orders.status, ["paid", "preparing"])))
          .then((r) => r[0]?.n ?? 0)
      : 0,
    siteIds.length
      ? db
          .select({ n: sql<number>`count(*)::int` })
          .from(schema.contactMessages)
          .where(and(inArray(schema.contactMessages.siteId, siteIds), eq(schema.contactMessages.read, false)))
          .then((r) => r[0]?.n ?? 0)
      : 0,
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.notifications)
      .where(and(notifScope, isNull(schema.notifications.readAt)))
      .then((r) => r[0]?.n ?? 0),
    db.select().from(schema.notifications).where(notifScope).orderBy(desc(schema.notifications.createdAt)).limit(10),
    isPlatform ? db.select({ id: schema.merchants.id, name: schema.merchants.name }).from(schema.merchants).orderBy(asc(schema.merchants.name)) : [],
    selectedMerchantId(ctx),
  ]);

  let alert: { text: string; href: string; tone: "amber" | "red" } | null = null;
  if (merchant) {
    const nowMs = currentTime();
    const end = merchant.paidUntil ?? (merchant.status === "trial" ? merchant.trialEndsAt : null);
    if (end) {
      const days = Math.ceil((end.getTime() - nowMs) / 86400000);
      const what = merchant.paidUntil ? "Aboneliğin" : "Deneme süren";
      if (days < 0) alert = { text: `${what} sona erdi. Sitelerinin kesintisiz yayında kalması için paketini yenile.`, href: "/panel/hesap?sekme=paket", tone: "red" };
      else if (days <= 5) alert = { text: `${what} ${days === 0 ? "bugün" : `${days} gün sonra`} bitiyor.`, href: "/panel/hesap?sekme=paket", tone: "amber" };
    }
  }

  return (
    <PanelShell
      alert={alert}
      isPlatform={isPlatform}
      userName={user.name}
      userEmail={user.email}
      accountName={isPlatform ? "Platform Yönetimi" : (merchant?.name ?? "")}
      planName={merchant ? `${PLANS[merchant.plan].name} paket${merchant.status === "trial" ? " · Deneme" : ""}` : "Süper Admin"}
      merchants={merchants}
      currentMerchantId={current}
      counts={{ pendingOrders, unreadMessages, unreadNotifications }}
      notifications={notifications.map((n) => ({ id: n.id, type: n.type, title: n.title, body: n.body, link: n.link, read: Boolean(n.readAt), at: n.createdAt.toISOString() }))}
      logout={panelLogout}
    >
      {children}
    </PanelShell>
  );
}
