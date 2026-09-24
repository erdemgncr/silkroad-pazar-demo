import { ProductEditView } from "@/components/panel/product-views";

export const metadata = { title: "Havuza Ürün Ekle" };

export default async function NewPoolProductPage({ searchParams }: PageProps<"/panel/havuz/yeni">) {
  return <ProductEditView scope="pool" id={null} searchParams={await searchParams} />;
}
