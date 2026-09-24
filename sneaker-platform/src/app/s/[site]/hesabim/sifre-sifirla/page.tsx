import type { Metadata } from "next";
import { ResetForm } from "@/components/store/account/forms";

export const metadata: Metadata = { title: "Yeni Şifre Belirle", robots: { index: false, follow: false } };

export default async function ResetPage({ searchParams }: PageProps<"/s/[site]/hesabim/sifre-sifirla">) {
  const sp = await searchParams;
  const token = typeof sp.t === "string" ? sp.t : "";
  return (
    <div className="container-x py-12 md:py-16">
      <h1 className="mb-8 text-center font-heading text-3xl font-bold">Yeni Şifre Belirle</h1>
      <ResetForm token={token} />
    </div>
  );
}
