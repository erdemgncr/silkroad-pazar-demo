import Link from "next/link";
import { clsx } from "clsx";
import { LogOut, MapPin, Package, User, UserRound } from "lucide-react";
import { logoutCustomer } from "@/lib/actions/account";
import { Breadcrumbs } from "../breadcrumbs";

const ITEMS = [
  { href: "/hesabim", label: "Hesap Özeti", icon: UserRound },
  { href: "/hesabim/siparisler", label: "Siparişlerim", icon: Package },
  { href: "/hesabim/adresler", label: "Adreslerim", icon: MapPin },
  { href: "/hesabim/bilgiler", label: "Üyelik Bilgilerim", icon: User },
];

export function AccountShell({ active, title, name, children }: { active: string; title: string; name: string; children: React.ReactNode }) {
  return (
    <div className="container-x py-8 md:py-10">
      <Breadcrumbs
        items={[
          { label: "Ana Sayfa", href: "/" },
          { label: "Hesabım", href: "/hesabim" },
          ...(active !== "/hesabim" ? [{ label: title, href: active }] : []),
        ]}
      />
      <div className="mt-6 grid gap-8 lg:grid-cols-[250px_1fr]">
        <aside>
          <div className="rounded-theme-lg bg-soft p-5">
            <p className="text-xs text-muted">Merhaba,</p>
            <p className="font-heading text-lg font-bold">{name}</p>
          </div>
          <nav className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:gap-1 lg:px-0" aria-label="Hesap menüsü">
            {ITEMS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={active === href ? "page" : undefined}
                className={clsx(
                  "flex shrink-0 items-center gap-2.5 rounded-theme px-3 py-2.5 text-sm transition-colors",
                  active === href ? "bg-fg font-semibold text-bg" : "border border-line hover:bg-soft lg:border-0",
                )}
              >
                <Icon size={17} /> {label}
              </Link>
            ))}
            <form action={logoutCustomer} className="shrink-0">
              <button type="submit" className="flex items-center gap-2.5 rounded-theme px-3 py-2.5 text-sm text-muted hover:text-sale">
                <LogOut size={17} /> Çıkış Yap
              </button>
            </form>
          </nav>
        </aside>
        <section className="min-w-0">
          <h1 className="mb-6 font-heading text-2xl font-bold md:text-3xl">{title}</h1>
          {children}
        </section>
      </div>
    </div>
  );
}
