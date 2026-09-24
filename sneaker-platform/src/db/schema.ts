import {
  pgTable,
  serial,
  integer,
  text,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";
import type { SiteSettings } from "@/lib/site-settings";
import type { ThemeKey } from "@/themes/registry";

export type ProductImage = { url: string; alt?: string };
export type ProductVariant = { size: string; stock: number; sku?: string };
export type OrderAddress = {
  fullName: string;
  phone: string;
  city: string;
  district: string;
  line: string;
  postcode?: string;
};

export type PlanKey = "baslangic" | "pro" | "kurumsal";

/** SaaS müşterisi: platformu kullanan Shopier satıcısı. */
export const merchants = pgTable("merchants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  status: text("status").$type<"trial" | "active" | "suspended">().notNull().default("trial"),
  plan: text("plan").$type<PlanKey>().notNull().default("baslangic"),
  siteLimit: integer("site_limit").notNull().default(1),
  productLimit: integer("product_limit").notNull().default(200),
  aiMonthlyLimit: integer("ai_monthly_limit").notNull().default(100),
  aiUsedThisMonth: integer("ai_used_this_month").notNull().default(0),
  /** Satıcının kendi Google Gemini API anahtarı (boşsa platform anahtarı kullanılır). */
  geminiApiKey: text("gemini_api_key"),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const platformSettings = pgTable("platform_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Panel kullanıcıları. merchantId boşsa platform (süper admin) personelidir. */
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").references(() => merchants.id, { onDelete: "cascade" }),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").$type<"owner" | "editor" | "merchant_owner" | "merchant_staff">().notNull().default("merchant_owner"),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Shopier hesabı: bir hesaba ödeme modülünde en fazla 5 site (website_index 1-5) bağlanır. */
export const shopierAccounts = pgTable("shopier_accounts", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  shopSlug: text("shop_slug"),
  apiKey: text("api_key"),
  apiSecret: text("api_secret"),
  personalAccessToken: text("personal_access_token"),
  webhookToken: text("webhook_token"),
  /** Shopier'deki beden varyasyonunun kimliği ("Numara" / "Beden"). */
  sizeVariationId: text("size_variation_id"),
  /** Beden başlığı → Shopier selection id eşlemesi. */
  selectionMap: jsonb("selection_map").$type<Record<string, string>>().notNull().default({}),
  webhookIds: jsonb("webhook_ids").$type<string[]>().notNull().default([]),
  productApiEnabled: boolean("product_api_enabled"),
  lastCheckAt: timestamp("last_check_at", { withTimezone: true }),
  lastCheckMessage: text("last_check_message"),
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
  lastSyncStatus: text("last_sync_status"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sites = pgTable("sites", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  theme: text("theme").$type<ThemeKey>().notNull().default("urban"),
  status: text("status").$type<"active" | "draft" | "maintenance">().notNull().default("draft"),
  shopierAccountId: integer("shopier_account_id").references(() => shopierAccounts.id, { onDelete: "set null" }),
  /** Shopier ödeme modülündeki site sırası (1-5). */
  shopierWebsiteIndex: integer("shopier_website_index"),
  /** module: sepet tutarı Shopier ödeme modülüyle; hosted: ürün bazlı Shopier ödeme sayfası; demo: test. */
  paymentMode: text("payment_mode").$type<"module" | "hosted" | "demo">().notNull().default("demo"),
  settings: jsonb("settings").$type<SiteSettings>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const siteDomains = pgTable(
  "site_domains",
  {
    id: serial("id").primaryKey(),
    siteId: integer("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
    hostname: text("hostname").notNull(),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("site_domains_hostname_idx").on(t.hostname)],
);

/**
 * Ürünler. catalogKey = "pool" platformun merkezi katalog havuzu, "m:{satıcıId}" satıcının kataloğu.
 * Satıcı havuzdan ürün eklediğinde kayıt kopyalanır (sourcePoolId ile bağlı kalır).
 */
export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    catalogKey: text("catalog_key").notNull(),
    sourcePoolId: integer("source_pool_id"),
    externalId: text("external_id").notNull(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    brand: text("brand").notNull(),
    model: text("model").notNull(),
    colorName: text("color_name").notNull(),
    colorHex: text("color_hex").notNull().default("#111111"),
    gender: text("gender").$type<"erkek" | "kadin" | "cocuk" | "unisex">().notNull(),
    productType: text("product_type").$type<"ayakkabi" | "giyim" | "aksesuar">().notNull(),
    category: text("category").notNull(),
    price: integer("price").notNull(),
    compareAtPrice: integer("compare_at_price"),
    description: text("description").notNull().default(""),
    material: text("material"),
    sku: text("sku").notNull(),
    images: jsonb("images").$type<ProductImage[]>().notNull().default([]),
    variants: jsonb("variants").$type<ProductVariant[]>().notNull().default([]),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    isNew: boolean("is_new").notNull().default(false),
    isBestSeller: boolean("is_best_seller").notNull().default(false),
    isFeatured: boolean("is_featured").notNull().default(false),
    releaseDate: timestamp("release_date", { withTimezone: true }),
    popularity: integer("popularity").notNull().default(0),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("products_catalog_external_idx").on(t.catalogKey, t.externalId),
    uniqueIndex("products_catalog_slug_idx").on(t.catalogKey, t.slug),
  ],
);

/** Satıcı ürününün Shopier'deki karşılığı (Shopier hesabı başına). */
export const productShopierLinks = pgTable(
  "product_shopier_links",
  {
    productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    shopierAccountId: integer("shopier_account_id").notNull().references(() => shopierAccounts.id, { onDelete: "cascade" }),
    shopierProductId: text("shopier_product_id"),
    shopierUrl: text("shopier_url"),
    status: text("status").$type<"pending" | "synced" | "error">().notNull().default("pending"),
    lastError: text("last_error"),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  },
  (t) => [primaryKey({ columns: [t.productId, t.shopierAccountId] }), index("psl_shopier_idx").on(t.shopierProductId)],
);

export const syncLogs = pgTable("sync_logs", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").references(() => merchants.id, { onDelete: "cascade" }),
  shopierAccountId: integer("shopier_account_id").references(() => shopierAccounts.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  status: text("status").$type<"ok" | "error" | "info">().notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Site bazlı ürün SEO ve görünürlük ayarları: aynı ürün her sitede farklı metinle yayınlanır. */
export const productSiteOverrides = pgTable(
  "product_site_overrides",
  {
    siteId: integer("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
    productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    hidden: boolean("hidden").notNull().default(false),
    title: text("title"),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    description: text("description"),
    aiGeneratedAt: timestamp("ai_generated_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.siteId, t.productId] })],
);

/** Site bazlı kategori/koleksiyon SEO metinleri. */
export const collectionSeo = pgTable(
  "collection_seo",
  {
    siteId: integer("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    h1: text("h1"),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    intro: text("intro"),
    content: text("content"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.siteId, t.key] })],
);

/** Statik sayfa içerik geçersiz kılmaları (boşsa varsayılan şablon kullanılır). */
export const sitePages = pgTable(
  "site_pages",
  {
    siteId: integer("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title"),
    metaDescription: text("meta_description"),
    content: text("content"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.siteId, t.slug] })],
);

export const blogPosts = pgTable(
  "blog_posts",
  {
    id: serial("id").primaryKey(),
    siteId: integer("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    excerpt: text("excerpt").notNull().default(""),
    content: text("content").notNull().default(""),
    cover: text("cover"),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    status: text("status").$type<"published" | "draft">().notNull().default("published"),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("blog_posts_site_slug_idx").on(t.siteId, t.slug)],
);

export const passwordResets = pgTable("password_resets", {
  token: text("token").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id, { onDelete: "cascade" }),
  adminUserId: integer("admin_user_id").references(() => adminUsers.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
});

export const customers = pgTable(
  "customers",
  {
    id: serial("id").primaryKey(),
    siteId: integer("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    phone: text("phone"),
    marketingConsent: boolean("marketing_consent").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("customers_site_email_idx").on(t.siteId, t.email)],
);

export const addresses = pgTable("addresses", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  city: text("city").notNull(),
  district: text("district").notNull(),
  line: text("line").notNull(),
  postcode: text("postcode"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    siteId: integer("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
    orderNo: text("order_no").notNull().unique(),
    customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    shippingAddress: jsonb("shipping_address").$type<OrderAddress>().notNull(),
    billingAddress: jsonb("billing_address").$type<OrderAddress>().notNull(),
    subtotal: integer("subtotal").notNull(),
    discount: integer("discount").notNull().default(0),
    shippingFee: integer("shipping_fee").notNull().default(0),
    total: integer("total").notNull(),
    couponCode: text("coupon_code"),
    status: text("status").$type<OrderStatus>().notNull().default("pending_payment"),
    paymentProvider: text("payment_provider").notNull().default("shopier"),
    paymentRef: text("payment_ref"),
    installment: integer("installment"),
    source: text("source").$type<"site" | "shopier">().notNull().default("site"),
    shopierOrderId: text("shopier_order_id"),
    shippingCompany: text("shipping_company"),
    trackingNo: text("tracking_no"),
    note: text("note"),
    adminNote: text("admin_note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("orders_site_idx").on(t.siteId), index("orders_created_idx").on(t.createdAt), index("orders_shopier_idx").on(t.shopierOrderId)],
);

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  brand: text("brand").notNull(),
  size: text("size").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(),
  image: text("image"),
});

export const coupons = pgTable(
  "coupons",
  {
    id: serial("id").primaryKey(),
    merchantId: integer("merchant_id").references(() => merchants.id, { onDelete: "cascade" }),
    siteId: integer("site_id").references(() => sites.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    type: text("type").$type<"percent" | "fixed">().notNull(),
    value: integer("value").notNull(),
    minTotal: integer("min_total").notNull().default(0),
    usageLimit: integer("usage_limit"),
    usedCount: integer("used_count").notNull().default(0),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("coupons_code_idx").on(t.code)],
);

export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  siteId: integer("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  subject: text("subject").notNull(),
  orderNo: text("order_no"),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const newsletterSubscribers = pgTable(
  "newsletter_subscribers",
  {
    id: serial("id").primaryKey(),
    siteId: integer("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("newsletter_site_email_idx").on(t.siteId, t.email)],
);

/** "Gelince haber ver": tükenen beden ya da yakında çıkacak ürün için talep. */
export const stockAlerts = pgTable("stock_alerts", {
  id: serial("id").primaryKey(),
  siteId: integer("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  size: text("size"),
  email: text("email").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Site = typeof sites.$inferSelect;
export type Merchant = typeof merchants.$inferSelect;
export type ShopierAccount = typeof shopierAccounts.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type BlogPost = typeof blogPosts.$inferSelect;
