"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { PANEL_MERCHANT_COOKIE, requirePanel, requirePlatform } from "@/lib/panel";

/** Platform yöneticisi: hangi satıcı adına işlem yapılacağını seçer. */
export async function switchMerchant(merchantId: number) {
  await requirePlatform();
  (await cookies()).set(PANEL_MERCHANT_COOKIE, String(merchantId), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  revalidatePath("/panel", "layout");
}

function scope(merchantId: number | null) {
  return merchantId ? eq(schema.notifications.merchantId, merchantId) : isNull(schema.notifications.merchantId);
}

export async function markNotificationRead(id: number) {
  const ctx = await requirePanel();
  await db
    .update(schema.notifications)
    .set({ readAt: new Date() })
    .where(and(eq(schema.notifications.id, id), scope(ctx.merchant?.id ?? null)));
  revalidatePath("/panel", "layout");
}

export async function markAllNotificationsRead() {
  const ctx = await requirePanel();
  await db
    .update(schema.notifications)
    .set({ readAt: new Date() })
    .where(and(scope(ctx.merchant?.id ?? null), isNull(schema.notifications.readAt)));
  revalidatePath("/panel", "layout");
}

export async function deleteReadNotifications() {
  const ctx = await requirePanel();
  await db.delete(schema.notifications).where(and(scope(ctx.merchant?.id ?? null), sql`${schema.notifications.readAt} is not null`));
  revalidatePath("/panel/bildirimler");
}
