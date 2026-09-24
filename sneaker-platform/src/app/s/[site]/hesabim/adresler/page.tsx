import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireSite } from "@/lib/store-context";
import { requireCustomer } from "@/lib/customer";
import { AccountShell } from "@/components/store/account/account-shell";
import { AddressBook } from "@/components/store/account/forms";

export const metadata: Metadata = { title: "Adreslerim", robots: { index: false, follow: false } };

export default async function AddressesPage({ params }: PageProps<"/s/[site]/hesabim/adresler">) {
  const site = await requireSite(params);
  const c = await requireCustomer(site, "/hesabim/adresler");
  const rows = await db.select().from(schema.addresses).where(eq(schema.addresses.customerId, c.id)).orderBy(desc(schema.addresses.createdAt));
  return (
    <AccountShell active="/hesabim/adresler" title="Adreslerim" name={`${c.firstName} ${c.lastName}`}>
      <AddressBook items={rows.map((a) => ({ id: a.id, title: a.title, fullName: a.fullName, phone: a.phone, city: a.city, district: a.district, line: a.line, postcode: a.postcode }))} />
    </AccountShell>
  );
}
