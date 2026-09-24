import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import { resolveSite, type SiteContext } from "@/lib/site";
import { getCatalog } from "@/lib/catalog";
import { buildMenu } from "@/lib/store-data";
import { readableOn } from "@/lib/color";
import { indexable } from "@/lib/store-context";
import { StoreProvider } from "@/components/store/providers";
import { CartDrawer, CookieConsent, MobileMenu, SearchOverlay, Toaster, WhatsAppButton } from "@/components/store/overlays";
import { Footer } from "@/components/store/footer";
import { JsonLd } from "@/components/store/json-ld";
import { Analytics } from "@/components/store/analytics";
import { organizationLd, websiteLd } from "@/lib/seo/schema-org";
import { HEADERS } from "@/themes/headers";
import { THEMES } from "@/themes/registry";

export const dynamic = "force-dynamic";

export async function generateViewport({ params }: LayoutProps<"/s/[site]">): Promise<Viewport> {
  const { site: key } = await params;
  const site = await resolveSite(key);
  return { themeColor: site ? (THEMES[site.theme].dark ? "#0a0a0a" : site.settings.colors.primary) : "#111111" };
}

export async function generateMetadata({ params }: LayoutProps<"/s/[site]">): Promise<Metadata> {
  const { site: key } = await params;
  const site = await resolveSite(key);
  if (!site) return {};
  const s = site.settings;
  const title = s.seo.homeTitle || `${site.name} | ${s.tagline}`;
  return {
    metadataBase: new URL(site.baseUrl),
    title: { default: title, template: `%s | ${s.seo.titleSuffix || site.name}` },
    description: s.seo.homeDescription,
    keywords: s.seo.keywords.length ? s.seo.keywords : undefined,
    applicationName: site.name,
    icons: { icon: [{ url: "/site-icon", type: "image/png", sizes: "64x64" }] },
    robots: indexable(site)
      ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } }
      : { index: false, follow: false },
    openGraph: {
      type: "website",
      locale: "tr_TR",
      siteName: site.name,
      title,
      description: s.seo.homeDescription,
      url: "/",
    },
    twitter: { card: "summary_large_image", title, description: s.seo.homeDescription },
    verification: {
      google: s.seo.googleVerification || undefined,
      yandex: s.seo.yandexVerification || undefined,
      other: s.seo.bingVerification ? { "msvalidate.01": s.seo.bingVerification } : undefined,
    },
    formatDetection: { telephone: false },
    other: { "geo.region": "TR", ...(s.contact.city ? { "geo.placename": s.contact.city } : {}) },
  };
}

function themeStyle(site: SiteContext): React.CSSProperties {
  const c = site.settings.colors;
  return {
    ["--c-primary" as string]: c.primary,
    ["--c-primary-fg" as string]: readableOn(c.primary),
    ["--c-accent" as string]: c.accent,
    ["--c-accent-fg" as string]: readableOn(c.accent),
    ["--c-sale" as string]: c.sale,
  };
}

function StatusScreen({ site, title, body }: { site: SiteContext; title: string; body: string }) {
  return (
    <div data-theme={site.theme} style={themeStyle(site)} className="store grid min-h-screen place-items-center px-6 text-center">
      <div className="max-w-md">
        <p className="font-heading text-4xl font-bold">{site.name}</p>
        <h1 className="mt-6 text-xl font-semibold">{title}</h1>
        <p className="mt-2 text-muted">{body}</p>
      </div>
    </div>
  );
}

export default async function SiteLayout({ children, params }: LayoutProps<"/s/[site]">) {
  const { site: key } = await params;
  const site = await resolveSite(key);
  if (!site) notFound();

  // Kopya index oluşmaması için www ve alt alan adı istekleri birincil alan adına kalıcı yönlendirilir.
  if (!site.isPreview && site.requestHost !== site.primaryHost) {
    const h = await headers();
    const path = h.get("x-url-path") ?? "/";
    permanentRedirect(`${site.baseUrl}${path}`);
  }

  if (!site.isPreview && site.status === "draft") {
    return <StatusScreen site={site} title="Çok yakında yayındayız" body="Mağazamız hazırlanıyor. Kısa süre içinde yeni sezon ürünleriyle burada olacağız." />;
  }
  if (!site.isPreview && site.status === "maintenance") {
    return <StatusScreen site={site} title="Kısa bir bakım çalışması yapıyoruz" body="Sitemiz kısa süreliğine bakımdadır. Lütfen birkaç dakika sonra tekrar deneyin." />;
  }

  const all = await getCatalog(site);
  const menu = buildMenu(all);
  const popular = [
    ...new Map(all.filter((p) => p.isBestSeller).map((p) => [p.seriesSlug, { label: `${p.brand} ${p.model}`, href: `/seri/${p.seriesSlug}` }])).values(),
  ].slice(0, 8);
  const s = site.settings;
  const Header = HEADERS[site.theme];

  return (
    <div data-theme={site.theme} style={themeStyle(site)} className={site.theme === "outlet" ? "store flex min-h-screen flex-col pb-16 md:pb-0" : "store flex min-h-screen flex-col"}>
      <StoreProvider
        config={{
          siteId: site.id,
          siteName: site.name,
          theme: site.theme,
          freeShippingThreshold: s.shipping.freeShippingThreshold * 100,
          shippingFee: s.shipping.fee * 100,
          installmentText: s.installmentText,
          whatsapp: s.contact.whatsapp,
        }}
      >
        {site.isPreview && (
          <div className="flex items-center justify-center gap-3 bg-amber-400 px-4 py-1.5 text-center text-xs font-semibold text-black">
            {site.themePreview ? (
              <>
                Tema önizleme: {site.name} · {THEMES[site.theme].name} teması (henüz uygulanmadı)
                <a href="/panel/onizle-kapat?geri=/panel/temalar" className="underline">
                  Temalara dön
                </a>
              </>
            ) : (
              <>
                Önizleme modu: {site.name} ({site.status === "active" ? "yayında" : site.status === "draft" ? "taslak" : "bakımda"})
                <a href={`/panel/onizle-kapat?geri=/panel/siteler/${site.id}`} className="underline">
                  Önizlemeden çık ve panele dön
                </a>
              </>
            )}
          </div>
        )}
        <a href="#icerik" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:bg-bg focus:p-3">
          İçeriğe geç
        </a>
        <Header site={site} menu={menu} />
        <main id="icerik" className="flex-1">
          {children}
        </main>
        <Footer site={site} />
        <CartDrawer variant={site.theme} />
        <SearchOverlay popular={popular} variant={site.theme} />
        <MobileMenu items={menu} social={s.social} siteName={site.name} />
        <Toaster />
        <CookieConsent />
        <WhatsAppButton phone={s.contact.whatsapp} />
        <JsonLd data={[organizationLd(site), websiteLd(site)]} />
        <Analytics gaId={s.seo.gaId} gtmId={s.seo.gtmId} pixelId={s.seo.metaPixelId} />
      </StoreProvider>
    </div>
  );
}
