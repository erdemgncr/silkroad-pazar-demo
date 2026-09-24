import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireSite } from "@/lib/store-context";
import { requireCustomer } from "@/lib/customer";
import { AccountShell } from "@/components/store/account/account-shell";
import { formatDate, formatPrice } from "@/lib/format";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";

export const metadata: Metadata = { title: "Hesabım", robots: { index: false, follow: false } };

export default async function AccountHome({ params }: PageProps<"/s/[site]/hesabim">) {
  const site = await requireSite(params);
  const c = await requireCustomer(site, "/hesabim");
  const orders = await db.select().from(schema.orders).where(eq(schema.orders.customerId, c.id)).orderBy(desc(schema.orders.createdAt)).limit(3);
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.addresses).where(eq(schema.addresses.customerId, c.id));
  return (
    <AccountShell active="/hesabim" title="Hesap Özeti" name={`${c.firstName} ${c.lastName}`}>
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/hesabim/siparisler" className="rounded-theme-lg border border-line p-5 hover:border-fg">
          <p className="text-sm text-muted">Siparişlerim</p>
          <p className="mt-1 text-2xl font-bold">{orders.length ? "Görüntüle" : "0"}</p>
        </Link>
        <Link href="/hesabim/adresler" className="rounded-theme-lg border border-line p-5 hover:border-fg">
          <p className="text-sm text-muted">Kayıtlı adres</p>
          <p className="mt-1 text-2xl font-bold">{n}</p>
        </Link>
        <Link href="/hesabim/bilgiler" className="rounded-theme-lg border border-line p-5 hover:border-fg">
          <p className="text-sm text-muted">Üyelik e-postası</p>
          <p className="mt-1 truncate font-semibold">{c.email}</p>
        </Link>
      </div>
      <h2 className="mb-3 mt-10 font-heading text-lg font-bold">Son Siparişler</h2>
      {orders.length === 0 ? (
        <div className="rounded-theme-lg bg-soft p-8 text-center text-sm text-muted">
          Henüz siparişin yok.{" "}
          <Link href="/yeni-gelenler" className="font-semibold text-fg underline">
            Yeni gelenlere göz at
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-line rounded-theme-lg border border-line">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/hesabim/siparisler/${o.orderNo}`} className="flex flex-wrap items-center justify-between gap-2 p-4 hover:bg-soft">
                <div>
                  <p className="font-semibold">{o.orderNo}</p>
                  <p className="text-xs text-muted">{formatDate(o.createdAt)}</p>
                </div>
                <span className="text-sm">{ORDER_STATUS_LABEL[o.status]}</span>
                <span className="font-semibold">{formatPrice(o.total)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AccountShell>
  );
}
