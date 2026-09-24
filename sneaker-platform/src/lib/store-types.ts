/** İstemci bileşenlerine aktarılan sade veri tipleri. */

export type CardProduct = {
  id: number;
  slug: string;
  title: string;
  brand: string;
  model: string;
  colorName: string;
  colorHex: string;
  gender: "erkek" | "kadin" | "cocuk" | "unisex";
  categoryLabel: string;
  price: number;
  compareAtPrice: number | null;
  image: string;
  image2: string;
  imageAlt: string;
  isNew: boolean;
  isBestSeller: boolean;
  inStock: boolean;
  lowStock: boolean;
  sizes: { size: string; stock: number }[];
  colorCount: number;
  releaseDate: string | null;
};

export type MenuLink = { label: string; href: string };
export type MenuColumn = { title: string; href?: string; links: MenuLink[] };
export type MenuItem = {
  label: string;
  href: string;
  tone?: "sale" | "new" | "default";
  columns?: MenuColumn[];
  brands?: { name: string; slug: string }[];
  promo?: { title: string; subtitle: string; href: string; image: string };
};

export type StoreClientConfig = {
  siteId: number;
  siteName: string;
  theme: string;
  freeShippingThreshold: number; // kuruş
  shippingFee: number; // kuruş
  installmentText: string;
  whatsapp: string;
};

export type CartLine = {
  key: string;
  productId: number;
  slug: string;
  title: string;
  brand: string;
  colorName: string;
  image: string;
  size: string;
  price: number;
  compareAtPrice: number | null;
  quantity: number;
  maxStock: number;
};
