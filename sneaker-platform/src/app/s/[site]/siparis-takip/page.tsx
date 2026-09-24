import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/store/breadcrumbs";
import { TrackForm } from "@/components/store/track-form";

export const metadata: Metadata = {
  title: "Sipariş Takibi",
  description: "Sipariş numaranız ve e-posta adresinizle siparişinizin durumunu ve kargo takip bilgisini sorgulayın.",
  alternates: { canonical: "/siparis-takip" },
};

export default function TrackPage() {
  return (
    <div className="container-x py-8 md:py-10">
      <Breadcrumbs
        items={[
          { label: "Ana Sayfa", href: "/" },
          { label: "Sipariş Takibi", href: "/siparis-takip" },
        ]}
      />
      <h1 className="h-display mt-4 text-center font-heading text-3xl font-bold md:text-4xl">Sipariş Takibi</h1>
      <p className="mx-auto mb-8 mt-2 max-w-lg text-center text-sm text-muted">Sipariş onay e-postandaki sipariş numarası ve siparişte kullandığın e-posta adresiyle siparişinin durumunu sorgulayabilirsin.</p>
      <TrackForm />
    </div>
  );
}
