import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/panel/auth-shell";
import { ResetForm } from "@/components/panel/auth-forms";

export const metadata: Metadata = { title: "Yeni Şifre", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ResetPage({ searchParams }: PageProps<"/panel/sifre-sifirla">) {
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";
  return (
    <AuthShell title="Yeni şifre belirle">
      {token ? (
        <ResetForm token={token} />
      ) : (
        <p className="mt-6 text-sm text-zinc-600">
          Bağlantı eksik.{" "}
          <Link href="/panel/sifremi-unuttum" className="font-semibold underline">
            Yeniden iste
          </Link>
        </p>
      )}
    </AuthShell>
  );
}
