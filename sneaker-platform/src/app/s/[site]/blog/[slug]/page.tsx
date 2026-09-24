import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq, ne } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireSiteWithCatalog, indexable } from "@/lib/store-context";
import { Breadcrumbs } from "@/components/store/breadcrumbs";
import { RichText } from "@/components/store/rich-text";
import { JsonLd } from "@/components/store/json-ld";
import { ProductRail } from "@/components/store/sections";
import { abs, breadcrumbLd } from "@/lib/seo/schema-org";
import { formatDate } from "@/lib/format";
import { pickHome } from "@/lib/catalog";
import { toCards } from "@/lib/store-data";

async function load(props: PageProps<"/s/[site]/blog/[slug]">) {
  const { slug } = await props.params;
  const { site, all } = await requireSiteWithCatalog(props.params);
  const post = await db.query.blogPosts.findFirst({ where: and(eq(schema.blogPosts.siteId, site.id), eq(schema.blogPosts.slug, slug), eq(schema.blogPosts.status, "published")) });
  if (!post) notFound();
  return { site, all, post };
}

export async function generateMetadata(props: PageProps<"/s/[site]/blog/[slug]">): Promise<Metadata> {
  const { site, post } = await load(props);
  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.excerpt;
  return {
    title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    robots: indexable(site) ? undefined : { index: false, follow: false },
    openGraph: { type: "article", title, description, url: `/blog/${post.slug}`, publishedTime: post.publishedAt.toISOString(), images: post.cover ? [post.cover] : undefined },
  };
}

export default async function BlogPostPage(props: PageProps<"/s/[site]/blog/[slug]">) {
  const { site, all, post } = await load(props);
  const others = await db
    .select()
    .from(schema.blogPosts)
    .where(and(eq(schema.blogPosts.siteId, site.id), eq(schema.blogPosts.status, "published"), ne(schema.blogPosts.id, post.id)))
    .orderBy(desc(schema.blogPosts.publishedAt))
    .limit(3);
  const crumbs = [
    { label: "Ana Sayfa", href: "/" },
    { label: "Blog", href: "/blog" },
    { label: post.title, href: `/blog/${post.slug}` },
  ];
  const words = post.content.split(/\s+/).length;
  return (
    <>
      <article className="container-x py-8 md:py-10">
        <Breadcrumbs items={crumbs} />
        <header className="mx-auto mt-6 max-w-3xl text-center">
          <p className="text-sm text-muted">
            {formatDate(post.publishedAt)} · {Math.max(2, Math.round(words / 200))} dk okuma
          </p>
          <h1 className="h-display mt-3 font-heading text-3xl font-bold leading-tight md:text-5xl">{post.title}</h1>
          <p className="mt-4 text-muted">{post.excerpt}</p>
        </header>
        {post.cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.cover} alt={post.title} className="mx-auto mt-8 aspect-[16/8] w-full max-w-5xl rounded-theme-lg object-cover" />
        )}
        <div className="mx-auto mt-10 max-w-3xl">
          <RichText source={post.content} />
        </div>
      </article>
      <ProductRail title="Yazıda Bahsi Geçen Modeller" items={toCards(pickHome(all).bestSellers, all)} variant={site.theme} href="/cok-satanlar" />
      {others.length > 0 && (
        <section className="container-x pb-14">
          <h2 className="mb-6 font-heading text-2xl font-bold">Diğer Yazılar</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {others.map((p) => (
              <Link key={p.id} href={`/blog/${p.slug}`} className="group">
                <div className="aspect-[16/10] overflow-hidden rounded-theme bg-soft">
                  {p.cover && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.cover} alt={p.title} loading="lazy" className="h-full w-full object-cover" />
                  )}
                </div>
                <h3 className="mt-3 font-semibold leading-snug group-hover:underline">{p.title}</h3>
              </Link>
            ))}
          </div>
        </section>
      )}
      <JsonLd
        data={[
          breadcrumbLd(site, crumbs),
          {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.excerpt,
            image: post.cover ?? undefined,
            datePublished: post.publishedAt.toISOString(),
            dateModified: post.updatedAt.toISOString(),
            inLanguage: "tr-TR",
            mainEntityOfPage: abs(site, `/blog/${post.slug}`),
            author: { "@type": "Organization", name: site.name, url: site.baseUrl },
            publisher: { "@id": `${site.baseUrl}/#organization` },
          },
        ]}
      />
    </>
  );
}
