import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET ?? "dev-secret-change-me-please-32-characters-long");
const secure = process.env.NODE_ENV === "production";

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}
export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export async function signToken(payload: Record<string, unknown>, expires = "30d") {
  return new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(expires).sign(secret);
}

export async function readToken<T>(token: string | undefined): Promise<T | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as T;
  } catch {
    return null;
  }
}

/* ---------------- Mağaza müşterisi ---------------- */

export type CustomerSession = { cid: number; sid: number };
const CUSTOMER_COOKIE = "customer_session";

export async function setCustomerSession(s: CustomerSession) {
  (await cookies()).set(CUSTOMER_COOKIE, await signToken(s), { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 60 * 60 * 24 * 30 });
}
export async function clearCustomerSession() {
  (await cookies()).delete(CUSTOMER_COOKIE);
}
export async function getCustomerSession(siteId: number): Promise<CustomerSession | null> {
  const s = await readToken<CustomerSession>((await cookies()).get(CUSTOMER_COOKIE)?.value);
  return s && s.sid === siteId ? s : null;
}

/* ---------------- Panel kullanıcısı ---------------- */

export type AdminSession = { uid: number; role: "owner" | "editor" | "merchant_owner" | "merchant_staff"; mid: number | null };
export const ADMIN_COOKIE = "admin_session";

export async function setAdminSession(s: AdminSession) {
  (await cookies()).set(ADMIN_COOKIE, await signToken(s, "7d"), { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 60 * 60 * 24 * 7 });
}
export async function clearAdminSession() {
  const c = await cookies();
  c.delete(ADMIN_COOKIE);
  c.delete("preview_site");
}
export async function getAdminSession(): Promise<AdminSession | null> {
  return readToken<AdminSession>((await cookies()).get(ADMIN_COOKIE)?.value);
}
