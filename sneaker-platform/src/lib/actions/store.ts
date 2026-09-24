"use server";

import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db, schema } from "@/db";
import { resolveSite } from "@/lib/site";

export type ActionState = { ok: boolean; message: string; errors?: Record<string, string> } | null;

async function currentSite() {
  const h = await headers();
  const host = h.get("x-site-host");
  if (!host) return null;
  return resolveSite(host);
}

function fieldErrors(e: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of e.issues) {
    const k = String(issue.path[0] ?? "form");
    if (!out[k]) out[k] = issue.message;
  }
  return out;
}

const emailSchema = z.string().trim().toLowerCase().email("Geçerli bir e-posta adresi gir.");

export async function subscribeNewsletter(_: ActionState, form: FormData): Promise<ActionState> {
  const site = await currentSite();
  if (!site) return { ok: false, message: "Site bulunamadı." };
  const parsed = z
    .object({ email: emailSchema, consent: z.literal("on", { message: "Ticari elektronik ileti onayı gerekli." }) })
    .safeParse({ email: form.get("email"), consent: form.get("consent") });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message, errors: fieldErrors(parsed.error) };
  await db.insert(schema.newsletterSubscribers).values({ siteId: site.id, email: parsed.data.email }).onConflictDoNothing();
  return { ok: true, message: "Bültenimize kaydoldun! Kampanyalardan ilk sen haberdar olacaksın." };
}

export async function sendContactMessage(_: ActionState, form: FormData): Promise<ActionState> {
  const site = await currentSite();
  if (!site) return { ok: false, message: "Site bulunamadı." };
  const parsed = z
    .object({
      name: z.string().trim().min(2, "Adını ve soyadını yaz."),
      email: emailSchema,
      phone: z.string().trim().max(20).optional().or(z.literal("")),
      subject: z.string().trim().min(2, "Bir konu seç."),
      orderNo: z.string().trim().max(40).optional().or(z.literal("")),
      message: z.string().trim().min(10, "Mesajın en az 10 karakter olmalı.").max(3000),
      kvkk: z.literal("on", { message: "KVKK Aydınlatma Metni'ni onaylamalısın." }),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: "Lütfen formu kontrol et.", errors: fieldErrors(parsed.error) };
  const d = parsed.data;
  await db.insert(schema.contactMessages).values({
    siteId: site.id,
    name: d.name,
    email: d.email,
    phone: d.phone || null,
    subject: d.subject,
    orderNo: d.orderNo || null,
    message: d.message,
  });
  const { notify, panelUrl } = await import("@/lib/notify");
  const { contactMessageHtml } = await import("@/lib/mailer");
  void notify({
    merchantId: site.merchantId,
    siteId: site.id,
    type: "message",
    title: `Yeni mesaj: ${d.subject}`,
    body: `${d.name} · ${site.name}`,
    link: "/panel/mesajlar",
    email: { subject: `[${site.name}] Yeni iletişim mesajı: ${d.subject}`, html: contactMessageHtml(site.name, panelUrl("/panel/mesajlar"), { ...d, phone: d.phone || null, orderNo: d.orderNo || null }), template: "merchant_contact" },
  }).catch((e) => console.error("[notify]", e));
  return { ok: true, message: "Mesajın bize ulaştı. Müşteri hizmetlerimiz en geç 1 iş günü içinde dönüş yapacak." };
}

export async function createStockAlert(_: ActionState, form: FormData): Promise<ActionState> {
  const site = await currentSite();
  if (!site) return { ok: false, message: "Site bulunamadı." };
  const parsed = z
    .object({ email: emailSchema, productId: z.coerce.number().int().positive(), size: z.string().max(10).optional() })
    .safeParse({ email: form.get("email"), productId: form.get("productId"), size: form.get("size") || undefined });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  await db.insert(schema.stockAlerts).values({ siteId: site.id, productId: parsed.data.productId, size: parsed.data.size ?? null, email: parsed.data.email });
  return { ok: true, message: "Talebini aldık. Ürün stoğa girdiğinde e-posta ile haber vereceğiz." };
}

export type TrackResult =
  | { ok: false; message: string }
  | {
      ok: true;
      order: {
        orderNo: string;
        status: string;
        createdAt: string;
        total: number;
        shippingCompany: string | null;
        trackingNo: string | null;
        items: { title: string; size: string; quantity: number; image: string | null }[];
      };
    }
  | null;

export async function trackOrder(_: TrackResult, form: FormData): Promise<TrackResult> {
  const site = await currentSite();
  if (!site) return { ok: false, message: "Site bulunamadı." };
  const orderNo = String(form.get("orderNo") ?? "").trim().toUpperCase();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!orderNo || !email) return { ok: false, message: "Sipariş numarası ve e-posta adresini gir." };
  const order = await db.query.orders.findFirst({
    where: and(eq(schema.orders.siteId, site.id), eq(schema.orders.orderNo, orderNo), eq(schema.orders.email, email)),
  });
  if (!order) return { ok: false, message: "Bu bilgilerle eşleşen bir sipariş bulunamadı. Bilgileri kontrol edip tekrar dene." };
  const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, order.id));
  return {
    ok: true,
    order: {
      orderNo: order.orderNo,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      total: order.total,
      shippingCompany: order.shippingCompany,
      trackingNo: order.trackingNo,
      items: items.map((i) => ({ title: i.title, size: i.size, quantity: i.quantity, image: i.image })),
    },
  };
}
