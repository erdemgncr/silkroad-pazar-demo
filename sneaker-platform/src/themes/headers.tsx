import Link from "next/link";
import { Headset, MapPin, Truck } from "lucide-react";
import type { SiteContext } from "@/lib/site";
import type { MenuItem } from "@/lib/store-types";
import { Logo } from "@/components/store/logo";
import { AnnouncementBar, HeaderActions, MegaNav, MenuButton, SearchTrigger, StickyHeader } from "@/components/store/header-parts";

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
