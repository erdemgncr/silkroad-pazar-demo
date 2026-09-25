"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { clsx } from "clsx";
import {
  Bell,
  Building2,
  ChevronDown,
  CircleUser,
  Globe,
  LayoutGrid,
  Library,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  Package,
  Palette,
  Plug,
  Receipt,
  Settings,
  ShieldCheck,
  Ticket,
  Users,
  X,
} from "lucide-react";
import { markAllNotificationsRead, markNotificationRead, switchMerchant } from "@/lib/actions/panel-common";

type Icon = React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
type Tab = { href: string; label: string; badge?: number };
type SheetItem = { href: string; label: string; desc: string; icon: Icon; badge?: number };

export type ShellNotification = { id: number; type: string; title: string; body: string; link: string | null; read: boolean; at: string };

export type ShellProps = {
  isPlatform: boolean;
  userName: string;
  userEmail: string;
  accountName: string;
  planName: string;
  merchants: { id: number; name: string }[];
  currentMerchantId: number | null;
  counts: { pendingOrders: number; unreadMessages: number; unreadNotifications: number };
  notifications: ShellNotification[];
  logout: () => Promise<void>;
  /** Abonelik/deneme uyarısı (üstte şerit olarak gösterilir). */
  alert?: { text: string; href: string; tone: "amber" | "red" } | null;
  children: React.ReactNode;
};

const TYPE_DOT: Record<string, string> = {
  order: "bg-emerald-500",
  message: "bg-sky-500",
  stock: "bg-amber-500",
  sync: "bg-rose-500",
  merchant: "bg-violet-500",
  system: "bg-zinc-400",
};

function timeAgo(iso: string) {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "az önce";
  if (s < 3600) return `${Math.floor(s / 60)} dk önce`;
  if (s < 86400) return `${Math.floor(s / 3600)} sa önce`;
  return `${Math.floor(s / 86400)} gün önce`;
}

function useOutside(ref: React.RefObject<HTMLElement | null>, onOut: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const on = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOut();
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onOut();
    document.addEventListener("mousedown", on);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", on);
      document.removeEventListener("keydown", esc);
    };
  }, [ref, onOut, active]);
}

/** SneakerOS yazı logosu. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={clsx("font-[800] tracking-[-0.045em]", className)}>
      Sneaker<span className="text-zinc-400">OS</span>
    </span>
  );
}

function NotificationBell({ items, unread }: { items: ShellNotification[]; unread: number }) {
  const [open, setOpen] = useState(false);
  const [, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  useOutside(ref, () => setOpen(false), open);
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)} aria-label={`Bildirimler, ${unread} okunmamış`} className="relative grid h-10 w-10 place-items-center rounded-full border border-black/5 bg-white/60 hover:bg-white">
        <Bell size={18} strokeWidth={1.8} />
        {unread > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-zinc-900 px-1 text-[10px] font-bold text-white">{unread > 99 ? "99+" : unread}</span>}
      </button>
      {open && (
        <div className="glass-strong fixed inset-x-3 top-[68px] z-50 overflow-hidden rounded-3xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[380px]">
          <div className="flex items-center justify-between px-5 py-4">
            <p className="font-semibold">Bildirimler</p>
            {unread > 0 && (
              <button type="button" onClick={() => start(() => markAllNotificationsRead())} className="text-xs font-semibold text-zinc-500 hover:text-zinc-900">
                Tümünü okundu say
              </button>
            )}
          </div>
          <ul className="max-h-[60vh] divide-y divide-black/5 overflow-y-auto border-y border-black/5">
            {items.length === 0 && <li className="px-5 py-10 text-center text-sm text-zinc-500">Henüz bildirim yok.</li>}
            {items.map((n) => {
              const inner = (
                <div className="flex gap-3 px-5 py-3">
                  <span className={clsx("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.read ? "bg-zinc-200" : (TYPE_DOT[n.type] ?? "bg-zinc-400"))} />
                  <div className="min-w-0 flex-1">
                    <p className={clsx("text-sm", !n.read && "font-semibold")}>{n.title}</p>
                    {n.body && <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500">{n.body}</p>}
                    <p className="mt-1 text-[11px] text-zinc-400">{timeAgo(n.at)}</p>
                  </div>
                </div>
              );
              return (
                <li key={n.id}>
                  {n.link ? (
                    <Link
                      href={n.link}
                      onClick={() => {
                        setOpen(false);
                        if (!n.read) start(() => markNotificationRead(n.id));
                      }}
                      className="block hover:bg-white/70"
                    >
                      {inner}
                    </Link>
                  ) : (
                    <button type="button" className="block w-full text-left hover:bg-white/70" onClick={() => !n.read && start(() => markNotificationRead(n.id))}>
                      {inner}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          <Link href="/panel/bildirimler" onClick={() => setOpen(false)} className="block px-5 py-3.5 text-center text-sm font-semibold hover:bg-white/70">
            Tüm bildirimler ve e-posta kayıtları
          </Link>
        </div>
      )}
    </div>
  );
}

function MerchantSwitcher({ merchants, current }: { merchants: { id: number; name: string }[]; current: number | null }) {
  const [pending, start] = useTransition();
  if (!merchants.length) return null;
  return (
    <label className="relative block rounded-2xl border border-black/10 bg-white/70 px-4 py-3">
      <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Satıcı adına yönet</span>
      <select
        value={current ?? merchants[0].id}
        disabled={pending}
        onChange={(e) => start(() => switchMerchant(Number(e.target.value)))}
        className="mt-0.5 w-full appearance-none pr-6 text-[15px] font-semibold outline-none"
        style={{ backgroundColor: "transparent" }}
        aria-label="İşlem yapılan satıcı"
      >
        {merchants.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute bottom-4 right-4 text-zinc-400" />
    </label>
  );
}

function ProfileSheet({ open, onClose, props, groups }: { open: boolean; onClose: () => void; props: ShellProps; groups: { title?: string; list: SheetItem[] }[] }) {
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.documentElement.style.overflow = "";
    };
  }, [open, onClose]);
  return (
    <>
      <div className={clsx("fixed inset-0 z-[60] bg-zinc-900/10 backdrop-blur-[2px] transition-opacity", open ? "opacity-100" : "pointer-events-none opacity-0")} onClick={onClose} aria-hidden />
      <aside
        className={clsx(
          "glass-strong fixed inset-y-0 right-0 z-[61] flex w-full max-w-[420px] flex-col transition-transform duration-300 ease-out sm:rounded-l-[28px]",
          open ? "translate-x-0" : "invisible translate-x-full",
        )}
        aria-hidden={!open}
        aria-label="Hesap menüsü"
      >
        <div className="flex items-center gap-3 border-b border-black/5 px-6 py-5">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-black/10 bg-white">
            <CircleUser size={22} strokeWidth={1.5} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{props.userName}</p>
            <p className="truncate text-sm text-zinc-500">{props.userEmail}</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full hover:bg-black/5" aria-label="Kapat">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="px-2">
            {props.isPlatform ? (
              <MerchantSwitcher merchants={props.merchants} current={props.currentMerchantId} />
            ) : (
              <Link href="/panel/hesap" onClick={onClose} className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white/70 px-4 py-3">
                <span className="orb h-9 w-9 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Mağaza</span>
                  <span className="block truncate text-[15px] font-semibold">{props.accountName}</span>
                  <span className="block text-xs text-zinc-500">{props.planName}</span>
                </span>
              </Link>
            )}
          </div>
          {groups.map((g, gi) => (
            <div key={gi} className="mt-4">
              {g.title && <p className="px-4 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">{g.title}</p>}
              <ul className="divide-y divide-black/5">
                {g.list.map(({ href, label, desc, icon: I, badge }) => (
                  <li key={href + label}>
                    <Link href={href} onClick={onClose} className="flex items-start gap-4 rounded-2xl px-4 py-3.5 hover:bg-white/80">
                      <I size={19} strokeWidth={1.6} className="mt-0.5 shrink-0 text-zinc-700" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2 font-semibold">
                          {label}
                          {badge ? <span className="rounded-full bg-zinc-900 px-1.5 py-0.5 text-[10px] font-bold text-white">{badge > 99 ? "99+" : badge}</span> : null}
                        </span>
                        <span className="block text-sm text-zinc-500">{desc}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-black/5 p-5">
          <form action={props.logout}>
            <button type="submit" className="flex h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-zinc-900 font-semibold transition-colors hover:bg-zinc-900 hover:text-white">
              <LogOut size={17} /> Çıkış yap
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}

function BottomItem({ href, label, icon: I, badge, active }: { href: string; label: string; icon: Icon; badge?: number; active: boolean }) {
  return (
    <li>
      <Link href={href} className={clsx("relative flex flex-col items-center gap-1 py-2 text-[11px] font-medium", active ? "text-zinc-900" : "text-zinc-500")}>
        <I size={21} strokeWidth={active ? 2.2 : 1.7} />
        {label}
        {badge ? <span className="absolute right-[22%] top-1 grid h-4 min-w-4 place-items-center rounded-full bg-zinc-900 px-1 text-[9px] font-bold text-white">{badge > 99 ? "99+" : badge}</span> : null}
      </Link>
    </li>
  );
}

export function PanelShell(props: ShellProps) {
  const pathname = usePathname();
  const [sheet, setSheet] = useState(false);
  const { counts } = props;
  const firstName = props.userName.split(" ")[0];

  const tabs: Tab[] = props.isPlatform
    ? [
        { href: "/panel", label: "Özet" },
        { href: "/panel/ozellestir", label: "Özelleştir" },
        { href: "/panel/saticilar", label: "Satıcılar" },
        { href: "/panel/siteler", label: "Siteler" },
        { href: "/panel/siparisler", label: "Siparişler", badge: counts.pendingOrders },
        { href: "/panel/musteriler", label: "Müşteriler" },
        { href: "/panel/urunler", label: "Ürünler" },
        { href: "/panel/havuz", label: "Havuz" },
      ]
    : [
        { href: "/panel", label: "Özet" },
        { href: "/panel/ozellestir", label: "Özelleştir" },
        { href: "/panel/siteler", label: "Sitelerim" },
        { href: "/panel/urunler", label: "Ürünler" },
        { href: "/panel/katalog", label: "Katalog" },
        { href: "/panel/siparisler", label: "Siparişler", badge: counts.pendingOrders },
        { href: "/panel/musteriler", label: "Müşteriler" },
      ];

  const groups: { title?: string; list: SheetItem[] }[] = props.isPlatform
    ? [
        {
          title: "Platform",
          list: [
            { href: "/panel/platform-ayarlari", label: "Yönetim paneli", desc: "Genel ayarlar, SMTP, yapay zeka ve ödemeler", icon: ShieldCheck },
            { href: "/panel/saticilar", label: "Satıcılar", desc: "Paketler, limitler, faturalar", icon: Building2 },
            { href: "/panel/mesajlar", label: "Mesajlar", desc: "İletişim formu, bülten ve stok talepleri", icon: MessageSquare, badge: counts.unreadMessages },
            { href: "/panel/bildirimler", label: "Bildirimler", desc: "Bildirimler ve e-posta kayıtları", icon: Mail, badge: counts.unreadNotifications },
          ],
        },
        {
          title: "Seçili satıcı adına",
          list: [
            { href: "/panel/katalog", label: "Katalogdan ekle", desc: "Havuzdan hazır ürün seç", icon: Library },
            { href: "/panel/temalar", label: "Temalar", desc: "10 mağaza tasarımı", icon: Palette },
            { href: "/panel/kuponlar", label: "Kuponlar", desc: "İndirim kodları", icon: Ticket },
            { href: "/panel/shopier", label: "Shopier bağlantısı", desc: "Ödeme, ürün ve sipariş senkronu", icon: Plug },
            { href: "/panel/hesap", label: "Satıcı hesabı", desc: "Paket, firma bilgileri, ekip", icon: Settings },
          ],
        },
      ]
    : [
        {
          list: [
            { href: "/panel/hesap", label: "Ayarlar", desc: "Hesap, güvenlik, paket ve faturalar", icon: Settings },
            { href: "/panel/temalar", label: "Temalar", desc: "10 mağaza tasarımı, önizle ve uygula", icon: Palette },
            { href: "/panel/shopier", label: "Shopier bağlantısı", desc: "Ödeme, ürün ve sipariş senkronu", icon: Plug },
            { href: "/panel/kuponlar", label: "Kuponlar", desc: "İndirim kodları ve kampanyalar", icon: Ticket },
            { href: "/panel/mesajlar", label: "Mesajlar", desc: "İletişim formu, bülten ve stok talepleri", icon: MessageSquare, badge: counts.unreadMessages },
            { href: "/panel/hesap?sekme=ekip", label: "Ekip", desc: "Ekip üyeleri ve yetkiler", icon: Users },
            { href: "/panel/siteler", label: "Alan adları", desc: "Sitelerin kendi alan adında açılsın", icon: Globe },
            { href: "/panel/bildirimler", label: "Bildirimler", desc: "Bildirim tercihleri ve e-posta kayıtları", icon: Bell, badge: counts.unreadNotifications },
          ],
        },
      ];

  const isActive = (href: string) => (href === "/panel" ? pathname === "/panel" : pathname === href || pathname.startsWith(`${href}/`));

  const bottom: { href: string; label: string; icon: Icon; badge?: number }[] = [
    { href: "/panel", label: "Özet", icon: LayoutGrid },
    props.isPlatform ? { href: "/panel/saticilar", label: "Satıcılar", icon: Building2 } : { href: "/panel/urunler", label: "Ürünler", icon: Package },
    { href: "/panel/siparisler", label: "Siparişler", icon: Receipt, badge: counts.pendingOrders },
  ];

  return (
    <div className="panel-root min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/60 bg-white/55 backdrop-blur-2xl backdrop-saturate-150">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 md:px-8">
          <Link href="/panel" className="shrink-0 text-[22px]">
            <Wordmark />
          </Link>
          <nav className="no-scrollbar ml-4 hidden min-w-0 flex-1 overflow-x-auto lg:block" aria-label="Panel">
            <ul className="flex h-16 items-stretch gap-1">
              {tabs.map((t) => {
                const on = isActive(t.href);
                return (
                  <li key={t.href}>
                    <Link
                      href={t.href}
                      aria-current={on ? "page" : undefined}
                      className={clsx("relative flex h-full items-center gap-1.5 whitespace-nowrap px-3 text-[15px] transition-colors", on ? "font-semibold text-zinc-900" : "text-zinc-500 hover:text-zinc-900")}
                    >
                      {t.label}
                      {t.badge ? <span className="rounded-full bg-zinc-900 px-1.5 py-0.5 text-[10px] font-bold text-white">{t.badge > 99 ? "99+" : t.badge}</span> : null}
                      {on && (
                        <svg className="absolute -bottom-px left-1/2 -translate-x-1/2" width="30" height="10" viewBox="0 0 30 10" aria-hidden>
                          <path d="M0 10 L15 1 L30 10" fill="#f6f7f9" stroke="rgba(15,17,26,0.14)" strokeWidth="1" />
                        </svg>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <NotificationBell items={props.notifications} unread={counts.unreadNotifications} />
            <button type="button" onClick={() => setSheet(true)} className="flex items-center gap-3 rounded-full p-1 hover:bg-white/60 md:pl-3" aria-label="Hesap menüsü">
              <span className="hidden text-right leading-tight md:block">
                <span className="block text-sm font-semibold">Merhaba, {firstName}</span>
                <span className="block max-w-[220px] truncate text-xs text-zinc-500">
                  {props.accountName} · {props.isPlatform ? "Süper admin" : "Sahip"}
                </span>
              </span>
              <span className="grid h-10 w-10 place-items-center rounded-full border border-black/10 bg-white/80">
                <CircleUser size={19} strokeWidth={1.6} />
              </span>
              <ChevronDown size={16} className="hidden text-zinc-500 md:block" />
            </button>
          </div>
        </div>
      </header>

      {props.alert && (
        <div className="mx-auto max-w-[1440px] px-4 pt-4 md:px-8">
          <Link href={props.alert.href} className={clsx("glass flex flex-wrap items-center justify-between gap-2 rounded-2xl px-5 py-3 text-sm", props.alert.tone === "red" ? "text-rose-700" : "text-amber-800")}>
            <span className="font-medium">{props.alert.text}</span>
            <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white">Paketini seç</span>
          </Link>
        </div>
      )}

      <main className="mx-auto w-full max-w-[1440px] px-4 pb-32 pt-6 md:px-8 md:pt-8 lg:pb-12">{props.children}</main>

      {/* Mobil: uygulama hissiyatında alt sekme çubuğu, ortada yapay zeka küresi */}
      <nav className="fixed inset-x-3 bottom-3 z-40 lg:hidden" aria-label="Hızlı menü" style={{ marginBottom: "env(safe-area-inset-bottom)" }}>
        <ul className="glass-strong grid h-[68px] grid-cols-5 items-center rounded-[26px] px-1">
          <BottomItem {...bottom[0]} active={isActive(bottom[0].href)} />
          <BottomItem {...bottom[1]} active={isActive(bottom[1].href)} />
          <li className="grid place-items-center">
            <Link href="/panel/ozellestir" aria-label="Yapay zeka ile yönet" className="orb-halo relative -mt-8 grid place-items-center">
              <span className={clsx("orb block h-14 w-14", isActive("/panel/ozellestir") && "ring-4 ring-white")} />
            </Link>
          </li>
          <BottomItem {...bottom[2]} active={isActive(bottom[2].href)} />
          <li>
            <button type="button" onClick={() => setSheet(true)} className="flex w-full flex-col items-center gap-1 py-2 text-[11px] font-medium text-zinc-500">
              <Menu size={21} strokeWidth={1.7} />
              Menü
            </button>
          </li>
        </ul>
      </nav>

      <ProfileSheet open={sheet} onClose={() => setSheet(false)} props={props} groups={groups} />
    </div>
  );
}
