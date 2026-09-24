import { notFound } from "next/navigation";
import { ProductEditView } from "@/components/panel/product-views";

export const metadata = { title: "Havuz Ürünü" };

export default async function EditPoolProductPage({ params, searchParams }: PageProps<"/panel/havuz/[id]">) {
  const id = Number((await params).id);
  if (!id) notFound();
  return <ProductEditView scope="pool" id={id} searchParams={await searchParams} />;
}
