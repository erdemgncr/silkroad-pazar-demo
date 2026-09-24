import { ProductEditView } from "@/components/panel/product-views";

export const metadata = { title: "Yeni Ürün" };

export default async function NewProductPage({ searchParams }: PageProps<"/panel/urunler/yeni">) {
  return <ProductEditView scope="merchant" id={null} searchParams={await searchParams} />;
}
