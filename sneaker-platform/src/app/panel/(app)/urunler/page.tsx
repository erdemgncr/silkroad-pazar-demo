import { ProductListView } from "@/components/panel/product-views";

export const metadata = { title: "Ürünler" };

export default async function ProductsPage({ searchParams }: PageProps<"/panel/urunler">) {
  return <ProductListView scope="merchant" searchParams={await searchParams} />;
}
