import type { Metadata } from "next";
import Link from "next/link";
import { clsx } from "clsx";
import { styleOf } from "@/themes/registry";
import { requireSiteWithCatalog } from "@/lib/store-context";
import { toCards } from "@/lib/store-data";
import { Breadcrumbs } from "@/components/store/breadcrumbs";
import { Countdown } from "@/components/store/interactive";
import { formatDate, formatPrice } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/s/[site]/yakinda">): Promise<Metadata> {
  const { site } = await requireSiteWithCatalog(params);
  return {
    title: "Drop Takvimi - Yakında Çıkacak Sneaker Modelleri",
    description: `${site.name} drop takvimi: çıkış tarihi yaklaşan sneaker modelleri, geri sayım ve "gelince haber ver" listesi.`,
    alternates: { canonical: "/yakinda" },
  };
}

export default async function UpcomingPage({ params }: PageProps<"/s/[site]/yakinda">) {
  const { site, all } = await requireSiteWithCatalog(params);
  const upcoming = toCards(
    all.filter((p) => p.releaseDate && p.releaseDate > new Date()).sort((a, b) => +a.releaseDate! - +b.releaseDate!),
    all,
  );
  const v = styleOf(site.theme);
  return (
    <div className="container-x py-8 md:py-10">
      <Breadcrumbs
        items={[
          { label: "Ana Sayfa", href: "/" },
          { label: "Drop Takvimi", href: "/yakinda" },
        ]}
      />
      <h1 className="h-display mt-4 font-heading text-4xl font-bold md:text-6xl">Drop Takvimi</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">
        Çıkış tarihi yaklaşan modelleri buradan takip edebilirsin. Ürün sayfasındaki &quot;Gelince Haber Ver&quot; ile satışa açıldığı an e-posta al.
      </p>
      {upcoming.length === 0 ? (
        <p className="mt-10 rounded-theme-lg bg-soft p-10 text-center text-muted">Şu an takvimde yeni bir çıkış yok. Yeni drop&apos;lar için bültene kaydolabilirsin.</p>
      ) : (
        <div className="mt-10 space-y-5">
          {upcoming.map((p) => (
            <Link
              key={p.id}
              href={`/urun/${p.slug}`}
              className={clsx("group grid gap-5 border border-line p-4 transition-colors hover:border-fg md:grid-cols-[220px_1fr_auto] md:items-center md:p-5", v === "pulse" || v === "arena" ? "rounded-theme-lg" : "")}
            >
              <div className="aspect-square overflow-hidden bg-soft">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt={p.imageAlt} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div>
                <p className={clsx("text-xs font-bold uppercase tracking-[0.25em]", v === "neon" ? "text-primary" : "text-accent")}>{formatDate(p.releaseDate!)}</p>
                <p className="mt-2 font-heading text-2xl font-bold md:text-3xl">
                  {p.brand} {p.model}
                </p>
                <p className="text-muted">{p.colorName}</p>
                <p className="mt-2 font-semibold">{formatPrice(p.price)}</p>
              </div>
              <div className="md:text-right">
                <Countdown to={p.releaseDate!} />
                <span className="mt-4 inline-block rounded-theme bg-primary px-5 py-2.5 text-sm font-semibold text-primary-fg">Gelince Haber Ver</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
