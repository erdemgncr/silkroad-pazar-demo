import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireMerchant } from "@/lib/panel";
import { PageHeader } from "@/components/panel/ui";
import { NewSiteForm } from "./new-site-form";
import { THEMES } from "@/themes/registry";

export const metadata = { title: "Yeni Site" };

export default async function NewSitePage() {
  const ctx = await requireMerchant();
  const merchants = ctx.isPlatform ? await db.select({ id: schema.merchants.id, name: schema.merchants.name }).from(schema.merchants).orderBy(asc(schema.merchants.name)) : undefined;
  return (
    <>
      <PageHeader
        title="Yeni Site Oluştur"
        description={`${Object.keys(THEMES).length} hazır temadan birini seç; site varsayılan içeriklerle (slider, kampanyalar, yasal sayfalar, blog yazıları) hazır gelir. Sonra dilediğin her şeyi düzenleyebilirsin.`}
      />
      <NewSiteForm themes={Object.values(THEMES)} merchants={merchants} currentMerchantId={ctx.merchant.id} rootDomain={process.env.ROOT_DOMAIN ?? "localhost:3000"} />
    </>
  );
}
