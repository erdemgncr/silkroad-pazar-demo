"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireMerchant } from "@/lib/panel";
import { merchantCatalogKey } from "@/lib/catalog-admin";
import { importFromShopier, importRecentOrders, pushProducts, registerWebhooks, testConnection } from "@/lib/shopier/sync";

export type FormState = { ok?: boolean; error?: string; message?: string } | null;

async function ownedAccount(id: number) {
  const ctx = await requireMerchant();
  const acc = await db.query.shopierAccounts.findFirst({ where: and(eq(schema.shopierAccounts.id, id), eq(schema.shopierAccounts.merchantId, ctx.merchant.id)) });
  if (!acc) throw new Error("Shopier hesabı bulunamadı");
  return { ctx, acc };
}

export async function saveShopierAccount(accountId: number | null, _: FormState, form: FormData): Promise<FormState> {
  const ctx = await requireMerchant();
  const s = (k: string) => String(form.get(k) ?? "").trim();
  const name = s("name");
  if (name.length < 2) return { error: "Hesaba bir ad verin (örn. Ana mağaza)." };
  const existing = accountId ? (await ownedAccount(accountId)).acc : null;
  // Gizli alanlar boş bırakılırsa mevcut değer korunur.
  const values = {
    name,
    shopSlug: s("shopSlug") || null,
    apiKey: s("apiKey") || existing?.apiKey || null,
    apiSecret: s("apiSecret") || existing?.apiSecret || null,
    personalAccessToken: s("personalAccessToken") || existing?.personalAccessToken || null,
  };
  if (!values.personalAccessToken && !(values.apiKey && values.apiSecret)) return { error: "En az Kişisel Erişim Anahtarı (PAT) ya da ödeme modülü API Key + Secret girin." };
  let id = accountId;
  if (accountId) await db.update(schema.shopierAccounts).set(values).where(eq(schema.shopierAccounts.id, accountId));
  else {
    const [row] = await db.insert(schema.shopierAccounts).values({ merchantId: ctx.merchant.id, ...values }).returning();
    id = row.id;
  }
  let msg = "Kaydedildi.";
  if (values.personalAccessToken && id) {
    const r = await testConnection(id);
    msg = r.message;
  }
  revalidatePath("/panel/shopier");
  return { ok: true, message: msg };
}

export async function deleteShopierAccount(id: number) {
  await ownedAccount(id);
  // Bu hesaba bağlı sitelerin ödeme modu test moduna alınır (ödeme alınamaz durumda kalmasın).
  await db.update(schema.sites).set({ paymentMode: "demo", shopierAccountId: null, shopierWebsiteIndex: null }).where(eq(schema.sites.shopierAccountId, id));
  await db.delete(schema.shopierAccounts).where(eq(schema.shopierAccounts.id, id));
  revalidatePath("/panel/shopier");
  return { ok: true, message: "Hesap kaldırıldı." };
}

export async function testShopier(id: number): Promise<FormState> {
  await ownedAccount(id);
  const r = await testConnection(id);
  revalidatePath("/panel/shopier");
  return r.token ? { ok: true, message: r.message } : { error: r.message };
}

export async function importShopierProducts(id: number): Promise<FormState> {
  await ownedAccount(id);
  try {
    const r = await importFromShopier(id);
    revalidatePath("/panel/shopier");
    return { ok: true, message: `Shopier'den ${r.total} ürün okundu: ${r.created} yeni, ${r.updated} güncellendi.` };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function pushAllToShopier(id: number): Promise<FormState> {
  const { ctx } = await ownedAccount(id);
  const rows = await db.select({ id: schema.products.id }).from(schema.products).where(and(eq(schema.products.catalogKey, merchantCatalogKey(ctx.merchant.id)), eq(schema.products.active, true)));
  try {
    const r = await pushProducts(id, rows.map((x) => x.id));
    revalidatePath("/panel/shopier");
    return { ok: true, message: `${r.ok} ürün aktarıldı, ${r.failed} hata.` };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function setupWebhooks(id: number): Promise<FormState> {
  await ownedAccount(id);
  try {
    const r = await registerWebhooks(id);
    revalidatePath("/panel/shopier");
    return { ok: true, message: `${r.count} webhook kaydedildi (${r.url}).` };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function syncShopierOrders(id: number): Promise<FormState> {
  await ownedAccount(id);
  try {
    const r = await importRecentOrders(id, 14);
    revalidatePath("/panel/shopier");
    return { ok: true, message: `Son 14 günün ${r.read} Shopier siparişi okundu, ${r.saved} kaydedildi.` };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
