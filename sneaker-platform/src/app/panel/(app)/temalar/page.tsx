import { eq } from "drizzle-orm";
import { Check } from "lucide-react";
import { db, schema } from "@/db";
import { requireMerchant } from "@/lib/panel";
import { THEMES, THEME_KEYS } from "@/themes/registry";
import { ThemeThumb } from "@/components/panel/theme-thumb";
import { Badge, PageHeader } from "@/components/panel/ui";
import { ThemeApply } from "./theme-apply";

export const metadata = { title: "Temalar" };

export default async function ThemesPage() {
  const ctx = await requireMerchant();
  const sites = await db.select({ id: schema.sites.id, slug: schema.sites.slug, name: schema.sites.name, theme: schema.sites.theme }).from(schema.sites).where(eq(schema.sites.merchantId, ctx.merchant.id));
  return (
    <>
      <PageHeader
        title="Temalar"
        description={`${THEME_KEYS.length} hazır mağaza tasarımı. Her tema kendi header, ana sayfa, ürün kartı ve ürün sayfası düzeniyle gelir; renkler, logo ve içerikler site ayarlarından özelleştirilir. Temayı uygulamadan önce kendi ürünlerinle önizleyebilirsin.`}
      />
      <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
        {THEME_KEYS.map((k) => {
          const t = THEMES[k];
          const using = sites.filter((s) => s.theme === k);
          return (
            <article key={k} className="flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white">
              <div className="border-b border-black/5 bg-white/40 p-3">
                <div className="overflow-hidden rounded-lg shadow-sm ring-1 ring-black/5">
                  <ThemeThumb theme={k} />
                </div>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-bold">{t.name}</h2>
                    <p className="text-sm font-medium text-orange-600">{t.tagline}</p>
                  </div>
                  <div className="flex gap-1">
                    {[t.defaults.primary, t.defaults.accent, t.defaults.sale].map((c, i) => (
                      <span key={i} className="h-5 w-5 rounded-full ring-1 ring-black/10" style={{ background: c }} />
                    ))}
                  </div>
                </div>
                <p className="mt-2 text-sm text-zinc-600">{t.description}</p>
                <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-zinc-600">
                  {t.highlights.map((h) => (
                    <li key={h} className="flex items-center gap-1.5">
                      <Check size={12} className="shrink-0 text-emerald-600" /> {h}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-zinc-500">
                  Uygun: <b className="text-zinc-700">{t.bestFor}</b>
                </p>
                {using.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {using.map((s) => (
                      <Badge key={s.id} tone="green">
                        {s.name}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="mt-auto pt-4">
                  <ThemeApply theme={k} sites={sites} />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
