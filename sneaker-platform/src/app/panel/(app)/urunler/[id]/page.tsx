import { notFound } from "next/navigation";
import { ProductEditView } from "@/components/panel/product-views";

export const metadata = { title: "Ürün Düzenle" };

export default async function EditProductPage({ params, searchParams }: PageProps<"/panel/urunler/[id]">) {
  const id = Number((await params).id);
  if (!id) notFound();
  return <ProductEditView scope="merchant" id={id} searchParams={await searchParams} />;
}
