import type { Metadata } from "next";
import { requireSiteWithCatalog } from "@/lib/store-context";
import { CartPage } from "@/components/store/checkout/cart-page";
import { ProductRail } from "@/components/store/sections";
import { pickHome } from "@/lib/catalog";
import { toCards } from "@/lib/store-data";

export const metadata: Metadata = { title: "Sepetim", robots: { index: false, follow: true } };

export default async function CartRoute({ params }: PageProps<"/s/[site]/sepet">) {
  const { site, all } = await requireSiteWithCatalog(params);
  const h = pickHome(all);
  return (
    <>
      <div className="container-x">
        <CartPage variant={site.theme} />
      </div>
      <ProductRail title="Bunları da Beğenebilirsin" items={toCards(h.bestSellers, all)} variant={site.theme} href="/cok-satanlar" />
    </>
  );
}
