import Link from "next/link";
import { clsx } from "clsx";
import { Headset, MapPin, Truck } from "lucide-react";
import type { SiteContext } from "@/lib/site";
import type { MenuItem } from "@/lib/store-types";
import { Logo } from "@/components/store/logo";
import { AnnouncementBar, HeaderActions, MegaNav, MenuButton, MobileTabBar, SearchTrigger, StickyHeader } from "@/components/store/header-parts";

type Props = { site: SiteContext; menu: MenuItem[] };

/** Urban: siyah duyuru bandı, solda logo, ortada büyük harfli menü, sağda ikonlar. */
export function UrbanHeader({ site, menu }: Props) {
  return (
    <>
      <AnnouncementBar messages={site.settings.announcements} variant="urban" />
      <div className="hidden border-b border-line bg-soft lg:block">
        <div className="container-x flex h-8 items-center justify-end gap-5 text-[12px] text-muted">
          <Link href="/siparis-takip" className="hover:text-fg">Sipariş Takibi</Link>
          <Link href="/sss" className="hover:text-fg">Yardım</Link>
          <Link href="/iletisim" className="hover:text-fg">İletişim</Link>
          <Link href="/hesabim/giris" className="hover:text-fg">Giriş Yap / Üye Ol</Link>
        </div>
      </div>
      <StickyHeader className="border-b border-line">
        <div className="container-x flex h-16 items-center justify-between gap-4 lg:h-[68px]">
          <div className="flex items-center gap-1">
            <MenuButton className="-ml-2" />
            <Logo site={site} size="sm" className="lg:hidden" />
            <Logo site={site} className="hidden lg:inline-flex" />
          </div>
          <MegaNav items={menu} variant="urban" className="static" />
          <HeaderActions variant="urban" />
        </div>
      </StickyHeader>
    </>
  );
}

/** Arena: çift satır; üstte logo + geniş arama + etiketli ikonlar, altta renkli kategori barı. */
export function ArenaHeader({ site, menu }: Props) {
  return (
    <>
      <AnnouncementBar messages={site.settings.announcements} variant="arena" />
      <div className="hidden border-b border-line lg:block">
        <div className="container-x flex h-9 items-center justify-between text-[12px] text-muted">
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5"><Truck size={14} /> {site.settings.shipping.dispatchDays} içinde kargoda</span>
            <span className="flex items-center gap-1.5"><Headset size={14} /> {site.settings.contact.phone}</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/siparis-takip" className="hover:text-fg">Sipariş Takibi</Link>
            <Link href="/kampanyalar" className="hover:text-fg">Kampanyalar</Link>
            <Link href="/sss" className="hover:text-fg">Yardım</Link>
            <Link href="/iletisim" className="flex items-center gap-1 hover:text-fg"><MapPin size={13} /> İletişim</Link>
          </div>
        </div>
      </div>
      <StickyHeader>
        <div className="container-x flex h-16 items-center gap-4 lg:h-20 lg:gap-10">
          <MenuButton className="-ml-2" />
          <Logo site={site} size="sm" className="lg:hidden" />
          <Logo site={site} className="hidden lg:inline-flex" />
          <div className="hidden flex-1 lg:block">
            <SearchTrigger variant="arena" />
          </div>
          <div className="ml-auto lg:ml-0">
            <div className="lg:hidden">
              <HeaderActions variant="arena" />
            </div>
            <div className="hidden lg:block">
              <HeaderActions variant="arena" labels />
            </div>
          </div>
        </div>
        <div className="px-4 pb-3 lg:hidden">
          <SearchTrigger variant="arena" />
        </div>
        <div className="relative hidden bg-primary lg:block">
          <div className="container-x">
            <MegaNav items={menu} variant="arena" className="static" />
          </div>
        </div>
      </StickyHeader>
    </>
  );
}

/** Neon: kayan duyuru bandı, bölünmüş menü, ortada parlayan logo. */
export function NeonHeader({ site, menu }: Props) {
  const left = menu.filter((m) => ["/yeni-gelenler", "/erkek", "/kadin", "/cocuk"].includes(m.href));
  const right = [...menu.filter((m) => ["/markalar", "/indirim"].includes(m.href)), { label: "Drop Takvimi", href: "/yakinda" }];
  return (
    <>
      <AnnouncementBar messages={site.settings.announcements} variant="neon" />
      <StickyHeader className="border-b border-line bg-bg/90 backdrop-blur">
        <div className="container-x relative flex h-16 items-center justify-between lg:grid lg:h-[72px] lg:grid-cols-[1fr_auto_1fr]">
          <div className="flex items-center">
            <MenuButton className="-ml-2" />
            <MegaNav items={left} variant="neon" className="static" />
          </div>
          <Logo site={site} className="absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0" size="sm" />
          <div className="flex items-center justify-end gap-2">
            <MegaNav items={right} variant="neon" className="static" />
            <HeaderActions variant="neon" />
          </div>
        </div>
      </StickyHeader>
    </>
  );
}

/** Studio: ince duyuru, ortada serif logo, altında ortalanmış menü. */
export function StudioHeader({ site, menu }: Props) {
  return (
    <>
      <AnnouncementBar messages={site.settings.announcements} variant="studio" />
      <StickyHeader className="border-b border-line">
        <div className="container-x grid h-16 grid-cols-[1fr_auto_1fr] items-center lg:h-20">
          <div className="flex items-center gap-3">
            <MenuButton className="-ml-2" />
            <div className="hidden w-64 lg:block">
              <SearchTrigger variant="studio" />
            </div>
          </div>
          <Logo site={site} size="md" />
          <div className="flex justify-end">
            <HeaderActions variant="studio" />
          </div>
        </div>
        <div className="relative hidden border-t border-line lg:block">
          <div className="container-x flex justify-center">
            <MegaNav items={menu} variant="studio" className="static" />
          </div>
        </div>
      </StickyHeader>
    </>
  );
}

/** Pulse: renkli duyuru, hap şeklinde menü, yuvarlak arama ve ikonlar. */
export function PulseHeader({ site, menu }: Props) {
  return (
    <>
      <AnnouncementBar messages={site.settings.announcements} variant="pulse" />
      <StickyHeader>
        <div className="container-x relative flex h-16 items-center gap-3 lg:h-[76px] lg:gap-6">
          <MenuButton className="-ml-2" />
          <Logo site={site} size="sm" />
          <MegaNav items={menu} variant="pulse" className="static ml-2" />
          <div className="ml-auto hidden w-64 2xl:block">
            <SearchTrigger variant="pulse" />
          </div>
          <div className="ml-auto 2xl:ml-0">
            <HeaderActions variant="pulse" />
          </div>
        </div>
      </StickyHeader>
    </>
  );
}

/**
 * Volt: kenarlardan boşluklu, yarı saydam gri bar; solda cinsiyet menüsü, ortada logo, sağda ikonlar.
 * Dar ve kalın büyük harf tipografi.
 */
export function VoltHeader({ site, menu }: Props) {
  const left = menu.filter((m) => ["/erkek", "/kadin", "/cocuk"].includes(m.href));
  const extra = menu.filter((m) => ["/markalar", "/indirim"].includes(m.href));
  return (
    <>
      <AnnouncementBar messages={site.settings.announcements} variant="volt" className="bg-black text-[12px] font-medium uppercase tracking-[0.08em] text-white" />
      <StickyHeader className="bg-bg lg:bg-transparent lg:!shadow-none">
        <div className="lg:px-4 lg:pt-3">
          <div className="relative grid h-14 grid-cols-[1fr_auto_1fr] items-center bg-neutral-500/95 px-3 text-white backdrop-blur-md lg:h-[46px] lg:px-6">
            <div className="flex items-center">
              <MenuButton className="-ml-1" />
              <MegaNav
                items={[...left, ...extra]}
                variant="volt"
                className="static"
                linkClass="h-[46px] px-3 font-heading text-[15px] font-bold uppercase tracking-[0.02em] hover:text-white/75"
                activeClass="after:absolute after:inset-x-3 after:bottom-2 after:h-[2px] after:bg-white"
              />
            </div>
            <Logo site={site} size="sm" />
            <div className="flex justify-end">
              <HeaderActions variant="volt" />
            </div>
          </div>
        </div>
      </StickyHeader>
    </>
  );
}

/** Metro: siyah kampanya bandı, alt markalar hapı, solda kırmızı logo, ortada büyük harf menü. */
export function MetroHeader({ site, menu }: Props) {
  const pills = [
    { label: site.name, href: "/", active: true },
    { label: "Yeni Sezon", href: "/yeni-gelenler" },
    { label: "Outlet", href: "/indirim" },
    { label: "Drop Takvimi", href: "/yakinda" },
  ];
  return (
    <>
      <AnnouncementBar messages={site.settings.announcements} variant="metro" className="bg-[#161616] text-[13px] font-semibold text-white" />
      <div className="hidden lg:block">
        <div className="container-x flex h-14 items-center justify-between">
          <div className="flex items-center gap-1 rounded-full bg-soft p-1">
            {pills.map((p) => (
              <Link key={p.href} href={p.href} className={clsx("rounded-full px-4 py-1.5 text-[12px] font-bold", p.active ? "bg-bg text-accent shadow-sm" : "text-fg/80 hover:text-fg")}>
                {p.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center divide-x divide-fg/60 text-[13px]">
            <Link href="/siparis-takip" className="px-4 hover:underline">Sipariş Takibi</Link>
            <Link href="/sss" className="px-4 hover:underline">Yardım &amp; Destek</Link>
            <Link href="/iletisim" className="pl-4 hover:underline">Mağazalar</Link>
          </div>
        </div>
      </div>
      <StickyHeader className="border-b border-line">
        <div className="container-x flex h-16 items-center gap-4 lg:h-[64px]">
          <MenuButton className="-ml-2" />
          <Logo site={site} size="sm" className="lg:hidden" />
          <Logo site={site} className="hidden lg:inline-flex" />
          <div className="flex flex-1 justify-center">
            <MegaNav
              items={menu}
              variant="metro"
              className="static"
              linkClass="h-[64px] px-3 text-[14px] font-medium uppercase tracking-[0.02em] xl:px-4"
              activeClass="after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:bg-accent"
            />
          </div>
          <HeaderActions variant="metro" />
        </div>
      </StickyHeader>
    </>
  );
}

/** Brut: sarı kayan yazı, kalın alt çizgi, sol logo, büyük harf menü ve çerçeveli arama. */
export function BrutHeader({ site, menu }: Props) {
  return (
    <>
      <AnnouncementBar messages={site.settings.announcements} variant="brut" marquee className="border-b-2 border-fg bg-accent text-black" />
      <StickyHeader className="border-b-2 border-fg">
        <div className="container-x flex h-16 items-center gap-3 lg:h-[72px] lg:gap-6">
          <MenuButton className="-ml-2" />
          <Logo site={site} size="sm" />
          <MegaNav
            items={menu}
            variant="brut"
            className="static ml-2"
            linkClass="h-[72px] px-2.5 font-heading text-[13px] font-extrabold uppercase tracking-tight hover:bg-accent xl:px-3"
            activeClass="bg-accent"
          />
          <div className="ml-auto hidden w-56 2xl:block">
            <SearchTrigger variant="brut" className="!h-11 border-2 border-fg bg-card px-3 text-fg" />
          </div>
          <div className="ml-auto 2xl:ml-0">
            <HeaderActions variant="brut" />
          </div>
        </div>
      </StickyHeader>
    </>
  );
}

/** Luxe: ince duyuru, ortada serif logo, altında geniş aralıklı menü. */
export function LuxeHeader({ site, menu }: Props) {
  return (
    <>
      <AnnouncementBar messages={site.settings.announcements} variant="luxe" marquee={false} className="border-b border-line bg-bg text-[11px] uppercase tracking-[0.28em] text-muted" />
      <StickyHeader className="border-b border-line bg-bg/95 backdrop-blur">
        <div className="container-x grid h-20 grid-cols-[1fr_auto_1fr] items-center lg:h-24">
          <div className="flex items-center gap-2">
            <MenuButton className="-ml-2" />
            <div className="hidden w-52 lg:block">
              <SearchTrigger variant="luxe" className="!border-line text-[12px] uppercase tracking-[0.2em]" />
            </div>
          </div>
          <Logo site={site} size="md" />
          <div className="flex justify-end">
            <HeaderActions variant="luxe" />
          </div>
        </div>
        <div className="relative hidden border-t border-line lg:block">
          <div className="container-x flex justify-center">
            <MegaNav
              items={menu}
              variant="luxe"
              className="static"
              linkClass="h-12 px-5 text-[11px] uppercase tracking-[0.3em] text-muted hover:text-fg"
              activeClass="text-fg after:absolute after:inset-x-5 after:bottom-0 after:h-px after:bg-primary"
            />
          </div>
        </div>
      </StickyHeader>
    </>
  );
}

/** Outlet: sarı kampanya bandı, logo + geniş arama + etiketli ikonlar, altta kategori satırı. */
export function OutletHeader({ site, menu }: Props) {
  return (
    <>
      <AnnouncementBar messages={site.settings.announcements} variant="outlet" className="bg-accent text-[13px] font-bold text-black" />
      <StickyHeader className="border-b border-line">
        <div className="container-x flex h-16 items-center gap-4 lg:h-[76px] lg:gap-8">
          <MenuButton className="-ml-2 hidden md:grid lg:hidden" />
          <Logo site={site} size="sm" />
          <div className="hidden flex-1 md:block">
            <SearchTrigger variant="outlet" className="!rounded-full" />
          </div>
          <div className="ml-auto md:ml-0">
            <div className="lg:hidden">
              <HeaderActions variant="outlet" />
            </div>
            <div className="hidden lg:block">
              <HeaderActions variant="outlet" labels />
            </div>
          </div>
        </div>
        <div className="px-4 pb-3 md:hidden">
          <SearchTrigger variant="outlet" className="!h-10 !rounded-full !border" />
        </div>
        <div className="relative hidden lg:block">
          <div className="container-x flex items-center">
            <MegaNav
              items={menu}
              variant="outlet"
              className="static"
              linkClass="h-11 px-3.5 text-[14px] font-medium hover:text-primary"
              activeClass="text-primary after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:rounded-full after:bg-primary"
            />
            <Link href="/indirim" className="ml-auto rounded-full bg-sale px-4 py-1.5 text-[13px] font-bold text-white">
              Süper Fırsatlar
            </Link>
          </div>
        </div>
      </StickyHeader>
      <MobileTabBar />
    </>
  );
}

export const HEADERS = {
  urban: UrbanHeader,
  arena: ArenaHeader,
  neon: NeonHeader,
  studio: StudioHeader,
  pulse: PulseHeader,
  volt: VoltHeader,
  metro: MetroHeader,
  brut: BrutHeader,
  luxe: LuxeHeader,
  outlet: OutletHeader,
} satisfies Record<import("./registry").ThemeKey, (p: Props) => React.ReactNode>;
