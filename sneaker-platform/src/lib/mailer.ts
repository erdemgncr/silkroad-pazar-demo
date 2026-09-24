import "server-only";
import nodemailer from "nodemailer";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { formatPrice } from "@/lib/format";
import { getPlatformSetting } from "@/lib/platform-settings";

/**
 * E-posta gönderimi. Taşıyıcı seçimi sırası:
 *   1) Sitenin kendi SMTP ayarı (panel > site > E-posta)
 *   2) Platform SMTP ayarı (süper admin > Platform Ayarları)
 *   3) Ortam değişkenleri (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM)
 *   4) Hiçbiri yoksa e-posta sunucu günlüğüne yazılır.
 * Her gönderim email_logs tablosuna kaydedilir.
 */

type Transport = { kind: string; from: string; replyTo?: string; send: (m: { to: string; subject: string; html: string; replyTo?: string; from: string }) => Promise<void> };

function smtpTransport(kind: string, cfg: { host: string; port: number; secure: boolean; user?: string | null; pass?: string | null }, from: string, replyTo?: string): Transport {
  const t = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure || cfg.port === 465,
    auth: cfg.user ? { user: cfg.user, pass: cfg.pass ?? "" } : undefined,
    connectionTimeout: 15_000,
  });
  return {
    kind,
    from,
    replyTo,
    send: async (m) => {
      await t.sendMail({ from: m.from, to: m.to, subject: m.subject, html: m.html, replyTo: m.replyTo });
    },
  };
}

export async function resolveTransport(siteId?: number | null, fromNameFallback = "Mağaza"): Promise<Transport | null> {
  if (siteId) {
    const s = await db.query.siteMailSettings.findFirst({ where: eq(schema.siteMailSettings.siteId, siteId) });
    if (s?.enabled && s.host && s.fromEmail) {
      return smtpTransport("site", { host: s.host, port: s.port, secure: s.secure, user: s.username, pass: s.password }, `"${s.fromName || fromNameFallback}" <${s.fromEmail}>`, s.replyTo || undefined);
    }
  }
  const p = await getPlatformSetting("smtp");
  if (p.host && p.fromEmail) return smtpTransport("platform", { host: p.host, port: p.port, secure: p.secure, user: p.username, pass: p.password }, `"${fromNameFallback || p.fromName}" <${p.fromEmail}>`);
  if (process.env.SMTP_HOST) {
    return smtpTransport(
      "env",
      { host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT ?? 587), secure: Number(process.env.SMTP_PORT ?? 587) === 465, user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      `"${fromNameFallback}" <${process.env.SMTP_FROM ?? "no-reply@localhost"}>`,
    );
  }
  return null;
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  template: string;
  siteId?: number | null;
  merchantId?: number | null;
  fromName?: string;
  replyTo?: string;
}): Promise<{ status: "sent" | "failed" | "logged"; error?: string }> {
  let status: "sent" | "failed" | "logged" = "logged";
  let error: string | undefined;
  let kind = "console";
  try {
    const t = await resolveTransport(opts.siteId, opts.fromName);
    if (t) {
      kind = t.kind;
      await t.send({ to: opts.to, subject: opts.subject, html: opts.html, from: t.from, replyTo: opts.replyTo ?? t.replyTo });
      status = "sent";
    } else {
      console.info(`[mail:${opts.template}] ${opts.to} | ${opts.subject}`);
    }
  } catch (e) {
    status = "failed";
    error = e instanceof Error ? e.message : String(e);
    console.error("[mail] gönderilemedi", error);
  }
  try {
    await db.insert(schema.emailLogs).values({
      merchantId: opts.merchantId ?? null,
      siteId: opts.siteId ?? null,
      to: opts.to,
      subject: opts.subject.slice(0, 250),
      template: opts.template,
      status,
      transport: kind,
      error: error?.slice(0, 500) ?? null,
    });
  } catch {
    /* kayıt hatası gönderimi etkilemesin */
  }
  return { status, error };
}

/* ------------------------------------------------------------------ */
/* Şablonlar                                                          */
/* ------------------------------------------------------------------ */

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function button(href: string, label: string, color: string) {
  return `<p style="margin:28px 0 8px"><a href="${esc(href)}" style="background:${color};color:#fff;padding:13px 22px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block">${esc(label)}</a></p>`;
}

export function layout(siteName: string, color: string, title: string, body: string, footer?: string) {
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#111">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td align="center" style="padding:24px 12px">
<table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background:#fff;border-radius:10px;overflow:hidden">
<tr><td style="background:${color};color:#fff;padding:20px 28px;font-size:22px;font-weight:bold;letter-spacing:-0.5px">${esc(siteName)}</td></tr>
<tr><td style="padding:28px"><h1 style="font-size:20px;margin:0 0 16px;line-height:1.3">${esc(title)}</h1>${body}</td></tr>
<tr><td style="padding:16px 28px;background:#fafafa;color:#777;font-size:12px;line-height:1.5">${footer ?? `Bu e-posta ${esc(siteName)} tarafından gönderilmiştir.`}</td></tr>
</table></td></tr></table></body></html>`;
}

export type MailOrder = {
  orderNo: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  total: number;
  subtotal: number;
  discount: number;
  shippingFee: number;
  items: { title: string; size: string; quantity: number; unitPrice: number }[];
  address: string;
};

export function orderItemsTable(o: MailOrder) {
  const rows = o.items
    .map(
      (i) =>
        `<tr><td style="padding:10px 0;border-bottom:1px solid #eee;font-size:14px">${esc(i.title)}<br><span style="color:#777;font-size:12px">Beden ${esc(i.size)} × ${i.quantity}</span></td><td align="right" style="padding:10px 0;border-bottom:1px solid #eee;font-size:14px;white-space:nowrap">${formatPrice(i.unitPrice * i.quantity)}</td></tr>`,
    )
    .join("");
  return `<table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">${rows}
<tr><td style="padding-top:12px;color:#777">Ara toplam</td><td align="right" style="padding-top:12px">${formatPrice(o.subtotal)}</td></tr>
${o.discount ? `<tr><td style="color:#777">İndirim</td><td align="right">-${formatPrice(o.discount)}</td></tr>` : ""}
<tr><td style="color:#777">Kargo</td><td align="right">${o.shippingFee ? formatPrice(o.shippingFee) : "Ücretsiz"}</td></tr>
<tr><td style="padding-top:8px;font-weight:bold;font-size:16px">Toplam</td><td align="right" style="padding-top:8px;font-weight:bold;font-size:16px">${formatPrice(o.total)}</td></tr></table>`;
}

export function orderConfirmationHtml(siteName: string, color: string, siteUrl: string, o: MailOrder) {
  return layout(
    siteName,
    color,
    `Siparişin alındı, teşekkürler ${o.firstName}!`,
    `<p style="font-size:14px;line-height:1.6">Sipariş numaran: <b>${esc(o.orderNo)}</b>. Siparişin hazırlanıp kargoya verildiğinde takip numarasını e-posta ile ileteceğiz.</p>
${orderItemsTable(o)}
<p style="font-size:13px;color:#555;margin-top:20px">Teslimat adresi: ${esc(o.address)}</p>
${button(`${siteUrl}/siparis-takip`, "Siparişimi Takip Et", color)}`,
  );
}

export function newOrderMerchantHtml(siteName: string, panelUrl: string, o: MailOrder) {
  return layout(
    siteName,
    "#111111",
    `Yeni sipariş: ${o.orderNo}`,
    `<p style="font-size:14px;line-height:1.6"><b>${esc(o.firstName)} ${esc(o.lastName ?? "")}</b> (${esc(o.email ?? "")}, ${esc(o.phone ?? "")}) ${esc(siteName)} üzerinden sipariş verdi ve ödemesi alındı.</p>
${orderItemsTable(o)}
<p style="font-size:13px;color:#555;margin-top:20px">Teslimat adresi: ${esc(o.address)}</p>
${button(panelUrl, "Siparişi Panelde Aç", "#111111")}`,
    "Bu bildirim satıcı paneli bildirim ayarlarınıza göre gönderilmiştir.",
  );
}

export function orderShippedHtml(siteName: string, color: string, siteUrl: string, o: { orderNo: string; firstName: string; company: string; trackingNo: string }) {
  return layout(
    siteName,
    color,
    "Siparişin kargoya verildi",
    `<p style="font-size:14px;line-height:1.6">Merhaba ${esc(o.firstName)}, <b>${esc(o.orderNo)}</b> numaralı siparişin ${esc(o.company)} ile yola çıktı.</p>
<p style="font-size:14px">Kargo takip numarası: <b>${esc(o.trackingNo)}</b></p>
${button(`${siteUrl}/siparis-takip`, "Siparişi Görüntüle", color)}`,
  );
}

export function orderStatusHtml(siteName: string, color: string, siteUrl: string, o: { orderNo: string; firstName: string; statusLabel: string; note?: string }) {
  return layout(
    siteName,
    color,
    `Sipariş durumun güncellendi: ${o.statusLabel}`,
    `<p style="font-size:14px;line-height:1.6">Merhaba ${esc(o.firstName)}, <b>${esc(o.orderNo)}</b> numaralı siparişinin durumu <b>${esc(o.statusLabel)}</b> olarak güncellendi.</p>
${o.note ? `<p style="font-size:14px;line-height:1.6;background:#f6f6f6;padding:12px;border-radius:6px">${esc(o.note)}</p>` : ""}
${button(`${siteUrl}/siparis-takip`, "Siparişi Görüntüle", color)}`,
  );
}

export function contactMessageHtml(siteName: string, panelUrl: string, m: { name: string; email: string; phone?: string | null; subject: string; orderNo?: string | null; message: string }) {
  return layout(
    siteName,
    "#111111",
    `Yeni iletişim mesajı: ${m.subject}`,
    `<p style="font-size:14px;line-height:1.6"><b>${esc(m.name)}</b> (${esc(m.email)}${m.phone ? `, ${esc(m.phone)}` : ""})${m.orderNo ? ` · Sipariş ${esc(m.orderNo)}` : ""}</p>
<p style="font-size:14px;line-height:1.7;background:#f6f6f6;padding:14px;border-radius:6px;white-space:pre-wrap">${esc(m.message)}</p>
${button(panelUrl, "Mesajlara Git", "#111111")}`,
  );
}

export function stockBackHtml(siteName: string, color: string, url: string, p: { title: string; size?: string | null; image?: string }) {
  return layout(
    siteName,
    color,
    "Beklediğin ürün stokta!",
    `${p.image ? `<img src="${esc(p.image)}" alt="" width="200" style="border-radius:8px;display:block;margin-bottom:16px">` : ""}
<p style="font-size:14px;line-height:1.6"><b>${esc(p.title)}</b>${p.size ? ` (${esc(p.size)} numara)` : ""} yeniden satışta. Stoklar sınırlı, kaçırma!</p>
${button(url, "Ürünü İncele", color)}`,
  );
}

export function passwordResetHtml(siteName: string, color: string, link: string) {
  return layout(
    siteName,
    color,
    "Şifre sıfırlama",
    `<p style="font-size:14px;line-height:1.6">Şifreni sıfırlamak için aşağıdaki bağlantıyı kullan. Bağlantı 1 saat geçerlidir. Bu talebi sen yapmadıysan e-postayı yok sayabilirsin.</p>
${button(link, "Şifremi Sıfırla", color)}`,
  );
}

export function welcomeCustomerHtml(siteName: string, color: string, siteUrl: string, firstName: string) {
  return layout(
    siteName,
    color,
    `Aramıza hoş geldin ${firstName}!`,
    `<p style="font-size:14px;line-height:1.6">${esc(siteName)} üyeliğin oluşturuldu. Siparişlerini takip edebilir, adreslerini kaydedebilir ve üyelere özel kampanyalardan yararlanabilirsin.</p>
${button(siteUrl, "Alışverişe Başla", color)}`,
  );
}

export function welcomeMerchantHtml(platformName: string, panelUrl: string, m: { name: string; email: string; password?: string }) {
  return layout(
    platformName,
    "#111111",
    `${platformName}'a hoş geldin!`,
    `<p style="font-size:14px;line-height:1.6">Merhaba ${esc(m.name)}, satıcı hesabın oluşturuldu. Panelden sitelerini yönetebilir, katalog havuzundan ürün ekleyebilir ve Shopier hesabını bağlayabilirsin.</p>
<p style="font-size:14px;line-height:1.6">Giriş e-postası: <b>${esc(m.email)}</b>${m.password ? `<br>Geçici şifre: <b>${esc(m.password)}</b> (ilk girişte değiştirmeni öneririz)` : ""}</p>
${button(panelUrl, "Panele Giriş Yap", "#111111")}`,
  );
}

export function testMailHtml(name: string, kind: string) {
  return layout(name, "#111111", "Test e-postası", `<p style="font-size:14px;line-height:1.6">Bu bir test e-postasıdır. E-posta ayarlarınız (${esc(kind)}) doğru çalışıyor.</p>`);
}

export function dailySummaryHtml(platformName: string, panelUrl: string, d: { merchant: string; date: string; orders: number; revenue: number; pending: number; messages: number; lowStock: string[]; perSite: { name: string; orders: number; revenue: number }[] }) {
  const rows = d.perSite
    .map((s) => `<tr><td style="padding:6px 0;font-size:14px">${esc(s.name)}</td><td style="padding:6px 0;font-size:14px;text-align:center">${s.orders}</td><td style="padding:6px 0;font-size:14px;text-align:right">${formatPrice(s.revenue)}</td></tr>`)
    .join("");
  return layout(
    platformName,
    "#111111",
    `${d.date} günlük özet`,
    `<p style="font-size:14px;line-height:1.6">Merhaba ${esc(d.merchant)}, dünün satış özeti:</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0"><tr>
<td style="background:#f4f4f5;border-radius:8px;padding:14px;text-align:center"><div style="font-size:22px;font-weight:bold">${d.orders}</div><div style="font-size:12px;color:#666">sipariş</div></td><td width="10"></td>
<td style="background:#f4f4f5;border-radius:8px;padding:14px;text-align:center"><div style="font-size:22px;font-weight:bold">${formatPrice(d.revenue)}</div><div style="font-size:12px;color:#666">ciro</div></td><td width="10"></td>
<td style="background:#f4f4f5;border-radius:8px;padding:14px;text-align:center"><div style="font-size:22px;font-weight:bold">${d.pending}</div><div style="font-size:12px;color:#666">hazırlanacak</div></td>
</tr></table>
${rows ? `<table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eee;margin-top:8px"><tr><th align="left" style="font-size:12px;color:#888;padding:8px 0">Site</th><th style="font-size:12px;color:#888">Sipariş</th><th align="right" style="font-size:12px;color:#888">Ciro</th></tr>${rows}</table>` : ""}
${d.messages ? `<p style="font-size:14px">Okunmamış mesaj: <b>${d.messages}</b></p>` : ""}
${d.lowStock.length ? `<p style="font-size:14px;margin-top:16px"><b>Stoğu azalan ürünler:</b><br>${d.lowStock.map(esc).join("<br>")}</p>` : ""}
${button(panelUrl, "Panele git", "#111111")}`,
  );
}
