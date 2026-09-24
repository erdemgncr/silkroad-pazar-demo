import Link from "next/link";
import { clsx } from "clsx";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import type { SiteContext } from "@/lib/site";
import { NewsletterForm } from "./newsletter-form";
import { PaymentIcons, SOCIAL_ICONS, SvgIcon } from "./brand-icons";
import { Logo } from "./logo";

const COLUMNS: { title: string; links: [string, string][] }[] = [
  {
    title: "Kurumsal",
    links: [
      ["Hakkımızda", "/hakkimizda"],
      ["İletişim", "/iletisim"],
      ["Markalar", "/markalar"],
      ["Kampanyalar", "/kampanyalar"],
      ["Blog", "/blog"],
    ],
  },
  {
    title: "Müşteri Hizmetleri",
    links: [
      ["Sıkça Sorulan Sorular", "/sss"],
      ["Sipariş Takibi", "/siparis-takip"],
      ["Kargo ve Teslimat", "/kargo-ve-teslimat"],
      ["İade ve Değişim", "/iade-ve-degisim"],
      ["Beden Rehberi", "/beden-rehberi"],
      ["Güvenli Alışveriş", "/guvenli-alisveris"],
    ],
  },
  {
    title: "Kategoriler",
    links: [
      ["Erkek", "/erkek"],
      ["Kadın", "/kadin"],
      ["Çocuk", "/cocuk"],
      ["Sneaker", "/sneaker"],
      ["Yeni Gelenler", "/yeni-gelenler"],
      ["İndirimli Ürünler", "/indirim"],
    ],
  },
  {
    title: "Sözleşmeler",
    links: [
      ["Mesafeli Satış Sözleşmesi", "/mesafeli-satis-sozlesmesi"],
      ["Ön Bilgilendirme Formu", "/on-bilgilendirme-formu"],
      ["KVKK Aydınlatma Metni", "/kvkk-aydinlatma-metni"],
      ["Gizlilik Politikası", "/gizlilik-politikasi"],
      ["Çerez Politikası", "/cerez-politikasi"],
      ["Üyelik Sözleşmesi", "/uyelik-sozlesmesi"],
    ],
  },
];

export function Footer({ site }: { site: SiteContext }) {
  const theme = site.theme;
  // Yeni temalar, alt bilgi düzenini en yakın temel temadan devralır.
  const t = ({ volt: "urban", metro: "arena", brut: "urban", luxe: "neon", outlet: "arena" } as Record<string, string>)[theme] ?? theme;
  const s = site.settings;
  const dark = t === "urban" || t === "neon";
  const wrap: Record<string, string> = {
    urban: theme === "brut" ? "bg-[#0a0a0a] text-white border-t-2 border-fg" : "bg-black text-white",
    neon: theme === "luxe" ? "bg-[#070707] text-white border-t border-line" : "bg-[#050505] text-white border-t border-line",
    arena: theme === "metro" ? "bg-soft text-fg border-t border-line" : "bg-soft text-fg",
    studio: "bg-soft text-fg border-t border-line",
    pulse: "bg-[#0f172a] text-white",
  };
  const mutedCls = dark || t === "pulse" ? "text-white/60" : "text-muted";
  const socials = Object.entries(s.social).filter(([, v]) => v);
  const year = new Date().getFullYear();

  return (
    <footer className={clsx(wrap[t])}>
      {/* Bülten bandı */}
      <div
        className={clsx(
          theme === "brut" ? "border-b-2 border-fg bg-accent text-black" : theme === "metro" ? "bg-accent text-white" : t === "pulse" || t === "arena" ? "bg-primary text-primary-fg" : "",
          theme !== "brut" && "border-b",
          dark || t === "pulse" ? "border-white/10" : "border-line",
        )}
      >
        <div className="container-x grid gap-6 py-10 md:grid-cols-2 md:items-center md:py-12">
          <div>
            <p className={clsx("font-heading font-bold h-display", t === "studio" ? "text-3xl" : t === "neon" ? "text-4xl" : "text-2xl md:text-3xl")}>
              {t === "studio" ? "Bültene katılın" : "İlk sen haberdar ol"}
            </p>
            <p className={clsx("mt-2 max-w-md text-sm", dark || t === "pulse" || t === "arena" || theme === "brut" ? "text-current opacity-75" : "text-muted")}>
              Yeni gelen modeller, özel indirimler ve drop tarihleri e-posta kutunda. Üyelere özel kampanyaları kaçırma.
            </p>
          </div>
          <NewsletterForm variant={(dark || t === "pulse" || t === "arena") && theme !== "brut" ? "dark" : "light"} rounded={t === "pulse" ? "rounded-full" : t === "arena" ? "rounded-lg" : ""} />
        </div>
      </div>

      <div className="container-x grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <div className={clsx(theme === "neon" && "[&_span]:!text-primary")}>
            <Logo site={site} />
          </div>
          <p className={clsx("mt-4 max-w-sm text-sm leading-relaxed", mutedCls)}>{s.footerText}</p>
          <ul className={clsx("mt-5 space-y-2 text-sm", mutedCls)}>
            {s.contact.phone && (
              <li className="flex items-center gap-2">
                <Phone size={15} /> <a href={`tel:${s.contact.phone.replace(/\s/g, "")}`}>{s.contact.phone}</a>
              </li>
            )}
            {s.contact.email && (
              <li className="flex items-center gap-2">
                <Mail size={15} /> <a href={`mailto:${s.contact.email}`}>{s.contact.email}</a>
              </li>
            )}
            {s.contact.address && (
              <li className="flex items-start gap-2">
                <MapPin size={15} className="mt-0.5 shrink-0" /> {s.contact.address}, {s.contact.district} / {s.contact.city}
              </li>
            )}
            {s.contact.workingHours && (
              <li className="flex items-center gap-2">
                <Clock size={15} /> {s.contact.workingHours}
              </li>
            )}
          </ul>
          {socials.length > 0 && (
            <div className="mt-5 flex gap-2">
              {socials.map(([k, v]) => (
                <a
                  key={k}
                  href={v}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={k}
                  className={clsx("grid h-10 w-10 place-items-center rounded-full transition-colors", dark || t === "pulse" ? "bg-white/10 hover:bg-white/20" : "bg-bg hover:bg-line")}
                >
                  <SvgIcon icon={SOCIAL_ICONS[k as keyof typeof SOCIAL_ICONS]} size={16} />
                </a>
              ))}
            </div>
          )}
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className={clsx("mb-4 text-sm font-bold", t === "studio" && "font-heading text-base font-normal", t === "neon" && "uppercase tracking-[0.2em] text-primary text-xs")}>{col.title}</p>
            <ul className="space-y-2.5">
              {col.links.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className={clsx("text-sm transition-colors", mutedCls, dark || t === "pulse" ? "hover:text-white" : "hover:text-fg")}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      {(theme === "neon" || theme === "volt") && (
        <div className="container-x overflow-hidden">
          <p className="select-none whitespace-nowrap font-heading text-[18vw] uppercase leading-[0.8] text-white/[0.04]" aria-hidden>
            {site.settings.logoText || site.name}
          </p>
        </div>
      )}

      <div className={clsx("border-t", dark || t === "pulse" ? "border-white/10" : "border-line")}>
        <div className="container-x flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
          <div className={clsx("text-xs leading-relaxed", mutedCls)}>
            <p>
              © {year} {(s.company.legalName || site.name).replace(/\.$/, "")}. Tüm hakları saklıdır.
            </p>
            <p className="mt-1">
              Ürün markaları ve logoları ilgili hak sahiplerine aittir. Tüm ürünler orijinal ve faturalıdır.
            </p>
          </div>
          <PaymentIcons className="flex flex-wrap items-center gap-2" />
        </div>
      </div>
    </footer>
  );
}
