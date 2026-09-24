import Link from "next/link";
import { clsx } from "clsx";
import { ChevronDown, Clock, Mail, MapPin, MessageCircle, Phone, Ticket } from "lucide-react";
import type { SiteContext } from "@/lib/site";
import { FAQ_GROUPS, STATIC_PAGES, fillVars, pageVars, type StaticPageDef } from "@/lib/content/pages";
import { Breadcrumbs } from "./breadcrumbs";
import { RichText } from "./rich-text";
import { ContactForm } from "./contact-form";
import { JsonLd } from "./json-ld";
import { breadcrumbLd, faqLd } from "@/lib/seo/schema-org";
import { formatDate, formatPrice } from "@/lib/format";

const GROUP_LABEL = { kurumsal: "Kurumsal", yardim: "Yardım", yasal: "Sözleşmeler" } as const;

export type CouponInfo = { code: string; type: "percent" | "fixed"; value: number; minTotal: number; endsAt: Date | null };

export function StaticPageView({
  site,
  page,
  override,
  coupons = [],
}: {
  site: SiteContext;
  page: StaticPageDef;
  override?: { title: string | null; content: string | null } | null;
  coupons?: CouponInfo[];
}) {
  const v = pageVars(site);
  const title = override?.title || page.title;
  const body = fillVars(override?.content || page.body, v);
  const crumbs = [
    { label: "Ana Sayfa", href: "/" },
    { label: title, href: `/${page.slug}` },
  ];
  const faq = FAQ_GROUPS.flatMap((g) => g.items.map((i) => ({ q: fillVars(i.q, v), a: fillVars(i.a, v) })));
  const s = site.settings;

  return (
    <div className="container-x py-8 md:py-10">
      <Breadcrumbs items={crumbs} />
      <div className="mt-6 grid gap-10 lg:grid-cols-[240px_1fr] lg:gap-14">
        <aside className="order-2 lg:order-1">
          <nav aria-label="Yardım menüsü" className="lg:sticky lg:top-28">
            {(["kurumsal", "yardim", "yasal"] as const).map((g) => (
              <div key={g} className="mb-6">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">{GROUP_LABEL[g]}</p>
                <ul className="space-y-1">
                  {STATIC_PAGES.filter((p) => p.group === g).map((p) => (
                    <li key={p.slug}>
                      <Link
                        href={`/${p.slug}`}
                        aria-current={p.slug === page.slug ? "page" : undefined}
                        className={clsx("block rounded-theme px-3 py-2 text-sm transition-colors", p.slug === page.slug ? "bg-fg font-semibold text-bg" : "hover:bg-soft")}
                      >
                        {p.title}
                      </Link>
                    </li>
                  ))}
                  {g === "yardim" && (
                    <li>
                      <Link href="/siparis-takip" className="block rounded-theme px-3 py-2 text-sm hover:bg-soft">
                        Sipariş Takibi
                      </Link>
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        <article className="order-1 min-w-0 lg:order-2">
          <h1 className="h-display font-heading text-3xl font-bold md:text-5xl">{title}</h1>
          <div className="mt-6 max-w-3xl">
            <RichText source={body} />
          </div>

          {page.kind === "contact" && (
            <div className="mt-8 grid gap-10 xl:grid-cols-[1fr_360px]">
              <div>
                <h2 className="mb-5 font-heading text-xl font-bold">Bize Yazın</h2>
                <ContactForm />
              </div>
              <div className="space-y-3">
                {[
                  { icon: Phone, label: "Telefon", value: s.contact.phone, href: `tel:${s.contact.phone.replace(/\s/g, "")}` },
                  { icon: Mail, label: "E-posta", value: s.contact.email, href: `mailto:${s.contact.email}` },
                  { icon: MessageCircle, label: "WhatsApp", value: s.contact.whatsapp ? "WhatsApp'tan yazın" : "", href: `https://wa.me/${s.contact.whatsapp}` },
                  { icon: MapPin, label: "Adres", value: [s.contact.address, s.contact.district, s.contact.city].filter(Boolean).join(", "), href: "" },
                  { icon: Clock, label: "Çalışma Saatleri", value: s.contact.workingHours, href: "" },
                ]
                  .filter((x) => x.value)
                  .map(({ icon: Icon, label, value, href }) => (
                    <div key={label} className="flex gap-3 rounded-theme-lg border border-line p-4">
                      <Icon size={20} className="mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted">{label}</p>
                        {href ? (
                          <a href={href} className="text-sm font-semibold hover:underline" target={href.startsWith("https") ? "_blank" : undefined} rel="noopener noreferrer">
                            {value}
                          </a>
                        ) : (
                          <p className="text-sm font-semibold">{value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                <div className="rounded-theme-lg bg-soft p-4 text-xs leading-relaxed text-muted">
                  <p className="font-semibold text-fg">{s.company.legalName}</p>
                  <p>{s.company.address}</p>
                  <p>
                    {s.company.taxOffice} · VKN {s.company.taxNumber}
                  </p>
                  <p>MERSİS: {s.company.mersisNo}</p>
                </div>
              </div>
              {s.contact.mapEmbedUrl && (
                <iframe
                  title="Harita"
                  src={s.contact.mapEmbedUrl}
                  className="h-80 w-full rounded-theme-lg border-0 xl:col-span-2"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              )}
            </div>
          )}

          {page.kind === "faq" && (
            <div className="mt-8 max-w-3xl space-y-10">
              {FAQ_GROUPS.map((g) => (
                <section key={g.title}>
                  <h2 className="mb-3 font-heading text-xl font-bold">{g.title}</h2>
                  <div className="divide-y divide-line border-y border-line">
                    {g.items.map((i) => (
                      <details key={i.q} className="group py-4">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold">
                          {fillVars(i.q, v)}
                          <ChevronDown size={18} className="shrink-0 transition-transform group-open:rotate-180" />
                        </summary>
                        <RichText source={fillVars(i.a, v)} className="prose-store mt-3 text-sm" />
                      </details>
                    ))}
                  </div>
                </section>
              ))}
              <JsonLd data={faqLd(faq.map((f) => ({ q: f.q, a: f.a.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") })))} />
            </div>
          )}

          {page.kind === "campaigns" && (
            <div className="mt-8 space-y-8">
              <div className="grid gap-4 md:grid-cols-2">
                {[...s.heroSlides.map((h) => ({ title: h.title, subtitle: h.subtitle, href: h.href, cta: h.cta, image: h.image, bg: h.bg, fg: h.fg })), ...s.promoBanners].map((c, i) => (
                  <Link key={`${c.title}-${i}`} href={c.href} className="group relative flex min-h-56 flex-col justify-end overflow-hidden rounded-theme-lg p-6" style={{ background: c.bg, color: c.fg }}>
                    {c.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.image} alt={c.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-50 transition-transform duration-700 group-hover:scale-105" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="relative text-white">
                      <p className="font-heading text-2xl font-bold">{c.title}</p>
                      {c.subtitle && <p className="mt-1 text-sm opacity-85">{c.subtitle}</p>}
                      <span className="mt-3 inline-block text-sm font-semibold underline underline-offset-4">{c.cta}</span>
                    </div>
                  </Link>
                ))}
              </div>
              {coupons.length > 0 && (
                <section>
                  <h2 className="mb-4 font-heading text-xl font-bold">İndirim Kodları</h2>
                  <div className="grid gap-3 md:grid-cols-2">
                    {coupons.map((c) => (
                      <div key={c.code} className="flex items-center gap-4 rounded-theme-lg border-2 border-dashed border-line p-4">
                        <Ticket size={28} className="shrink-0 text-accent" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">{c.type === "percent" ? `%${c.value} indirim` : `${formatPrice(c.value)} indirim`}</p>
                          <p className="text-xs text-muted">
                            {c.minTotal > 0 ? `${formatPrice(c.minTotal)} ve üzeri alışverişlerde` : "Tüm alışverişlerde"}
                            {c.endsAt ? ` · Son gün: ${formatDate(c.endsAt)}` : ""}
                          </p>
                        </div>
                        <code className="rounded-theme bg-soft px-3 py-2 font-mono text-sm font-bold">{c.code}</code>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </article>
      </div>
      <JsonLd data={breadcrumbLd(site, crumbs)} />
    </div>
  );
}
