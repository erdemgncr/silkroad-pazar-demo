import type { Metadata } from "next";
import { AuthShell } from "@/components/panel/auth-shell";
import { ForgotForm } from "@/components/panel/auth-forms";

export const metadata: Metadata = { title: "Şifremi Unuttum", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function ForgotPage() {
  return (
    <AuthShell title="Şifremi unuttum" subtitle="Panel e-posta adresini yaz; şifreni yenilemen için bir bağlantı gönderelim.">
      <ForgotForm />
    </AuthShell>
  );
}
