import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { getPlatformSetting } from "@/lib/platform-settings";
import { PLANS } from "@/lib/plans";
import { THEMES, THEME_KEYS } from "@/themes/registry";
import { TR_CITIES } from "@/lib/tr-cities";
import { CATEGORIES } from "@/lib/taxonomy";
import { Wordmark } from "@/components/panel/shell";
import { SetupWizard } from "./setup-wizard";

export const metadata: Metadata = { title: "Mağazanı kur", robots: { index: false, follow: true } };
export const dynamic = "force-dynamic";

export default async function SignupPage({ searchParams }: PageProps<"/panel/kayit">) {
  const general = await getPlatformSetting("general");
  const sp = await searchParams;
  if (!general.signupOpen) {
    return (
      <div className="glass-page grid min-h-screen place-items-center p-6">
        <div className="glass-strong w-full max-w-md rounded-[32px] p-8 text-center">
          <Link href="/" className="text-2xl">
            <Wordmark />
          </Link>
          <h1 className="mt-6 text-2xl font-semibold">Kayıtlar şu an kapalı</h1>
          <p className="mt-2 text-zinc-600">Yeni satıcı hesapları şimdilik ekibimiz tarafından açılıyor.</p>
          {general.supportEmail && (
            <a href={`mailto:${general.supportEmail}?subject=${encodeURIComponent("Satıcı hesabı talebi")}`} className="mt-6 flex h-12 items-center justify-center rounded-full bg-zinc-900 font-semibold text-white">
              {general.supportEmail}
            </a>
          )}
          <Link href="/panel/giris" className="mt-4 block text-sm font-medium underline">
            Girişe dön
          </Link>
        </div>
      </div>
    );
  }
  const pool = and(eq(schema.products.catalogKey, "pool"), eq(schema.products.active, true));
  const brands = await db
    .select({ name: schema.products.brand, n: sql<number>`count(*)::int` })
    .from(schema.products)
    .where(pool)
    .groupBy(schema.products.brand)
    .orderBy(desc(sql`count(*)`))
    .limit(18);
  const cats = await db.select({ key: schema.products.category, n: sql<number>`count(*)::int` }).from(schema.products).where(pool).groupBy(schema.products.category);
  const poolTotal = cats.reduce((a, c) => a + c.n, 0);
  const plan = typeof sp.paket === "string" && sp.paket in PLANS ? sp.paket : general.defaultPlan;
  const root = process.env.ROOT_DOMAIN ?? "localhost:3000";

  return (
    <SetupWizard
      platformName={general.platformName}
      trialDays={general.trialDays}
      rootDomain={root}
      initialStore={typeof sp.magaza === "string" ? sp.magaza.slice(0, 60) : ""}
      initialPlan={plan}
      cities={TR_CITIES as unknown as string[]}
      themes={THEME_KEYS.map((k) => ({ key: k, name: THEMES[k].name, tagline: THEMES[k].tagline, primary: THEMES[k].defaults.primary, accent: THEMES[k].defaults.accent }))}
      plans={Object.values(PLANS).map((p) => ({ key: p.key, name: p.name, price: p.priceMonthly, features: p.features.slice(0, 4), productLimit: p.productLimit }))}
      brands={brands.map((b) => ({ name: b.name, count: b.n }))}
      categories={CATEGORIES.filter((c) => cats.some((x) => x.key === c.key)).map((c) => ({ key: c.key, label: c.label, count: cats.find((x) => x.key === c.key)?.n ?? 0 }))}
      poolTotal={poolTotal}
    />
  );
}
