"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { resolveSite } from "@/lib/site";
import { createOrder, priceCart, type CartInput, type Pricing } from "@/lib/orders";
import { getCustomerSession } from "@/lib/auth";
import { TR_CITIES } from "@/lib/tr-cities";

async function currentSite() {
  const host = (await headers()).get("x-site-host");
  return host ? resolveSite(host) : null;
}

const cartSchema = z
  .array(z.object({ productId: z.number().int().positive(), size: z.string().min(1).max(12), quantity: z.number().int().min(1).max(10) }))
  .max(50);

export async function priceCartAction(cart: CartInput, couponCode?: string | null): Promise<Pricing | null> {
  const site = await currentSite();
  if (!site) return null;
  const parsed = cartSchema.safeParse(cart);
  if (!parsed.success) return null;
  return priceCart(site, parsed.data, couponCode);
}

const phoneRe = /^(\+?90|0)?\s?5\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/;

const addressSchema = z.object({
  fullName: z.string().trim().min(3, "Ad soyad gerekli"),
  phone: z.string().trim().regex(phoneRe, "Geçerli bir cep telefonu girin (05xx xxx xx xx)"),
  city: z.string().refine((v) => (TR_CITIES as readonly string[]).includes(v), "İl seçin"),
  district: z.string().trim().min(2, "İlçe gerekli"),
  line: z.string().trim().min(10, "Açık adresi mahalle, sokak ve numara ile yazın"),
  postcode: z.string().trim().max(10).optional().or(z.literal("")),
});

const checkoutSchema = z.object({
  cart: cartSchema.min(1, "Sepetin boş"),
  couponCode: z.string().trim().max(40).optional().nullable(),
  email: z.string().trim().toLowerCase().email("Geçerli bir e-posta girin"),
  shipping: addressSchema,
  sameBilling: z.boolean(),
  billing: addressSchema.optional(),
  invoiceType: z.enum(["bireysel", "kurumsal"]),
  nationalId: z.string().trim().regex(/^(\d{11})?$/, "T.C. kimlik no 11 haneli olmalı").optional().or(z.literal("")),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  taxOffice: z.string().trim().max(80).optional().or(z.literal("")),
  taxNumber: z.string().trim().regex(/^(\d{10,11})?$/, "Vergi no 10 haneli olmalı").optional().or(z.literal("")),
  note: z.string().trim().max(500).optional().or(z.literal("")),
  agreements: z.literal(true, { message: "Ön bilgilendirme formu ve mesafeli satış sözleşmesini onaylamalısın" }),
});

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutResult = { ok: true; redirect: string; orderNo: string } | { ok: false; message: string; errors?: Record<string, string>; pricing?: Pricing };

export async function placeOrderAction(input: CheckoutInput): Promise<CheckoutResult> {
  const site = await currentSite();
  if (!site) return { ok: false, message: "Site bulunamadı" };
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const k = i.path.join(".");
      if (!errors[k]) errors[k] = i.message;
    }
    return { ok: false, message: "Lütfen işaretli alanları kontrol et.", errors };
  }
  const d = parsed.data;
  if (d.invoiceType === "kurumsal" && (!d.company || !d.taxOffice || !d.taxNumber)) {
    return { ok: false, message: "Kurumsal fatura için firma, vergi dairesi ve vergi numarası gerekli.", errors: { company: d.company ? "" : "Firma ünvanı gerekli", taxOffice: d.taxOffice ? "" : "Vergi dairesi gerekli", taxNumber: d.taxNumber ? "" : "Vergi numarası gerekli" } };
  }
  const [firstName, ...rest] = d.shipping.fullName.split(" ");
  const billingAddr = d.sameBilling || !d.billing ? d.shipping : d.billing;
  const session = await getCustomerSession(site.id);
  const r = await createOrder(site, {
    cart: d.cart,
    couponCode: d.couponCode,
    email: d.email,
    phone: d.shipping.phone,
    firstName,
    lastName: rest.join(" ") || firstName,
    shipping: { ...d.shipping, postcode: d.shipping.postcode || undefined },
    billing: {
      ...billingAddr,
      postcode: billingAddr.postcode || undefined,
      ...(d.invoiceType === "kurumsal" ? { company: d.company, taxOffice: d.taxOffice, taxNumber: d.taxNumber } : { nationalId: d.nationalId || undefined }),
    },
    note: d.note || undefined,
    customerId: session?.cid ?? null,
  });
  if (!r.ok) return { ok: false, message: r.message, pricing: r.pricing };
  return { ok: true, orderNo: r.order.orderNo, redirect: `/odeme/${r.order.orderNo}/yonlendir` };
}
