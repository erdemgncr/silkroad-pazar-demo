import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { requirePanel, selectedMerchantId } from "@/lib/panel";
import { visibleSites } from "@/lib/panel-data";
import { hubCounts } from "@/lib/actions/panel-ai";
import { SUGGESTIONS } from "@/lib/ai/commands";
import { aiConfig } from "@/lib/ai/gemini";
import { THEMES } from "@/themes/registry";
import { Empty, ButtonLink } from "@/components/panel/ui";
import { AiCommand } from "./ai-command";

export const metadata = { title: "Özelleştir" };

function currentTime() {
  return Date.now();
}

function ago(d: Date, now: number) {
  const m = Math.max(1, Math.round((now - d.getTime()) / 60000));
  if (m < 60) return `${m} dk önce`;
  if (m < 1440) return `${Math.floor(m / 60)} sa önce`;
  return `${Math.floor(m / 1440)} gün önce`;
}

type HubCard = { href: string; title: string; desc: string; meta: string };

function Card({ c, side }: { c: HubCard; side: "left" | "right" }) {
  return (
    <Link href={c.href} className={`glass glass-hover relative block rounded-3xl px-6 py-5 ${side === "left" ? "lg:mr-2" : "lg:ml-2"}`}>
      <p className="text-[17px] font-semibold tracking-tight">{c.title}</p>
      <p className="mt-1 text-sm text-zinc-600">{c.desc}</p>
      <p className="mt-3 text-xs text-zinc-500">{c.meta}</p>
    </Link>
  );
}

export default async function CustomizePage({ searchParams }: PageProps<"/panel/ozellestir">) {
  const ctx = await requirePanel();
  const sp = await searchParams;
  const all = await visibleSites(ctx);
  const selectedMerchant = ctx.isPlatform ? await selectedMerchantId(ctx) : null;
  const sites = ctx.isPlatform && selectedMerchant ? all.filter((s) => s.merchantId === selectedMerchant) : all;
  const site = sites.find((s) => String(s.id) === sp.site) ?? sites[0];
  if (!site) {
    return (
      <Empty
        title="Önce bir site kur"
        description="Özelleştir alanı sitenin ürünlerini, kampanyalarını ve görünümünü tek yerden yönetmeni sağlar."
        action={<ButtonLink href="/panel/siteler/yeni">Site kur</ButtonLink>}
      />
    );
  }
  const counts = await hubCounts(site.id);
  const ai = await aiConfig(ctx.merchant ?? null);
  const s = site.settings;
  const nowMs = currentTime();
  const status = site.status === "active" ? { label: "Yayında", dot: "bg-emerald-500" } : site.status === "draft" ? { label: "Taslak", dot: "bg-amber-400" } : { label: "Bakımda", dot: "bg-rose-500" };

  const left: HubCard[] = [
    { href: "/panel/urunler", title: "Ürünler ve fiyatlar", desc: "Fiyatlar, stok, bedenler, görseller", meta: `${counts.products} ürün · ${counts.outOfStock} stoksuz` },
    { href: `/panel/siteler/${site.id}?sekme=anasayfa`, title: "Karşılama", desc: "Slider, bannerlar, duyuru şeridi", meta: `${s.heroSlides.length} slayt · ${s.announcements.length} duyuru` },
    { href: `/panel/siteler/${site.id}?sekme=iletisim`, title: "Bilgiler ve iletişim", desc: "Adres, saatler, şirket bilgileri", meta: `${s.contact.city}${s.contact.phone ? ` · ${s.contact.phone}` : ""}` },
  ];
  const right: HubCard[] = [
    {
      href: "/panel/kuponlar",
      title: "Kampanyalar",
      desc: "Kuponlar ve kargo kampanyası",
      meta: `${counts.coupons} aktif kupon · ${s.shipping.freeShippingThreshold ? `${s.shipping.freeShippingThreshold.toLocaleString("tr-TR")} TL üzeri kargo bedava` : "kargo bedava"}`,
    },
    { href: `/panel/siteler/${site.id}?sekme=sayfalar`, title: "Sayfalar ve blog", desc: "SSS, hakkımızda, yasal metinler, blog", meta: `${counts.pages} sayfa · ${counts.posts} yazı` },
    { href: "/panel/temalar", title: "Görünüm", desc: "Tema, renkler, logo ve slogan", meta: `${THEMES[site.theme].name} tema` },
  ];

  return (
    <div className="mx-auto max-w-[1180px]">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-[32px] font-semibold tracking-[-0.03em]">Özelleştir</h1>
          <p className="mt-1 text-[15px] text-zinc-500">Mağazanı besleyen her şey tek yerde. Bir alana dokun ya da yapay zekaya yaz.</p>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          <a href={`/panel/onizle/${site.slug}`} className="inline-flex h-10 items-center gap-1.5 rounded-full border border-black/10 bg-white/70 px-5 text-sm font-semibold hover:bg-white">
            Önizle <ArrowUpRight size={15} />
          </a>
          <p className="flex items-center gap-2 text-xs text-zinc-500">
            <span className={`h-2 w-2 rounded-full ${status.dot}`} />
            <b className="font-semibold text-zinc-800">{status.label}</b> · Son değişiklik {ago(site.updatedAt, nowMs)}
          </p>
        </div>
      </div>

      {sites.length > 1 && (
        <div className="no-scrollbar -mx-4 mt-5 overflow-x-auto px-4">
          <div className="glass inline-flex min-w-max gap-1 rounded-full p-1">
            {sites.map((x) => (
              <Link key={x.id} href={`/panel/ozellestir?site=${x.id}`} className={`rounded-full px-4 py-2 text-sm font-medium ${x.id === site.id ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-white/80"}`}>
                {x.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Merkez: yapay zeka küresi ve çevresindeki alanlar */}
      <div className="relative mt-10 grid gap-4 lg:grid-cols-[1fr_260px_1fr] lg:items-center lg:gap-0">
        <svg className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block" viewBox="0 0 1000 420" preserveAspectRatio="none" aria-hidden>
          <g fill="none" stroke="rgba(15,17,26,0.22)" strokeWidth="1.2" vectorEffect="non-scaling-stroke">
            <path d="M390 62 C 440 62, 440 210, 470 210" vectorEffect="non-scaling-stroke" />
            <path d="M390 210 L 470 210" vectorEffect="non-scaling-stroke" />
            <path d="M390 358 C 440 358, 440 210, 470 210" vectorEffect="non-scaling-stroke" />
            <path d="M610 62 C 560 62, 560 210, 530 210" vectorEffect="non-scaling-stroke" />
            <path d="M610 210 L 530 210" vectorEffect="non-scaling-stroke" />
            <path d="M610 358 C 560 358, 560 210, 530 210" vectorEffect="non-scaling-stroke" />
          </g>
        </svg>
        <div className="order-2 grid gap-4 sm:grid-cols-2 lg:order-1 lg:grid-cols-1 lg:gap-6">
          {left.map((c) => (
            <Card key={c.title} c={c} side="left" />
          ))}
        </div>
        <div className="order-1 flex flex-col items-center py-4 lg:order-2">
          <div className="relative grid h-[190px] w-[190px] place-items-center rounded-full bg-[radial-gradient(circle,rgba(255,190,190,0.35),rgba(255,220,220,0.12)_55%,transparent_70%)]">
            <div className="absolute inset-[18px] rounded-full border border-dashed border-rose-200/80" />
            <div className="orb-halo relative">
              <span className="orb block h-[118px] w-[118px]" />
            </div>
          </div>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Sneaker AI</p>
        </div>
        <div className="order-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-1 lg:gap-6">
          {right.map((c) => (
            <Card key={c.title} c={c} side="right" />
          ))}
        </div>
      </div>

      <AiCommand siteId={site.id} suggestions={SUGGESTIONS} aiEnabled={Boolean(ai.key)} />
    </div>
  );
}
