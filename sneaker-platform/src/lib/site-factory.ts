import { db, schema } from "@/db";
import { defaultSettings } from "@/lib/site-defaults";
import { starterBlogPosts } from "@/lib/content/blog";
import { slugify } from "@/lib/taxonomy";
import type { ThemeKey } from "@/themes/registry";
import type { SiteSettings } from "@/lib/site-settings";

export type CreateSiteInput = {
  merchantId: number;
  name: string;
  slug?: string;
  theme: ThemeKey;
  status?: "active" | "draft" | "maintenance";
  domains?: string[];
  city?: string;
  settingsPatch?: Partial<SiteSettings>;
};

export function normalizeHostname(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/^www\./, "");
}

/** Yeni site oluşturur: varsayılan içerik, alan adları ve başlangıç blog yazılarıyla birlikte. */
export async function createSite(input: CreateSiteInput) {
  const slug = slugify(input.slug || input.name);
  const settings = { ...defaultSettings({ name: input.name, slug, theme: input.theme, city: input.city }), ...(input.settingsPatch ?? {}) };
  return db.transaction(async (tx) => {
    const [site] = await tx
      .insert(schema.sites)
      .values({
        merchantId: input.merchantId,
        slug,
        name: input.name,
        theme: input.theme,
        status: input.status ?? "draft",
        settings,
      })
      .returning();
    const hosts = [...new Set((input.domains ?? []).map(normalizeHostname).filter(Boolean))];
    if (hosts.length) {
      await tx.insert(schema.siteDomains).values(hosts.map((hostname, i) => ({ siteId: site.id, hostname, isPrimary: i === 0 })));
    }
    const posts = starterBlogPosts(settings.seo.seed);
    await tx.insert(schema.blogPosts).values(posts.map((p) => ({ ...p, siteId: site.id })));
    return site;
  });
}
