import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq, inArray } from "drizzle-orm";
import { clsx } from "clsx";
import { db, schema } from "@/db";
import { requireSite } from "@/lib/store-context";
import { requireCustomer } from "@/lib/customer";
import { AccountShell } from "@/components/store/account/account-shell";
import { formatDate, formatPrice } from "@/lib/format";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from "@/lib/order-status";

export const metadata: Metadata = { title: "Siparişlerim", robots: { index: false, follow: false } };

export default async function OrdersPage({ params }: PageProps<"/s/[site]/hesabim/siparisler">) {
  const site = await requireSite(params);
  const c = await requireCustomer(site, "/hesabim/siparisler");
  const orders = await db.select().from(schema.orders).where(eq(schema.orders.customerId, c.id)).orderBy(desc(schema.orders.createdAt));
  const items = orders.length ? await db.select().from(schema.orderItems).where(inArray(schema.orderItems.orderId, orders.map((o) => o.id))) : [];
  return (
    <AccountShell active="/hesabim/siparisler" title="Siparişlerim" name={`${c.firstName} ${c.lastName}`}>
      {orders.length === 0 ? (
        <div className="rounded-theme-lg bg-soft p-10 text-center text-sm text-muted">Henüz siparişin bulunmuyor.</div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => {
            const its = items.filter((i) => i.orderId === o.id);
            return (
              <Link key={o.id} href={`/hesabim/siparisler/${o.orderNo}`} className="block rounded-theme-lg border border-line p-4 transition-colors hover:border-fg md:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">Sipariş {o.orderNo}</p>
                    <p className="text-xs text-muted">
                      {formatDate(o.createdAt)} · {its.reduce((a, i) => a + i.quantity, 0)} ürün
                    </p>
                  </div>
                  <span className={clsx("rounded-full px-3 py-1 text-xs font-semibold", ORDER_STATUS_TONE[o.status])}>{ORDER_STATUS_LABEL[o.status]}</span>
                  <span className="font-bold">{formatPrice(o.total)}</span>
                </div>
                <div className="mt-4 flex gap-2 overflow-hidden">
                  {its.slice(0, 6).map((i) =>
                    i.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i.id} src={i.image} alt={i.title} className="h-16 w-16 rounded-theme object-cover" />
                    ) : null,
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </AccountShell>
  );
}
