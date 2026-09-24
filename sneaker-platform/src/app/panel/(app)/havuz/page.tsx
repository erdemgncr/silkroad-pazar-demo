import { ProductListView } from "@/components/panel/product-views";

export const metadata = { title: "Katalog Havuzu" };

export default async function PoolPage({ searchParams }: PageProps<"/panel/havuz">) {
  return <ProductListView scope="pool" searchParams={await searchParams} />;
}
