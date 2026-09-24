/**
 * Demo verisi yükler:
 *  - Platform yöneticisi (süper admin)
 *  - Merkezi katalog havuzu (demo ürünler)
 *  - Demo satıcı + satıcı kullanıcısı, havuzdan içe aktarılmış katalog
 *  - Her tema için bir örnek site
 * Kullanım: npm run db:seed
 */
import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "../src/db";
import { buildDemoCatalog } from "../src/data/demo-catalog";
import { createSite } from "../src/lib/site-factory";
import { POOL_KEY, importFromPool } from "../src/lib/catalog-admin";
import { PLANS } from "../src/lib/plans";

const DEMO_SITES = [
  { name: "Kickshane", slug: "kickshane", theme: "urban", city: "İstanbul" },
  { name: "StepArena", slug: "steparena", theme: "arena", city: "Ankara" },
  { name: "HypeDrop", slug: "hypedrop", theme: "neon", city: "İzmir" },
  { name: "Kundura Studio", slug: "kundura", theme: "studio", city: "İstanbul" },
  { name: "Zıpla Spor", slug: "zipla", theme: "pulse", city: "Bursa" },
] as const;

async function upsertUser(email: string, password: string, data: { name: string; role: "owner" | "merchant_owner"; merchantId: number | null }) {
  const existing = await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.email, email) });
  if (existing) return existing;
  const [u] = await db
    .insert(schema.adminUsers)
    .values({ email, name: data.name, role: data.role, merchantId: data.merchantId, passwordHash: await bcrypt.hash(password, 10) })
    .returning();
  return u;
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@sneaker.local";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin12345";
  const merchantEmail = "satici@sneaker.local";
  const merchantPassword = "satici12345";

  console.log("→ Platform yöneticisi");
  await upsertUser(adminEmail, adminPassword, { name: "Platform Yöneticisi", role: "owner", merchantId: null });

  console.log("→ Katalog havuzu");
  const catalog = buildDemoCatalog();
  for (const p of catalog) {
    await db
      .insert(schema.products)
      .values({ catalogKey: POOL_KEY, ...p })
      .onConflictDoUpdate({ target: [schema.products.catalogKey, schema.products.externalId], set: { ...p, updatedAt: sql`now()` } });
  }
  console.log(`  ${catalog.length} ürün havuzda`);

  console.log("→ Demo satıcı");
  let merchant = await db.query.merchants.findFirst({ where: eq(schema.merchants.email, merchantEmail) });
  if (!merchant) {
    const plan = PLANS.kurumsal;
    [merchant] = await db
      .insert(schema.merchants)
      .values({
        name: "Demo Sneaker Mağazası",
        email: merchantEmail,
        phone: "0850 000 00 00",
        status: "active",
        plan: plan.key,
        siteLimit: plan.siteLimit,
        productLimit: plan.productLimit,
        aiMonthlyLimit: plan.aiMonthlyLimit,
      })
      .returning();
  }
  await upsertUser(merchantEmail, merchantPassword, { name: "Demo Satıcı", role: "merchant_owner", merchantId: merchant.id });
  const imported = await importFromPool(merchant.id, "all");
  console.log(`  havuzdan ${imported.added} ürün eklendi (${imported.skipped} zaten vardı)`);

  console.log("→ Demo siteler");
  for (const s of DEMO_SITES) {
    const found = await db.query.sites.findFirst({ where: eq(schema.sites.slug, s.slug) });
    if (found) {
      console.log(`  ${s.slug} zaten var`);
      continue;
    }
    await createSite({ merchantId: merchant.id, name: s.name, slug: s.slug, theme: s.theme, status: "active", city: s.city });
    console.log(`  ${s.slug} (${s.theme}) oluşturuldu`);
  }

  const siteRows = await db.select().from(schema.sites);
  if (!(await db.$count(schema.coupons))) {
    await db.insert(schema.coupons).values([
      { merchantId: merchant.id, code: "HOSGELDIN", type: "percent", value: 10, minTotal: 100000 },
      { merchantId: merchant.id, code: "KARGO100", type: "fixed", value: 10000, minTotal: 150000 },
      ...siteRows.map((s) => ({ merchantId: merchant.id, siteId: s.id, code: `${s.slug.toUpperCase().slice(0, 6)}15`, type: "percent" as const, value: 15, minTotal: 250000 })),
    ]);
  }

  console.log(`\nHazır.`);
  console.log(`  Platform paneli: http://localhost:3000/panel  (${adminEmail} / ${adminPassword})`);
  console.log(`  Satıcı paneli:   http://localhost:3000/panel  (${merchantEmail} / ${merchantPassword})`);
  for (const s of siteRows) console.log(`  ${s.name}: http://${s.slug}.localhost:3000`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
