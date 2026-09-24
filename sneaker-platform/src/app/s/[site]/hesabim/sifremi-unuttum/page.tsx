import type { Metadata } from "next";
import { ForgotForm } from "@/components/store/account/forms";

export const metadata: Metadata = { title: "Şifremi Unuttum", robots: { index: false, follow: false } };

export default function ForgotPage() {
  return (
    <div className="container-x py-12 md:py-16">
      <h1 className="text-center font-heading text-3xl font-bold">Şifremi Unuttum</h1>
      <p className="mx-auto mb-8 mt-2 max-w-md text-center text-sm text-muted">Üyelik e-posta adresini yaz; şifreni sıfırlaman için bir bağlantı gönderelim.</p>
      <ForgotForm />
    </div>
  );
}
