import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireSite } from "@/lib/store-context";
import { currentCustomer } from "@/lib/customer";
import { AuthTabs } from "@/components/store/account/forms";
import { Breadcrumbs } from "@/components/store/breadcrumbs";
import { BellRing, Package, Tag, Truck } from "lucide-react";

export const metadata: Metadata = { title: "Giriş Yap / Üye Ol", robots: { index: false, follow: true } };

export default async function LoginPage({ params, searchParams }: PageProps<"/s/[site]/hesabim/giris">) {
  const site = await requireSite(params);
  const sp = await searchParams;
  const next = typeof sp.devam === "string" && sp.devam.startsWith("/") ? sp.devam : "/hesabim";
  if (await currentCustomer(site)) redirect(next);
  return (
    <div className="container-x py-8 md:py-12">
      <Breadcrumbs
        items={[
          { label: "Ana Sayfa", href: "/" },
          { label: "Giriş Yap", href: "/hesabim/giris" },
        ]}
      />
      <div className="mt-8 grid items-start gap-12 lg:grid-cols-2">
        <div className="order-2 hidden rounded-theme-lg bg-soft p-8 lg:order-1 lg:block">
          <p className="font-heading text-3xl font-bold">{site.name} üyelerine özel</p>
          <ul className="mt-6 space-y-4 text-sm">
            {[
              [Package, "Siparişlerini tek ekrandan takip et"],
              [Truck, "Kayıtlı adreslerinle hızlı ödeme"],
              [BellRing, "Tükenen bedenler gelince ilk sen haberdar ol"],
              [Tag, "Üyelere özel kampanya ve indirim kodları"],
            ].map(([Icon, t]) => {
              const I = Icon as typeof Package;
              return (
                <li key={t as string} className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-bg">
                    <I size={18} />
                  </span>
                  {t as string}
                </li>
              );
            })}
          </ul>
        </div>
        <div className="order-1 lg:order-2">
          <h1 className="mb-6 text-center font-heading text-3xl font-bold">Hesabım</h1>
          <AuthTabs next={next} />
        </div>
      </div>
    </div>
  );
}
