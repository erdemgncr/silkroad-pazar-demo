import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";
import { AuthShell } from "@/components/panel/auth-shell";
import { getPlatformSetting } from "@/lib/platform-settings";

export const metadata: Metadata = { title: "Panel Girişi", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PanelLoginPage({ searchParams }: PageProps<"/panel/giris">) {
  const sp = await searchParams;
  const general = await getPlatformSetting("general");
  return (
    <AuthShell title="Panele giriş yap" subtitle="Satıcı ya da platform hesabınla giriş yapabilirsin.">
      {sp.askida === "1" && <p className="mt-4 rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">Hesabınız askıya alınmış. Lütfen destek ekibiyle iletişime geçin.</p>}
      {sp.sifirlandi === "1" && <p className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-800">Şifren değiştirildi. Yeni şifrenle giriş yapabilirsin.</p>}
      <LoginForm />
      <div className="mt-4 flex items-center justify-between text-sm">
        <Link href="/panel/sifremi-unuttum" className="text-zinc-600 underline">
          Şifremi unuttum
        </Link>
        {general.signupOpen && (
          <Link href="/panel/kayit" className="font-semibold underline">
            Ücretsiz üye ol
          </Link>
        )}
      </div>
    </AuthShell>
  );
}
