import type { SiteContext } from "@/lib/site";
import type { CatalogProduct, Crumb } from "@/lib/catalog";
import { CATEGORY_BY_KEY, GENDER_LABEL } from "@/lib/taxonomy";

export function abs(site: SiteContext, path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${site.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export function organizationLd(site: SiteContext) {
  const s = site.settings;
  const sameAs = Object.values(s.social).filter(Boolean);
  const hasAddress = Boolean(s.contact.address && s.contact.city);
  return {
    "@context": "https://schema.org",
    "@type": hasAddress ? "Store" : "OnlineStore",
    "@id": `${site.baseUrl}/#organization`,
    name: site.name,
    legalName: s.company.legalName || undefined,
    url: site.baseUrl,
    logo: s.logoUrl ? abs(site, s.logoUrl) : `${site.baseUrl}/icon`,
    image: s.logoUrl ? abs(site, s.logoUrl) : `${site.baseUrl}/icon`,
    description: s.seo.homeDescription || s.footerText,
    email: s.contact.email || undefined,
    telephone: s.contact.phone || undefined,
    sameAs: sameAs.length ? sameAs : undefined,
    currenciesAccepted: "TRY",
    paymentAccepted: "Kredi Kartı, Banka Kartı",
    areaServed: { "@type": "Country", name: "Türkiye" },
    address: hasAddress
      ? {
          "@type": "PostalAddress",
          streetAddress: s.contact.address,
          addressLocality: s.contact.district || s.contact.city,
          addressRegion: s.contact.city,
          postalCode: s.contact.postcode || undefined,
          addressCountry: "TR",
        }
      : undefined,
    openingHours: hasAddress ? "Mo-Fr 09:00-18:00" : undefined,
    contactPoint: s.contact.phone
      ? {
          "@type": "ContactPoint",
          telephone: s.contact.phone,
          contactType: "customer service",
          areaServed: "TR",
          availableLanguage: ["Turkish"],
        }
      : undefined,
  };
}

export function websiteLd(site: SiteContext) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${site.baseUrl}/#website`,
    url: site.baseUrl,
    name: site.name,
    inLanguage: "tr-TR",
    publisher: { "@id": `${site.baseUrl}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${site.baseUrl}/arama?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbLd(site: SiteContext, crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.label, item: abs(site, c.href) })),
  };
}

export function itemListLd(site: SiteContext, name: string, items: CatalogProduct[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: abs(site, `/urun/${p.slug}`), name: `${p.title} ${p.colorName}` })),
  };
}

export function faqLd(faq: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

export function productLd(site: SiteContext, p: CatalogProduct, copy: { h1: string; metaDescription: string }, siblings: CatalogProduct[]) {
  const s = site.settings;
  const url = abs(site, `/urun/${p.slug}`);
  const priceValidUntil = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);
  const shipping = {
    "@type": "OfferShippingDetails",
    shippingRate: { "@type": "MonetaryAmount", value: p.price >= s.shipping.freeShippingThreshold * 100 ? 0 : s.shipping.fee, currency: "TRY" },
    shippingDestination: { "@type": "DefinedRegion", addressCountry: "TR" },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 2, unitCode: "DAY" },
      transitTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 3, unitCode: "DAY" },
    },
  };
  const returnPolicy = {
    "@type": "MerchantReturnPolicy",
    applicableCountry: "TR",
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: s.shipping.returnDays,
    returnMethod: "https://schema.org/ReturnByMail",
    returnFees: "https://schema.org/FreeReturn",
  };
  const offerFor = (x: CatalogProduct) => ({
    "@type": "Offer",
    url: abs(site, `/urun/${x.slug}`),
    priceCurrency: "TRY",
    price: (x.price / 100).toFixed(2),
    priceValidUntil,
    itemCondition: "https://schema.org/NewCondition",
    availability: x.releaseDate && x.releaseDate > new Date() ? "https://schema.org/PreOrder" : x.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    seller: { "@id": `${site.baseUrl}/#organization` },
    shippingDetails: shipping,
    hasMerchantReturnPolicy: returnPolicy,
  });

  const base = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: copy.h1,
    description: copy.metaDescription,
    url,
    sku: p.sku,
    mpn: p.sku,
    image: p.images.map((i) => i.url),
    brand: { "@type": "Brand", name: p.brand },
    color: p.colorName,
    material: p.material ?? undefined,
    category: CATEGORY_BY_KEY[p.category]?.label,
    audience: p.gender === "unisex" ? undefined : { "@type": "PeopleAudience", suggestedGender: p.gender === "erkek" ? "male" : p.gender === "kadin" ? "female" : "unisex" },
    size: p.sizes.join(", "),
    offers: offerFor(p),
  };
  if (siblings.length > 1) {
    return {
      ...base,
      "@type": "ProductGroup",
      productGroupID: p.seriesSlug,
      variesBy: ["https://schema.org/color", "https://schema.org/size"],
      hasVariant: siblings.map((x) => ({
        "@type": "Product",
        name: `${x.title} ${GENDER_LABEL[x.gender]} ${x.colorName}`,
        sku: x.sku,
        color: x.colorName,
        image: x.images[0]?.url,
        offers: offerFor(x),
      })),
      offers: undefined,
    };
  }
  return base;
}
