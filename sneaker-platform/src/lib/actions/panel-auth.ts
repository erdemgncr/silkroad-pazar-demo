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
