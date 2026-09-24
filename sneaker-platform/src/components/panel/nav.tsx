"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { clsx } from "clsx";
import {
  Building2,
  FileText,
  Globe,
  LayoutDashboard,
  Library,
  LogOut,
  Mail,
  Menu,
  Package,
  Palette,
  Plug,
  Receipt,
  Settings,
  Ticket,
  Users,
  X,
} from "lucide-react";

type Item = { href: string; label: string; icon: React.ComponentType<{ size?: number }> };

const MERCHANT: { title: string; items: Item[] }[] = [
  {
    title: "Mağaza",
    items: [
      { href: "/panel", label: "Genel Bakış", icon: LayoutDashboard },
      { href: "/panel/siteler", label: "Sitelerim", icon: Globe },
      { href: "/panel/urunler", label: "Ürünlerim", icon: Package },
      { href: "/panel/katalog", label: "Katalog Havuzu", icon: Library },
      { href: "/panel/siparisler", label: "Siparişler", icon: Receipt },
      { href: "/panel/musteriler", label: "Müşteriler", icon: Users },
      { href: "/panel/kuponlar", label: "Kuponlar", icon: Ticket },
      { href: "/panel/mesajlar", label: "Mesajlar", icon: Mail },
    ],
  },
  {
    title: "Ayarlar",
    items: [
      { href: "/panel/shopier", label: "Shopier Bağlantısı", icon: Plug },
      { href: "/panel/temalar", label: "Temalar", icon: Palette },
      { href: "/panel/hesap", label: "Hesap ve Paket", icon: Settings },
    ],
  },
];

const PLATFORM: { title: string; items: Item[] }[] = [
  {
    title: "Platform",
    items: [
      { href: "/panel", label: "Genel Bakış", icon: LayoutDashboard },
      { href: "/panel/saticilar", label: "Satıcılar", icon: Building2 },
      { href: "/panel/havuz", label: "Katalog Havuzu", icon: Library },
      { href: "/panel/siteler", label: "Tüm Siteler", icon: Globe },
      { href: "/panel/siparisler", label: "Tüm Siparişler", icon: Receipt },
      { href: "/panel/platform-ayarlari", label: "Platform Ayarları", icon: Settings },
    ],
  },
  {
    title: "Demo Satıcı Görünümü",
    items: [
      { href: "/panel/urunler", label: "Ürünler", icon: Package },
      { href: "/panel/shopier", label: "Shopier", icon: Plug },
      { href: "/panel/temalar", label: "Temalar", icon: Palette },
      { href: "/panel/mesajlar", label: "Mesajlar", icon: FileText },
    ],
  },
];

export function PanelNav({ isPlatform, userName, accountName, planName, logout }: { isPlatform: boolean; userName: string; accountName: string; planName: string; logout: () => Promise<void> }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const groups = isPlatform ? PLATFORM : MERCHANT;
  const active = (href: string) => (href === "/panel" ? pathname === "/panel" : pathname.startsWith(href));

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-5">
        <Link href="/panel" className="text-lg font-black tracking-tight text-white">
          SNEAKER<span className="text-orange-500">OS</span>
        </Link>
        <button type="button" className="text-zinc-400 lg:hidden" onClick={() => setOpen(false)} aria-label="Menüyü kapat">
          <X size={20} />
        </button>
      </div>
      <div className="mx-4 mb-4 rounded-lg bg-white/5 px-3 py-2.5">
        <p className="truncate text-sm font-semibold text-white">{accountName}</p>
        <p className="text-xs text-zinc-400">{planName}</p>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
        {groups.map((g) => (
          <div key={g.title}>
            <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{g.title}</p>
            <ul className="space-y-0.5">
              {g.items.map(({ href, label, icon: Icon }) => (
                <li key={href + label}>
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    className={clsx(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      active(href) ? "bg-white text-zinc-900" : "text-zinc-300 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    <Icon size={17} /> {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-4">
        <p className="truncate text-sm text-white">{userName}</p>
        <form action={logout}>
          <button type="submit" className="mt-2 flex items-center gap-2 text-xs text-zinc-400 hover:text-white">
            <LogOut size={14} /> Çıkış yap
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 lg:hidden">
        <button type="button" onClick={() => setOpen(true)} aria-label="Menüyü aç">
          <Menu size={22} />
        </button>
        <span className="font-black tracking-tight">
          SNEAKER<span className="text-orange-500">OS</span>
        </span>
        <span className="w-6" />
      </div>
      <aside className="sticky top-0 hidden h-screen bg-zinc-950 lg:block">{content}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-zinc-950">{content}</aside>
        </div>
      )}
    </>
  );
}
