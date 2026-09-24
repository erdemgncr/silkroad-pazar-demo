import Link from "next/link";
import { ArrowUpRight, Eye, Globe } from "lucide-react";
import { requirePanel, siteUrl } from "@/lib/panel";
import { visibleSites } from "@/lib/panel-data";
import { Badge, ButtonLink, Empty, PageHeader } from "@/components/panel/ui";
import { THEMES } from "@/themes/registry";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Siteler" };

export default async function SitesPage() {
  const ctx = await requirePanel();
  const sites = await visibleSites(ctx);
  return (
    <>
      <PageHeader
        title={ctx.isPlatform ? "Tüm Siteler" : "Sitelerim"}
        description={
          ctx.merchant
            ? `${sites.length} / ${ctx.merchant.siteLimit} site kullanılıyor. Her site ayrı alan adı, tema, SEO metinleri ve Google hesabıyla bağımsız çalışır.`
            : `${sites.length} site`
        }
        actions={<ButtonLink href="/panel/siteler/yeni">+ Yeni Site</ButtonLink>}
      />
      {sites.length === 0 ? (
        <Empty title="Henüz siten yok" description="İlk siteni oluştur; tema seç, alan adını bağla ve katalogdan ürün ekle." action={<ButtonLink href="/panel/siteler/yeni">Site Oluştur</ButtonLink>} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
              <tr>
                <th className="px-5 py-3 font-medium">Site</th>
                <th className="hidden px-5 py-3 font-medium md:table-cell">Tema</th>
                <th className="hidden px-5 py-3 font-medium lg:table-cell">Ödeme</th>
                <th className="px-5 py-3 font-medium">Durum</th>
                <th className="hidden px-5 py-3 font-medium md:table-cell">Oluşturma</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {sites.map((s) => {
                const url = siteUrl(s.slug, s.domains);
                return (
                  <tr key={s.id} className="hover:bg-zinc-50">
                    <td className="px-5 py-4">
                      <Link href={`/panel/siteler/${s.id}`} className="font-semibold hover:underline">
                        {s.name}
                      </Link>
                      <p className="flex items-center gap-1 text-xs text-zinc-500">
                        <Globe size={12} /> {url.replace(/^https?:\/\//, "")}
                        {s.domains.length === 0 && <span className="text-amber-600">(alan adı bağlanmadı)</span>}
                      </p>
                    </td>
                    <td className="hidden px-5 py-4 md:table-cell">
                      <span className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full ring-1 ring-black/10" style={{ background: s.settings.colors.primary }} />
                        {THEMES[s.theme].name}
                      </span>
                    </td>
                    <td className="hidden px-5 py-4 lg:table-cell">
                      {s.paymentMode === "demo" ? <Badge tone="amber">Test modu</Badge> : s.paymentMode === "module" ? <Badge tone="violet">Shopier modül #{s.shopierWebsiteIndex}</Badge> : <Badge tone="violet">Shopier ürün sayfası</Badge>}
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={s.status === "active" ? "green" : s.status === "draft" ? "amber" : "red"}>{s.status === "active" ? "Yayında" : s.status === "draft" ? "Taslak" : "Bakımda"}</Badge>
                    </td>
                    <td className="hidden px-5 py-4 text-zinc-500 md:table-cell">{formatDate(s.createdAt)}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <a href={`/panel/onizle/${s.slug}`} title="Önizle" className="grid h-8 w-8 place-items-center rounded-lg border border-zinc-300 hover:bg-white">
                          <Eye size={15} />
                        </a>
                        <a href={url} target="_blank" rel="noopener noreferrer" title="Siteyi aç" className="grid h-8 w-8 place-items-center rounded-lg border border-zinc-300 hover:bg-white">
                          <ArrowUpRight size={15} />
                        </a>
                        <Link href={`/panel/siteler/${s.id}`} className="inline-flex h-8 items-center rounded-lg bg-zinc-900 px-3 text-xs font-semibold text-white">
                          Yönet
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
