import { NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { getAdminSession } from "@/lib/auth";
import { listOrders, parseOrderQuery } from "@/lib/panel-orders";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";
import { itemName } from "@/lib/format";

const cell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Siparişleri Excel uyumlu CSV (noktalı virgül, UTF-8 BOM) olarak dışa aktarır. */
export async function GET(req: Request) {
  const s = await getAdminSession();
  if (!s) return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  const sites = s.mid ? await db.select().from(schema.sites).where(eq(schema.sites.merchantId, s.mid)) : await db.select().from(schema.sites);
  const url = new URL(req.url);
  const q = parseOrderQuery(Object.fromEntries(url.searchParams));
  const { rows } = await listOrders(sites.map((x) => x.id), { ...q, page: 1 }, 5000);
  const items = rows.length ? await db.select().from(schema.orderItems).where(inArray(schema.orderItems.orderId, rows.map((r) => r.id))) : [];
  const head = ["Sipariş No", "Tarih", "Site", "Kaynak", "Durum", "Ad Soyad", "E-posta", "Telefon", "İl", "İlçe", "Adres", "Ürünler", "Ara Toplam", "İndirim", "Kargo", "Toplam", "Kupon", "Kargo Firması", "Takip No", "Not"];
  const lines = rows.map((o) =>
    [
      o.orderNo,
      o.createdAt.toISOString().replace("T", " ").slice(0, 16),
      sites.find((x) => x.id === o.siteId)?.name,
      o.source,
      ORDER_STATUS_LABEL[o.status],
      `${o.firstName} ${o.lastName}`,
      o.email,
      o.phone,
      o.shippingAddress.city,
      o.shippingAddress.district,
      o.shippingAddress.line,
      items
        .filter((i) => i.orderId === o.id)
        .map((i) => `${i.quantity}x ${itemName(i.brand, i.title)} (${i.size})`)
        .join(" | "),
      (o.subtotal / 100).toFixed(2).replace(".", ","),
      (o.discount / 100).toFixed(2).replace(".", ","),
      (o.shippingFee / 100).toFixed(2).replace(".", ","),
      (o.total / 100).toFixed(2).replace(".", ","),
      o.couponCode,
      o.shippingCompany,
      o.trackingNo,
      o.note,
    ]
      .map(cell)
      .join(";"),
  );
  const csv = "﻿" + [head.join(";"), ...lines].join("\r\n");
  return new Response(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="siparisler-${new Date().toISOString().slice(0, 10)}.csv"` },
  });
}
