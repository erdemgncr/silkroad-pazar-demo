import "server-only";
import nodemailer from "nodemailer";
import { formatPrice } from "@/lib/format";

/**
 * E-posta gönderimi. SMTP_HOST tanımlı değilse e-postalar sunucu günlüğüne yazılır (geliştirme).
 * Ortam değişkenleri: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 */
let transport: ReturnType<typeof nodemailer.createTransport> | null = null;
function getTransport() {
  if (!process.env.SMTP_HOST) return null;
  transport ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  return transport;
}

export async function sendMail(opts: { to: string; subject: string; html: string; fromName: string; replyTo?: string }) {
  const t = getTransport();
  const from = `"${opts.fromName}" <${process.env.SMTP_FROM ?? "no-reply@localhost"}>`;
  if (!t) {
    console.info(`[mail] ${opts.to} | ${opts.subject}`);
    return;
  }
  try {
    await t.sendMail({ from, to: opts.to, subject: opts.subject, html: opts.html, replyTo: opts.replyTo });
  } catch (e) {
    console.error("[mail] gönderilemedi", e);
  }
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function layout(siteName: string, color: string, title: string, body: string) {
  return `<!doctype html><html lang="tr"><body style="margin:0;background:#f4f4f4;font-family:Arial,sans-serif;color:#111">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden">
<tr><td style="background:${color};color:#fff;padding:20px 28px;font-size:22px;font-weight:bold">${esc(siteName)}</td></tr>
<tr><td style="padding:28px"><h1 style="font-size:20px;margin:0 0 16px">${esc(title)}</h1>${body}</td></tr>
<tr><td style="padding:16px 28px;background:#fafafa;color:#777;font-size:12px">Bu e-posta ${esc(siteName)} tarafından gönderilmiştir.</td></tr>
</table></td></tr></table></body></html>`;
}

export type MailOrder = {
  orderNo: string;
  firstName: string;
  total: number;
  subtotal: number;
  discount: number;
  shippingFee: number;
  items: { title: string; size: string; quantity: number; unitPrice: number }[];
  address: string;
};

export function orderItemsTable(o: MailOrder) {
  const rows = o.items
    .map((i) => `<tr><td style="padding:8px 0;border-bottom:1px solid #eee">${esc(i.title)} <span style="color:#777">(Beden ${esc(i.size)} × ${i.quantity})</span></td><td align="right" style="padding:8px 0;border-bottom:1px solid #eee">${formatPrice(i.unitPrice * i.quantity)}</td></tr>`)
    .join("");
  return `<table width="100%" style="font-size:14px">${rows}
<tr><td style="padding-top:12px;color:#777">Ara toplam</td><td align="right" style="padding-top:12px">${formatPrice(o.subtotal)}</td></tr>
${o.discount ? `<tr><td style="color:#777">İndirim</td><td align="right">-${formatPrice(o.discount)}</td></tr>` : ""}
<tr><td style="color:#777">Kargo</td><td align="right">${o.shippingFee ? formatPrice(o.shippingFee) : "Ücretsiz"}</td></tr>
<tr><td style="padding-top:8px;font-weight:bold">Toplam</td><td align="right" style="padding-top:8px;font-weight:bold">${formatPrice(o.total)}</td></tr></table>`;
}

export function orderConfirmationHtml(siteName: string, color: string, siteUrl: string, o: MailOrder) {
  return layout(
    siteName,
    color,
    `Siparişin alındı, teşekkürler ${o.firstName}!`,
    `<p style="font-size:14px;line-height:1.6">Sipariş numaran: <b>${esc(o.orderNo)}</b>. Siparişin hazırlanıp kargoya verildiğinde takip numarasını e-posta ile ileteceğiz.</p>
${orderItemsTable(o)}
<p style="font-size:13px;color:#555;margin-top:20px">Teslimat adresi: ${esc(o.address)}</p>
<p style="margin-top:24px"><a href="${esc(siteUrl)}/siparis-takip" style="background:${color};color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold">Siparişimi Takip Et</a></p>`,
  );
}

export function orderShippedHtml(siteName: string, color: string, siteUrl: string, o: { orderNo: string; firstName: string; company: string; trackingNo: string }) {
  return layout(
    siteName,
    color,
    "Siparişin kargoya verildi",
    `<p style="font-size:14px;line-height:1.6">Merhaba ${esc(o.firstName)}, <b>${esc(o.orderNo)}</b> numaralı siparişin ${esc(o.company)} ile yola çıktı.</p>
<p style="font-size:14px">Kargo takip numarası: <b>${esc(o.trackingNo)}</b></p>
<p style="margin-top:24px"><a href="${esc(siteUrl)}/siparis-takip" style="background:${color};color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold">Siparişi Görüntüle</a></p>`,
  );
}

export function passwordResetHtml(siteName: string, color: string, link: string) {
  return layout(
    siteName,
    color,
    "Şifre sıfırlama",
    `<p style="font-size:14px;line-height:1.6">Şifreni sıfırlamak için aşağıdaki bağlantıyı kullan. Bağlantı 1 saat geçerlidir. Bu talebi sen yapmadıysan e-postayı yok sayabilirsin.</p>
<p style="margin-top:24px"><a href="${esc(link)}" style="background:${color};color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold">Şifremi Sıfırla</a></p>`,
  );
}
