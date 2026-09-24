import { siAdidas, siAmericanexpress, siFacebook, siFila, siInstagram, siJordan, siMastercard, siNewbalance, siNike, siPuma, siReebok, siThenorthface, siTiktok, siUnderarmour, siVisa, siWhatsapp, siX, siYoutube } from "simple-icons";

type SimpleIcon = { path: string; title: string; hex: string };

export function SvgIcon({ icon, size = 18, className, title }: { icon: SimpleIcon; size?: number; className?: string; title?: string }) {
  return (
    <svg role="img" aria-label={title ?? icon.title} viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor">
      <path d={icon.path} />
    </svg>
  );
}

export const SOCIAL_ICONS = {
  instagram: siInstagram,
  tiktok: siTiktok,
  x: siX,
  facebook: siFacebook,
  youtube: siYoutube,
  whatsapp: siWhatsapp,
} as const;

const BRAND_LOGOS: Record<string, SimpleIcon> = {
  nike: siNike,
  adidas: siAdidas,
  puma: siPuma,
  "new-balance": siNewbalance,
  reebok: siReebok,
  jordan: siJordan,
  "under-armour": siUnderarmour,
  fila: siFila,
  "the-north-face": siThenorthface,
};

/** Marka logosu varsa SVG, yoksa şık bir yazı logosu gösterir. */
export function BrandMark({ slug, name, className, size = 44 }: { slug: string; name: string; className?: string; size?: number }) {
  const icon = BRAND_LOGOS[slug];
  if (icon) return <SvgIcon icon={icon} size={size} className={className} title={name} />;
  return (
    <span lang="en" className={className} style={{ fontSize: size * 0.42, lineHeight: 1 }}>
      <span className="font-heading font-extrabold uppercase tracking-tight">{name}</span>
    </span>
  );
}

export function PaymentIcons({ className }: { className?: string }) {
  return (
    <div className={className}>
      <span className="grid h-7 w-11 place-items-center rounded bg-white text-[#1a1f71] ring-1 ring-black/5">
        <SvgIcon icon={siVisa} size={28} />
      </span>
      <span className="grid h-7 w-11 place-items-center rounded bg-white text-[#eb001b] ring-1 ring-black/5">
        <SvgIcon icon={siMastercard} size={22} />
      </span>
      <span className="grid h-7 w-11 place-items-center rounded bg-white text-[#2e77bc] ring-1 ring-black/5">
        <SvgIcon icon={siAmericanexpress} size={22} />
      </span>
      <span className="grid h-7 w-11 place-items-center rounded bg-white text-[10px] font-black italic text-[#00a0e3] ring-1 ring-black/5">troy</span>
      <span className="grid h-7 place-items-center rounded bg-white px-2 text-[10px] font-extrabold text-[#6a1b9a] ring-1 ring-black/5">shopier</span>
    </div>
  );
}
