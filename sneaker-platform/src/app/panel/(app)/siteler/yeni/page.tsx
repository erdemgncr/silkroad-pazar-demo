import { requireMerchant } from "@/lib/panel";
import { PageHeader } from "@/components/panel/ui";
import { NewSiteForm } from "./new-site-form";
import { THEMES } from "@/themes/registry";

export const metadata = { title: "Yeni Site" };

export default async function NewSitePage() {
  await requireMerchant();
  return (
    <>
      <PageHeader title="Yeni Site Oluştur" description="Tema ve adres seç; site varsayılan içeriklerle (slider, kampanyalar, yasal sayfalar, blog yazıları) hazır gelir. Sonra dilediğin her şeyi düzenleyebilirsin." />
      <NewSiteForm themes={Object.values(THEMES)} />
    </>
  );
}
