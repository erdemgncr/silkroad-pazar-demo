import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq, lte } from "drizzle-orm";
import { clsx } from "clsx";
import { styleOf } from "@/themes/registry";
import { db, schema } from "@/db";
import { requireSite } from "@/lib/store-context";
import { Breadcrumbs } from "@/components/store/breadcrumbs";
import { formatDate } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/s/[site]/blog">): Promise<Metadata> {
  const site = await requireSite(params);
  return {
    title: "Blog - Sneaker Rehberi, Bakım ve Stil Önerileri",
    description: `${site.name} blog: sneaker bakım rehberleri, beden seçimi, trendler ve kombin önerileri.`,
    alternates: { canonical: "/blog" },
  };
}

export default async function BlogIndex({ params }: PageProps<"/s/[site]/blog">) {
  const site = await requireSite(params);
  const posts = await db
    .select()
    .from(schema.blogPosts)
    .where(and(eq(schema.blogPosts.siteId, site.id), eq(schema.blogPosts.status, "published"), lte(schema.blogPosts.publishedAt, new Date())))
    .orderBy(desc(schema.blogPosts.publishedAt));
  const [first, ...rest] = posts;
  const v = styleOf(site.theme);
  return (
    <div className="container-x py-8 md:py-10">
      <Breadcrumbs
        items={[
          { label: "Ana Sayfa", href: "/" },
          { label: "Blog", href: "/blog" },
        ]}
      />
      <h1 className="h-display mt-4 font-heading text-3xl font-bold md:text-5xl">{v === "studio" ? "Dergi" : "Blog & Rehber"}</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">Sneaker bakımı, doğru beden seçimi, sezon trendleri ve kombin önerileri.</p>
      {!first ? (
        <p className="mt-10 rounded-theme-lg bg-soft p-10 text-center text-muted">Henüz yazı yok.</p>
      ) : (
        <>
          <Link href={`/blog/${first.slug}`} className={clsx("group mt-8 grid overflow-hidden border border-line md:grid-cols-2", v === "pulse" || v === "arena" ? "rounded-theme-lg" : "")}>
            <div className="aspect-[16/10] overflow-hidden bg-soft md:aspect-auto">
              {first.cover && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={first.cover} alt={first.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              )}
            </div>
            <div className="flex flex-col justify-center gap-3 p-6 md:p-10">
              <p className="text-xs text-muted">{formatDate(first.publishedAt)}</p>
              <h2 className="font-heading text-2xl font-bold leading-tight group-hover:underline md:text-3xl">{first.title}</h2>
              <p className="text-muted">{first.excerpt}</p>
              <span className="text-sm font-semibold underline underline-offset-4">Devamını oku</span>
            </div>
          </Link>
          <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((p) => (
              <Link key={p.id} href={`/blog/${p.slug}`} className="group">
                <div className={clsx("aspect-[16/10] overflow-hidden bg-soft", v === "pulse" || v === "arena" ? "rounded-theme-lg" : "")}>
                  {p.cover && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.cover} alt={p.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  )}
                </div>
                <p className="mt-3 text-xs text-muted">{formatDate(p.publishedAt)}</p>
                <h2 className="mt-1 font-heading text-lg font-bold leading-snug group-hover:underline">{p.title}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{p.excerpt}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
