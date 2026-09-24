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
  LayoutDashboard,
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
  ShoppingBag,
  Ticket,
  Users,
  X,
} from "lucide-react";
import { markAllNotificationsRead, markNotificationRead, switchMerchant } from "@/lib/actions/panel-common";

type Item = { href: string; label: string; icon: React.ComponentType<{ size?: number; className?: string }>; badge?: number };
type Group = { title: string; items: Item[] };

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

function NotificationBell({ items, unread }: { items: ShellNotification[]; unread: number }) {
  const [open, setOpen] = useState(false);
  const [, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  useOutside(ref, () => setOpen(false), open);
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)} aria-label={`Bildirimler, ${unread} okunmamış`} className="relative grid h-10 w-10 place-items-center rounded-lg hover:bg-zinc-100">
        <Bell size={20} />
        {unread > 0 && <span className="absolute right-1.5 top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">{unread > 99 ? "99+" : unread}</span>}
      </button>
      {open && (
        <div className="fixed inset-x-3 top-16 z-50 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[380px]">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
            <p className="font-semibold">Bildirimler</p>
            {unread > 0 && (
              <button type="button" onClick={() => start(() => markAllNotificationsRead())} className="text-xs font-semibold text-zinc-500 hover:text-zinc-900">
                Tümünü okundu say
              </button>
            )}
          </div>
          <ul className="max-h-[60vh] divide-y divide-zinc-100 overflow-y-auto">
            {items.length === 0 && <li className="px-4 py-10 text-center text-sm text-zinc-500">Henüz bildirim yok.</li>}
            {items.map((n) => {
              const inner = (
                <div className="flex gap-3 px-4 py-3">
                  <span className={clsx("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.read ? "bg-zinc-200" : (TYPE_DOT[n.type] ?? "bg-zinc-400"))} />
                  <div className="min-w-0 flex-1">
                    <p className={clsx("text-sm", !n.read && "font-semibold")}>{n.title}</p>
                    {n.body && <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500">{n.body}</p>}
                    <p className="mt-1 text-[11px] text-zinc-400">{timeAgo(n.at)}</p>
                  </div>
                </div>
              );
              return (
                <li key={n.id} className={clsx(!n.read && "bg-orange-50/40")}>
                  {n.link ? (
                    <Link
                      href={n.link}
                      onClick={() => {
                        setOpen(false);
                        if (!n.read) start(() => markNotificationRead(n.id));
                      }}
                      className="block hover:bg-zinc-50"
                    >
                      {inner}
                    </Link>
                  ) : (
                    <button type="button" className="block w-full text-left hover:bg-zinc-50" onClick={() => !n.read && start(() => markNotificationRead(n.id))}>
                      {inner}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          <Link href="/panel/bildirimler" onClick={() => setOpen(false)} className="block border-t border-zinc-100 px-4 py-3 text-center text-sm font-semibold hover:bg-zinc-50">
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
    <label className="inline-flex max-w-full min-w-0 items-center gap-2 rounded-lg border border-zinc-200 bg-white py-1 pl-3 pr-1 text-sm">
      <Building2 size={16} className="shrink-0 text-zinc-400" />
      <span className="hidden shrink-0 text-xs text-zinc-500 md:inline">Satıcı:</span>
      <select
        value={current ?? merchants[0].id}
        disabled={pending}
        onChange={(e) => start(() => switchMerchant(Number(e.target.value)))}
        className="h-8 min-w-0 max-w-[180px] truncate bg-transparent pr-1 font-semibold outline-none md:max-w-[240px]"
        aria-label="İşlem yapılan satıcı"
      >
        {merchants.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function UserMenu({ name, email, logout }: { name: string; email: string; logout: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutside(ref, () => setOpen(false), open);
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)} className="flex h-10 items-center gap-2 rounded-lg px-2 hover:bg-zinc-100">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-zinc-900 text-xs font-bold text-white">{name.slice(0, 1).toUpperCase()}</span>
        <span className="hidden max-w-[140px] truncate text-sm font-medium md:block">{name}</span>
        <ChevronDown size={15} className="hidden text-zinc-400 md:block" />
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-50 w-60 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-2xl">
          <div className="border-b border-zinc-100 px-4 py-3">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="truncate text-xs text-zinc-500">{email}</p>
          </div>
          <Link href="/panel/hesap" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-zinc-50">
            <CircleUser size={16} /> Hesabım
          </Link>
          <Link href="/panel/bildirimler" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-zinc-50">
            <Bell size={16} /> Bildirimler
          </Link>
          <form action={logout}>
            <button type="submit" className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50">
              <LogOut size={16} /> Çıkış yap
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export function PanelShell(props: ShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { counts } = props;
  const merchantName = props.merchants.find((m) => m.id === props.currentMerchantId)?.name ?? props.merchants[0]?.name ?? "";

  const merchantItems: Item[] = [
    { href: "/panel/urunler", label: "Ürünler", icon: Package },
    { href: "/panel/katalog", label: "Katalogdan Ekle", icon: Library },
    { href: "/panel/kuponlar", label: "Kuponlar", icon: Ticket },
    { href: "/panel/shopier", label: "Shopier Bağlantısı", icon: Plug },
    { href: "/panel/temalar", label: "Temalar", icon: Palette },
  ];

  const groups: Group[] = props.isPlatform
    ? [
        {
          title: "Platform",
          items: [
            { href: "/panel", label: "Genel Bakış", icon: LayoutDashboard },
            { href: "/panel/saticilar", label: "Satıcılar", icon: Building2 },
            { href: "/panel/siteler", label: "Tüm Siteler", icon: Globe },
            { href: "/panel/siparisler", label: "Tüm Siparişler", icon: Receipt, badge: counts.pendingOrders },
            { href: "/panel/musteriler", label: "Müşteriler", icon: Users },
            { href: "/panel/mesajlar", label: "Mesajlar", icon: MessageSquare, badge: counts.unreadMessages },
            { href: "/panel/havuz", label: "Katalog Havuzu", icon: Library },
            { href: "/panel/bildirimler", label: "Bildirim & E-posta", icon: Mail, badge: counts.unreadNotifications },
            { href: "/panel/platform-ayarlari", label: "Platform Ayarları", icon: Settings },
          ],
        },
        { title: `Satıcı adına: ${merchantName}`, items: [...merchantItems, { href: "/panel/hesap", label: "Satıcı Hesabı", icon: CircleUser }] },
      ]
    : [
        {
          title: "Mağaza",
          items: [
            { href: "/panel", label: "Genel Bakış", icon: LayoutDashboard },
            { href: "/panel/siteler", label: "Sitelerim", icon: Globe },
            { href: "/panel/siparisler", label: "Siparişler", icon: Receipt, badge: counts.pendingOrders },
            { href: "/panel/urunler", label: "Ürünlerim", icon: Package },
            { href: "/panel/katalog", label: "Katalog Havuzu", icon: Library },
            { href: "/panel/musteriler", label: "Müşteriler", icon: Users },
            { href: "/panel/kuponlar", label: "Kuponlar", icon: Ticket },
            { href: "/panel/mesajlar", label: "Mesajlar", icon: MessageSquare, badge: counts.unreadMessages },
          ],
        },
        {
          title: "Ayarlar",
          items: [
            { href: "/panel/shopier", label: "Shopier Bağlantısı", icon: Plug },
            { href: "/panel/temalar", label: "Temalar", icon: Palette },
            { href: "/panel/bildirimler", label: "Bildirimler", icon: Bell, badge: counts.unreadNotifications },
            { href: "/panel/hesap", label: "Hesap ve Paket", icon: Settings },
          ],
        },
      ];

  const active = (href: string) => (href === "/panel" ? pathname === "/panel" : pathname === href || pathname.startsWith(`${href}/`));

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <Link href="/panel" className="text-lg font-black tracking-tight text-white">
          SNEAKER<span className="text-orange-500">OS</span>
        </Link>
        <button type="button" className="text-zinc-400 lg:hidden" onClick={() => setOpen(false)} aria-label="Menüyü kapat">
          <X size={20} />
        </button>
      </div>
      <div className="mx-4 mb-4 rounded-lg bg-white/5 px-3 py-2.5">
        <p className="truncate text-sm font-semibold text-white">{props.accountName}</p>
        <p className="text-xs text-zinc-400">{props.planName}</p>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
        {groups.map((g) => (
          <div key={g.title}>
            <p className="truncate px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{g.title}</p>
            <ul className="space-y-0.5">
              {g.items.map(({ href, label, icon: Icon, badge }) => (
                <li key={href + label}>
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    className={clsx(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      active(href) ? "bg-white font-semibold text-zinc-900" : "text-zinc-300 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    <Icon size={17} />
                    <span className="flex-1 truncate">{label}</span>
                    {badge ? <span className={clsx("rounded-full px-1.5 py-0.5 text-[10px] font-bold", active(href) ? "bg-zinc-900 text-white" : "bg-orange-500 text-white")}>{badge > 99 ? "99+" : badge}</span> : null}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-4">
        <a href="https://www.shopier.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white">
          <ShoppingBag size={14} /> Shopier paneline git
        </a>
      </div>
    </div>
  );

  return (
    <div className="panel-root min-h-screen bg-zinc-50 font-sans text-zinc-900 lg:grid lg:grid-cols-[256px_1fr]">
      <aside className="sticky top-0 hidden h-screen bg-zinc-950 lg:block">{sidebar}</aside>
      <div
        className={clsx("fixed inset-0 z-50 bg-black/50 transition-opacity lg:hidden", open ? "opacity-100" : "pointer-events-none opacity-0")}
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <aside className={clsx("fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-zinc-950 transition-transform lg:hidden", open ? "translate-x-0" : "invisible -translate-x-full")} aria-hidden={!open}>
        {sidebar}
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-2 px-3 md:px-8">
            <button type="button" onClick={() => setOpen(true)} aria-label="Menüyü aç" className="grid h-10 w-10 place-items-center rounded-lg hover:bg-zinc-100 lg:hidden">
              <Menu size={22} />
            </button>
            <Link href="/panel" className="font-black tracking-tight lg:hidden">
              S<span className="text-orange-500">OS</span>
            </Link>
            <div className="ml-1 min-w-0 flex-1 lg:ml-0">
              {props.isPlatform ? <MerchantSwitcher merchants={props.merchants} current={props.currentMerchantId} /> : <p className="hidden truncate text-sm text-zinc-500 md:block">{props.accountName}</p>}
            </div>
            <NotificationBell items={props.notifications} unread={counts.unreadNotifications} />
            <UserMenu name={props.userName} email={props.userEmail} logout={props.logout} />
          </div>
        </header>
        {props.alert && (
          <Link href={props.alert.href} className={clsx("block px-4 py-2.5 text-center text-sm font-medium md:px-8", props.alert.tone === "red" ? "bg-rose-600 text-white" : "bg-amber-100 text-amber-900")}>
            {props.alert.text} <span className="underline">Paketini seç →</span>
          </Link>
        )}
        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-8">{props.children}</main>
      </div>
    </div>
  );
}
