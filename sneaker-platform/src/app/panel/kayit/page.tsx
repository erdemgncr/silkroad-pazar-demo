import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/panel/auth-shell";
import { SignupForm } from "@/components/panel/auth-forms";
import { getPlatformSetting } from "@/lib/platform-settings";
import { PLANS } from "@/lib/plans";

export const metadata: Metadata = { title: "Ücretsiz Dene", robots: { index: false, follow: true } };
export const dynamic = "force-dynamic";

export default async function SignupPage({ searchParams }: PageProps<"/panel/kayit">) {
  const general = await getPlatformSetting("general");
  const sp = await searchParams;
  const plan = typeof sp.paket === "string" && sp.paket in PLANS ? sp.paket : general.defaultPlan;
  if (!general.signupOpen) {
    return (
      <AuthShell title="Kayıtlar şu an kapalı" subtitle="Yeni satıcı hesapları şimdilik ekibimiz tarafından açılıyor.">
        <div className="mt-8 space-y-4 text-sm text-zinc-600">
          <p>Platformu kullanmak için bizimle iletişime geç; hesabını hemen oluşturalım.</p>
          {general.supportEmail && (
            <a href={`mailto:${general.supportEmail}?subject=${encodeURIComponent("Satıcı hesabı talebi")}`} className="flex h-11 items-center justify-center rounded-lg bg-zinc-900 font-semibold text-white">
              {general.supportEmail}
            </a>
          )}
          <Link href="/panel/giris" className="block text-center font-medium underline">
            Girişe dön
          </Link>
        </div>
      </AuthShell>
    );
  }
  return (
    <AuthShell title="Ücretsiz denemeyi başlat" subtitle={`${general.trialDays} gün boyunca tüm özellikleri ücretsiz kullan. Kart bilgisi gerekmez.`}>
      <SignupForm plans={Object.values(PLANS).map((p) => ({ key: p.key, name: p.name, price: p.priceMonthly }))} defaultPlan={plan} trialDays={general.trialDays} />
    </AuthShell>
  );
}
