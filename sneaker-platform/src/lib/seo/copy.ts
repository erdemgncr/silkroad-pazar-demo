/**
 * Site bazlı benzersiz SEO metin motoru.
 *
 * Aynı ürün/kategori 20 farklı sitede yayınlandığında Google'ın "kopya içerik" olarak
 * değerlendirmemesi için başlık, meta açıklama, H1 ve açıklama metinleri her site için
 * farklı şablon kombinasyonlarıyla üretilir. Seçim, sitenin SEO tohumu (seed) ve ürün
 * kimliğine göre deterministiktir: aynı site her zaman aynı metni üretir.
 * Panelden girilen özel metinler her zaman önceliklidir.
 */
import type { Product } from "@/db/schema";
import { CATEGORY_BY_KEY, GENDER_LABEL, BRAND_BY_NAME } from "@/lib/taxonomy";
import { formatPrice, hashString, joinTr, seededRandom, trLower, truncate } from "@/lib/format";

export type CopySite = {
  name: string;
  settings: {
    seo: { seed: number; targetCity: string };
    shipping: { freeShippingThreshold: number; fee: number; carrier: string; dispatchDays: string; returnDays: number };
    installmentText: string;
  };
};

function picker(site: CopySite, key: string) {
  const rand = seededRandom(hashString(`${site.settings.seo.seed}:${key}`));
  return {
    pick<T>(arr: T[]): T {
      return arr[Math.floor(rand() * arr.length)];
    },
    shuffle<T>(arr: T[]): T[] {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
    chance(p: number) {
      return rand() < p;
    },
  };
}

function fill(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? "").replace(/\s{2,}/g, " ").trim();
}

function shippingLine(site: CopySite): string {
  const t = site.settings.shipping.freeShippingThreshold;
  return t > 0 ? `${formatPrice(t * 100).replace(",00", "")} üzeri ücretsiz kargo` : "Ücretsiz kargo";
}

function cityLine(site: CopySite): string {
  const c = site.settings.seo.targetCity;
  return c ? `${c} ve Türkiye'nin her yerine` : "Türkiye'nin her yerine";
}

const FIT_ADVICE: Record<string, string> = {
  nike: "Nike modelleri genel olarak standart kalıptadır. Geniş ayak yapısına sahipseniz yarım numara büyük tercih edebilirsiniz.",
  jordan: "Jordan modelleri standart kalıptadır; kalın çorapla kullanacaksanız yarım numara büyük seçmenizi öneririz.",
  adidas: "adidas terrace modelleri (Samba, Gazelle, Spezial) dar kalıplıdır; yarım numara büyük almanızı öneririz. Diğer modeller standart kalıptadır.",
  "new balance": "New Balance modelleri rahat ve standart kalıptadır; her zamanki numaranızı tercih edebilirsiniz.",
  puma: "Puma modelleri standart kalıptadır. Speedcat gibi ince profilli modellerde yarım numara büyük tercih edilebilir.",
  converse: "Converse modelleri büyük kalıptır; her zamanki numaranızdan yarım ya da bir numara küçük almanızı öneririz.",
  vans: "Vans modelleri standart kalıptadır; her zamanki numaranızı tercih edebilirsiniz.",
  asics: "Asics modelleri standart kalıptadır; koşu için kullanacaksanız yarım numara büyük tercih edilebilir.",
  reebok: "Reebok modelleri standart kalıptadır.",
  salomon: "Salomon modelleri oturaklı ve biraz dar kalıptadır; kalın çorapla kullanımda yarım numara büyük önerilir.",
  hoka: "Hoka modelleri standart kalıptadır ve geniş burun yapısı sunar.",
  skechers: "Skechers modelleri rahat ve standart kalıptadır.",
  timberland: "Timberland botlar büyük kalıptır; her zamanki numaranızdan yarım numara küçük almanızı öneririz.",
  "the north face": "The North Face montlar standart kalıptadır; üzerine kat giyecekseniz bir beden büyük tercih edebilirsiniz.",
};

export function fitAdvice(brand: string): string {
  return FIT_ADVICE[brand.toLowerCase()] ?? "Ürün standart kalıptadır; her zamanki bedeninizi tercih edebilirsiniz.";
}

type ProductLike = Pick<
  Product,
  "id" | "title" | "brand" | "model" | "colorName" | "gender" | "category" | "productType" | "price" | "compareAtPrice" | "description" | "material" | "variants" | "sku"
>;

export type ProductOverride = {
  title?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  description?: string | null;
};

export type ProductCopy = {
  h1: string;
  metaTitle: string;
  metaDescription: string;
  paragraphs: string[];
  highlights: { label: string; value: string }[];
  faq: { q: string; a: string }[];
  imageAlt: string;
};

export function productCopy(site: CopySite, p: ProductLike, override?: ProductOverride | null): ProductCopy {
  const r = picker(site, `p:${p.id}`);
  const cat = CATEGORY_BY_KEY[p.category];
  const genderWord = p.gender === "unisex" ? "" : GENDER_LABEL[p.gender];
  const catLabel = cat?.singular ?? "Ürün";
  const inStockSizes = p.variants.filter((v) => v.stock > 0).map((v) => v.size);
  const vars: Record<string, string> = {
    brand: p.brand,
    model: p.model,
    full: p.title,
    color: p.colorName,
    colorLower: trLower(p.colorName),
    gender: genderWord,
    genderLower: trLower(genderWord),
    cat: catLabel,
    catLower: trLower(catLabel),
    price: formatPrice(p.price),
    site: site.name,
    material: p.material ?? "",
    sizeCount: String(inStockSizes.length || p.variants.length),
    ship: shippingLine(site),
    city: cityLine(site),
    returnDays: String(site.settings.shipping.returnDays),
    installment: trLower(site.settings.installmentText),
    dispatch: site.settings.shipping.dispatchDays,
    carrier: site.settings.shipping.carrier,
  };

  const h1Tpl = r.pick([
    "{full} {gender} {cat} {color}",
    "{full} {color} {gender} {cat}",
    "{gender} {full} {color} {cat}",
    "{full} {gender} {color} {cat}",
  ]);
  const metaTitleTpl = r.pick([
    "{full} {gender} {cat} {color} Fiyatı",
    "{full} {color} - {gender} {cat} Modeli",
    "{gender} {full} {color} {cat} Satın Al",
    "{full} ({color}) {gender} {cat} Fiyatları",
    "{full} {gender} {color} {cat} | Orijinal",
  ]);
  const metaDescTpl = r.pick([
    "{full} {genderLower} {catLower} {colorLower} renk seçeneğiyle {site} güvencesinde. {ship}, {returnDays} gün içinde kolay iade ve {installment}.",
    "Orijinal {full} {color} şimdi {price}. {gender} {catLower} modelinde {sizeCount} beden seçeneği, hızlı kargo ve güvenli ödeme {site} mağazasında.",
    "{full} ({color}) {genderLower} {catLower} fiyatı ve beden seçenekleri. {dispatch} içinde kargoya teslim, {installment} ve kolay iade avantajıyla hemen sipariş ver.",
    "{price} fiyatla {full} {genderLower} {catLower}. {material}. Stoktaki bedenleri incele, {site} ile {city} güvenle satın al.",
    "{full} {color} {genderLower} {catLower} modelini {site} farkıyla keşfet: %100 orijinal ürün, {ship} ve {returnDays} gün içinde ücretsiz iade.",
  ]);

  const intro = r.pick([
    "{full}, {summary} {site} olarak bu modeli {colorLower} renk seçeneğiyle, orijinal ve faturalı şekilde sunuyoruz.",
    "{summary} {full} {colorLower} renk seçeneğiyle {genderLower} {catLower} koleksiyonumuzun öne çıkan parçalarından biri.",
    "{gender} {catLower} arayanların ilk tercihlerinden olan {full}, {colorLower} renk seçeneğiyle stoklarımızda. {summary}",
    "Stil ve konforu bir araya getiren {full} {colorLower} ile tanışın. {summary}",
  ]);
  const materialP = r.pick([
    "Üretimde {materialLower} kullanılır. Bu yapı, ürünün uzun ömürlü olmasını ve ilk günkü formunu korumasını sağlar.",
    "Modelin malzemesi {materialLower}. Günlük kullanımda dayanıklılık ve rahatlık bir arada.",
    "{material} yapısıyla hem hafif hem de dayanıklı bir kullanım sunar.",
  ]);
  const styleP =
    p.productType === "ayakkabi"
      ? r.pick([
          "Jean, kargo pantolon ya da eşofman altıyla kolayca kombinlenebilir. {colorLower} tonları sayesinde gardırobunuzdaki pek çok parçayla uyum sağlar.",
          "Hafta içi ofis sonrası buluşmalardan hafta sonu şehir turlarına kadar her ortama uyum sağlayan çok yönlü bir tasarım.",
          "Oversize tişört ve geniş paça pantolonlarla sokak stilini tamamlarken, sade kombinlerde de dikkat çeken bir detay olur.",
        ])
      : p.productType === "giyim"
        ? r.pick([
            "Sneaker'larınızla uyumlu, rahat kesimli bir parça arıyorsanız günlük stilin tamamlayıcısı olacak.",
            "Katmanlı kombinlerde de tek başına da şık duran, mevsim geçişlerinde sık tercih edilen bir model.",
          ])
        : r.pick([
            "Günlük kullanımda pratiklik sağlarken kombininize tamamlayıcı bir dokunuş katar.",
            "Sneaker stilinizi tamamlayan, her gün kullanabileceğiniz fonksiyonel bir aksesuar.",
          ]);
  const careP = r.pick([
    "Temizlik için yumuşak bir fırça ve nemli bez kullanmanızı, makinede yıkamamanızı öneririz. Ürünü doğrudan güneş ışığından uzakta kurutun.",
    "Uzun ömürlü kullanım için ürünü nemli bir bezle silin, ağır deterjanlardan kaçının ve serin bir ortamda muhafaza edin.",
    "Bakımda sert kimyasallardan kaçının. Süet ve nubuk yüzeylerde özel süet fırçası kullanmanız dokuyu korur.",
  ]);
  const shipP = r.pick([
    "Siparişiniz {dispatch} içinde {carrier} ile kargoya verilir. {ship} fırsatından yararlanabilir, {returnDays} gün içinde ücretsiz iade hakkını kullanabilirsiniz.",
    "{site} üzerinden verdiğiniz siparişler {city} {carrier} güvencesiyle ulaştırılır. Beden uymazsa {returnDays} gün içinde kolayca değişim yapabilirsiniz.",
  ]);

  const extra = {
    summary: p.description.trim().replace(/\s*$/, "").replace(/([^.!?])$/, "$1."),
    materialLower: trLower(p.material ?? ""),
  };
  const all = { ...vars, ...extra };

  const baseParas = [fill(intro, all), fill(materialP, all), fill(styleP, all)];
  const tail = [p.productType === "ayakkabi" || p.productType === "giyim" ? fitAdvice(p.brand) : "", fill(careP, all), fill(shipP, all)].filter(Boolean);
  const paragraphs = override?.description?.trim()
    ? override.description.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean)
    : [...(r.chance(0.5) ? baseParas : [baseParas[0], baseParas[2], baseParas[1]]), ...tail];

  const highlights = [
    { label: "Marka", value: p.brand },
    { label: "Model", value: p.model },
    { label: "Renk", value: p.colorName },
    { label: "Cinsiyet", value: GENDER_LABEL[p.gender] },
    { label: "Kategori", value: catLabel },
    { label: "Materyal", value: p.material ?? "-" },
    { label: "Ürün Kodu", value: p.sku },
  ];

  const faqPool = [
    { q: fill("{full} orijinal mi?", all), a: fill("Evet. {site} üzerinde satılan tüm ürünler %100 orijinal ve faturalıdır. Ürün, marka kutusu ve etiketleriyle birlikte gönderilir.", all) },
    { q: fill("{full} kalıbı nasıl?", all), a: fitAdvice(p.brand) },
    { q: "Siparişim ne zaman kargoya verilir?", a: fill("Siparişler {dispatch} içinde {carrier} ile kargoya teslim edilir. Kargo takip numarası e-posta ve SMS ile iletilir.", all) },
    { q: "Beden uymazsa değişim yapabilir miyim?", a: fill("Evet. Ürünü teslim aldığınız tarihten itibaren {returnDays} gün içinde kullanılmamış ve etiketi sökülmemiş şekilde iade edebilir ya da değişim talep edebilirsiniz.", all) },
    { q: "Taksit seçenekleri var mı?", a: fill("{installment}. Taksit seçenekleri ödeme adımında kartınıza göre listelenir.", all).replace(/^./, (c) => c.toLocaleUpperCase("tr-TR")) },
  ];
  const faq = p.productType === "aksesuar" ? [faqPool[0], faqPool[2], faqPool[3]] : r.shuffle(faqPool).slice(0, 4);

  return {
    h1: override?.title?.trim() || fill(h1Tpl, vars),
    metaTitle: override?.metaTitle?.trim() || truncate(fill(metaTitleTpl, vars), 70),
    metaDescription: override?.metaDescription?.trim() || truncate(fill(metaDescTpl, all), 160),
    paragraphs,
    highlights,
    faq,
    imageAlt: fill("{full} {gender} {color} {cat}", vars),
  };
}

/* ------------------------------------------------------------------ */
/* Koleksiyon / kategori / marka metinleri                            */
/* ------------------------------------------------------------------ */

export type ListingFacts = {
  label: string; // "Erkek Sneaker"
  count: number;
  minPrice: number;
  maxPrice: number;
  topBrands: string[];
  topModels: string[];
};

export type ListingCopy = {
  h1: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  content: { heading: string; body: string }[];
  faq: { q: string; a: string }[];
};

export type ListingOverride = {
  h1?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  intro?: string | null;
  content?: string | null;
};

export function listingCopy(site: CopySite, key: string, f: ListingFacts, override?: ListingOverride | null): ListingCopy {
  const r = picker(site, `l:${key}`);
  const brands = joinTr(f.topBrands.slice(0, 4));
  const models = joinTr(f.topModels.slice(0, 3));
  const vars: Record<string, string> = {
    label: f.label,
    labelLower: trLower(f.label),
    site: site.name,
    count: String(f.count),
    min: formatPrice(f.minPrice).replace(",00", ""),
    max: formatPrice(f.maxPrice).replace(",00", ""),
    brands,
    models,
    ship: shippingLine(site),
    city: cityLine(site),
    returnDays: String(site.settings.shipping.returnDays),
    installment: trLower(site.settings.installmentText),
  };
  const h1 = r.pick(["{label}", "{label} Modelleri", "{label} Modelleri ve Fiyatları", "{label} Koleksiyonu"]);
  const metaTitle = r.pick([
    "{label} Modelleri ve Fiyatları",
    "{label} Modelleri - En Yeni Sezon",
    "{label} Fiyatları ve Modelleri",
    "Orijinal {label} Modelleri",
    "{label} Modelleri ve Kampanyaları",
  ]);
  const metaDesc = r.pick([
    "{brands} ve daha fazlası: {count} farklı {labelLower} modeli {min} başlayan fiyatlarla {site} mağazasında. {ship}, kolay iade.",
    "En yeni {labelLower} modelleri {site} güvencesinde. {brands} gibi markalarda {count} ürün, {installment} ve {returnDays} gün iade.",
    "{labelLower} modellerini keşfet! {models} gibi popüler modeller {min} ile {max} arasında değişen fiyatlarla stokta. {ship}.",
    "Orijinal {labelLower} modelleri {site} farkıyla: {count} ürün, beden ve renk filtreleri, hızlı kargo ve güvenli ödeme.",
  ]);
  const intro = r.pick([
    "{label} kategorisinde {brands} gibi dünya markalarının en çok tercih edilen modellerini bir araya getirdik. {count} ürün arasından bedenine, rengine ve bütçene göre filtreleyerek sana en uygun modeli kolayca bulabilirsin.",
    "Sezonun en çok aranan {labelLower} modelleri burada. {models} gibi ikonik tasarımlar {min} başlayan fiyatlarla {site} güvencesiyle kapında.",
    "{site} {labelLower} koleksiyonu; {brands} gibi markaların orijinal ürünlerini {ship} ve kolay iade avantajıyla sunuyor. Yeni gelen modelleri kaçırmamak için sayfayı düzenli olarak takip et.",
  ]);

  const blocks = r.shuffle([
    {
      heading: fill(r.pick(["{label} Seçerken Nelere Dikkat Edilmeli?", "Doğru {label} Nasıl Seçilir?"]), vars),
      body: fill(
        r.pick([
          "Doğru modeli seçerken kullanım amacını, ayak yapını ve kalıp bilgisini dikkate almanı öneririz. Günlük kullanım için yastıklamalı ve esnek tabanlı modeller, şehir stili için ise sade ve kolay kombinlenebilen tasarımlar öne çıkar. Ürün sayfalarındaki kalıp önerileri ve beden tablosu doğru bedeni seçmene yardımcı olur.",
          "Bir {labelLower} modeli seçerken malzeme kalitesi, taban yapısı ve kalıp en önemli üç kriterdir. Deri ve süet sayalar daha uzun ömürlüdür; mesh sayalar ise nefes alabilirlik sağlar. Her ürün sayfasında kalıp önerisi ve detaylı ürün özellikleri yer alır.",
        ]),
        vars,
      ),
    },
    {
      heading: fill(r.pick(["Popüler {label} Modelleri", "En Çok Tercih Edilen {label} Modelleri"]), vars),
      body: fill(
        r.pick([
          "{models} bu kategoride en çok ilgi gören modeller arasında. {brands} markalarının yeni sezon ürünleri stoklarımıza düzenli olarak ekleniyor.",
          "Son dönemde {models} modelleri en çok satanlar listesinde üst sıralarda yer alıyor. Hem klasik hem de yeni sezon tasarımlarını tek sayfada karşılaştırabilirsin.",
        ]),
        vars,
      ),
    },
    {
      heading: fill(r.pick(["{label} Fiyatları", "{label} Fiyatları Ne Kadar?"]), vars),
      body: fill(
        r.pick([
          "Bu kategorideki ürünlerin fiyatları {min} ile {max} arasında değişiyor. İndirimli ürünleri görmek için sıralamayı fiyata göre değiştirebilir ya da indirim filtresini kullanabilirsin. {installment} imkânıyla bütçeni zorlamadan alışveriş yapabilirsin.",
          "{label} fiyatları modele, malzemeye ve koleksiyona göre {min} ile {max} arasında değişir. Kampanyalı ürünler kırmızı indirim etiketiyle işaretlenir.",
        ]),
        vars,
      ),
    },
    {
      heading: fill(r.pick(["Kargo, İade ve Değişim", "Güvenli Alışveriş"]), vars),
      body: fill(
        r.pick([
          "{site} üzerinden verdiğin siparişler {city} hızlıca ulaştırılır. {ship} fırsatı ve {returnDays} gün içinde kolay iade hakkıyla gönül rahatlığıyla alışveriş yapabilirsin.",
          "Tüm ürünler orijinal ve faturalıdır. Siparişin güvenli ödeme altyapısıyla alınır, {city} kargoyla gönderilir. Beden uymazsa {returnDays} gün içinde değişim yapabilirsin.",
        ]),
        vars,
      ),
    },
  ]);

  const faq = [
    { q: fill("{label} modelleri orijinal mi?", vars), a: fill("Evet, {site} üzerindeki tüm ürünler %100 orijinal ve faturalıdır.", vars) },
    { q: fill("{label} fiyatları ne kadar?", vars), a: fill("Bu kategoride fiyatlar {min} ile {max} arasında değişmektedir.", vars) },
    { q: "Kargo ücreti ne kadar?", a: fill("{ship}. Bu tutarın altındaki siparişlerde standart kargo ücreti uygulanır.", vars) },
  ];

  const overrideContent = override?.content?.trim()
    ? override.content
        .split(/\n{2,}/)
        .map((block) => {
          const [first, ...rest] = block.split("\n");
          return rest.length ? { heading: first.replace(/^#+\s*/, ""), body: rest.join(" ") } : { heading: "", body: first };
        })
    : null;

  return {
    h1: override?.h1?.trim() || fill(h1, vars),
    metaTitle: override?.metaTitle?.trim() || truncate(fill(metaTitle, vars), 70),
    metaDescription: override?.metaDescription?.trim() || truncate(fill(metaDesc, vars), 160),
    intro: override?.intro?.trim() || fill(intro, vars),
    content: overrideContent ?? blocks.slice(0, 3),
    faq,
  };
}

export function brandIntro(site: CopySite, brand: string): string {
  const def = BRAND_BY_NAME[brand.toLowerCase()];
  const r = picker(site, `b:${brand}`);
  if (!def) return `${brand} ürünleri ${site.name} güvencesiyle.`;
  return fill(
    r.pick([
      "{since} yılında {country} merkezli olarak kurulan {brand}, {blurb} {site} olarak {brand} ürünlerini orijinal ve faturalı olarak sunuyoruz.",
      "{blurb} {brand} koleksiyonundaki en yeni modelleri {site} farkıyla keşfet.",
      "{brand} ({country}, {since}) {blurbLower} Yeni sezon ürünleri ve klasik modeller bu sayfada.",
    ]),
    {
      brand,
      since: String(def.since),
      country: def.country,
      blurb: def.blurb,
      blurbLower: def.blurb.charAt(0).toLocaleLowerCase("tr-TR") + def.blurb.slice(1),
      site: site.name,
    },
  );
}

export function homeSeoText(site: CopySite, brands: string[]): { heading: string; paragraphs: string[] } {
  const r = picker(site, "home");
  const vars = {
    site: site.name,
    brands: joinTr(brands.slice(0, 6)),
    ship: shippingLine(site),
    city: cityLine(site),
    returnDays: String(site.settings.shipping.returnDays),
    installment: trLower(site.settings.installmentText),
  };
  return {
    heading: fill(r.pick(["{site} ile Orijinal Sneaker Alışverişi", "Sneaker, Spor Giyim ve Aksesuar: {site}", "Türkiye'nin Sneaker Adresi: {site}"]), vars),
    paragraphs: r
      .shuffle([
        "{site}, {brands} gibi dünyanın önde gelen markalarının orijinal sneaker, spor giyim ve aksesuar ürünlerini tek çatı altında topluyor. Erkek, kadın ve çocuk koleksiyonlarında yeni sezon ürünlerini ilk sen keşfet.",
        "Air Force 1, Samba, 530, Speedcat ve Old Skool gibi en çok aranan modeller; renk, beden ve fiyat filtreleriyle saniyeler içinde listelenir. Her ürün sayfasında kalıp önerisi, beden tablosu ve detaylı ürün özellikleri yer alır.",
        "Siparişlerin {city} hızlıca ulaştırılır. {ship}, {installment} ve {returnDays} gün içinde kolay iade avantajlarıyla güvenle alışveriş yapabilirsin.",
        "Koşu, basketbol, outdoor ve günlük kullanım için tasarlanmış ayakkabıların yanında hoodie, eşofman, tişört, çanta, şapka ve çorap gibi tamamlayıcı ürünleri de aynı sepette birleştirebilirsin.",
      ])
      .map((t) => fill(t, vars)),
  };
}
