import type { Metadata } from "next";
import { requireSite } from "@/lib/store-context";
import { requireCustomer } from "@/lib/customer";
import { AccountShell } from "@/components/store/account/account-shell";
import { ProfileForm } from "@/components/store/account/forms";

export const metadata: Metadata = { title: "Üyelik Bilgilerim", robots: { index: false, follow: false } };

export default async function ProfilePage({ params }: PageProps<"/s/[site]/hesabim/bilgiler">) {
  const site = await requireSite(params);
  const c = await requireCustomer(site, "/hesabim/bilgiler");
  return (
    <AccountShell active="/hesabim/bilgiler" title="Üyelik Bilgilerim" name={`${c.firstName} ${c.lastName}`}>
      <ProfileForm c={{ firstName: c.firstName, lastName: c.lastName, email: c.email, phone: c.phone ?? "", marketing: c.marketingConsent }} />
    </AccountShell>
  );
}
