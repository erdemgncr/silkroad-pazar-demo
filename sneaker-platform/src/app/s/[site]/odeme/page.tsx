import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireSite } from "@/lib/store-context";
import { getCustomerSession } from "@/lib/auth";
import { CheckoutForm, type SavedAddress } from "@/components/store/checkout/checkout-form";

export const metadata: Metadata = { title: "Ödeme", robots: { index: false, follow: false } };

export default async function CheckoutRoute({ params }: PageProps<"/s/[site]/odeme">) {
  const site = await requireSite(params);
  const session = await getCustomerSession(site.id);
  let customer: { email: string; name: string; phone: string } | null = null;
  let addresses: SavedAddress[] = [];
  if (session) {
    const c = await db.query.customers.findFirst({ where: eq(schema.customers.id, session.cid) });
    if (c) {
      customer = { email: c.email, name: `${c.firstName} ${c.lastName}`, phone: c.phone ?? "" };
      const rows = await db.select().from(schema.addresses).where(eq(schema.addresses.customerId, c.id)).orderBy(desc(schema.addresses.createdAt));
      addresses = rows.map((a) => ({ id: a.id, title: a.title, fullName: a.fullName, phone: a.phone, city: a.city, district: a.district, line: a.line, postcode: a.postcode ?? "" }));
    }
  }
  return (
    <div className="container-x">
      <CheckoutForm variant={site.theme} customer={customer} addresses={addresses} />
    </div>
  );
}
