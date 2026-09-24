/**
 * Statik sayfa şablonları. Metinler sitenin şirket, iletişim ve kargo bilgileriyle doldurulur.
 * Panelden her sayfanın içeriği tamamen değiştirilebilir (site_pages tablosu).
 * Not: Yasal metinler genel şablondur; yayına almadan önce hukuk danışmanınızca gözden geçirilmelidir.
 */
import { formatPrice } from "@/lib/format";

export type PageVars = {
  site: string;
  legalName: string;
  address: string;
  taxOffice: string;
  taxNumber: string;
  mersis: string;
  kep: string;
  email: string;
  phone: string;
  whatsapp: string;
  domain: string;
  city: string;
  hours: string;
  carrier: string;
  dispatch: string;
  returnDays: string;
  freeShip: string;
  fee: string;
  installment: string;
  updated: string;
};

export type SiteLike = {
  name: string;
  primaryHost: string;
  settings: {
    company: { legalName: string; address: string; taxOffice: string; taxNumber: string; mersisNo: string; kepAddress: string };
    contact: { email: string; phone: string; whatsapp: string; address: string; district: string; city: string; workingHours: string };
    shipping: { carrier: string; dispatchDays: string; returnDays: number; freeShippingThreshold: number; fee: number };
    installmentText: string;
  };
};

export function pageVars(site: SiteLike): PageVars {
  const s = site.settings;
  return {
    site: site.name,
    legalName: s.company.legalName || site.name,
    address: s.company.address || [s.contact.address, s.contact.district, s.contact.city].filter(Boolean).join(", "),
    taxOffice: s.company.taxOffice || "-",
    taxNumber: s.company.taxNumber || "-",
    mersis: s.company.mersisNo || "-",
    kep: s.company.kepAddress || "-",
    email: s.contact.email || "-",
    phone: s.contact.phone || "-",
    whatsapp: s.contact.whatsapp,
    domain: site.primaryHost.replace(/:\d+$/, ""),
    city: s.contact.city,
    hours: s.contact.workingHours,
    carrier: s.shipping.carrier,
    dispatch: s.shipping.dispatchDays,
    returnDays: String(s.shipping.returnDays),
    freeShip: formatPrice(s.shipping.freeShippingThreshold * 100).replace(",00", ""),
    fee: formatPrice(s.shipping.fee * 100).replace(",00", ""),
    installment: s.installmentText,
    updated: new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" }).format(new Date()),
  };
}

export function fillVars(tpl: string, v: PageVars): string {
  return tpl.replace(/\{(\w+)\}/g, (m, k: string) => (k in v ? (v as Record<string, string>)[k] : m));
}

export type StaticPageDef = {
  slug: string;
  title: string;
  group: "kurumsal" | "yardim" | "yasal";
  description: string;
  kind?: "contact" | "faq" | "size" | "campaigns";
  body: string;
};

export const FAQ_GROUPS: { title: string; items: { q: string; a: string }[] }[] = [
  {
    title: "Sipariş",
    items: [
      { q: "Siparişimi nasıl verebilirim?", a: "Beğendiğin ürünün bedenini seçip sepete ekle, ardından sepet sayfasından ödeme adımına geç. Üye olmadan da sipariş verebilirsin." },
      { q: "Siparişimi nasıl takip edebilirim?", a: "Sipariş numaran ve e-posta adresinle [Sipariş Takibi](/siparis-takip) sayfasından ya da üyeysen Hesabım > Siparişlerim bölümünden takip edebilirsin." },
      { q: "Siparişimi iptal edebilir miyim?", a: "Kargoya verilmemiş siparişlerini müşteri hizmetlerimizle iletişime geçerek iptal edebilirsin. Kargoya verilen siparişler için iade süreci uygulanır." },
      { q: "Ürünler orijinal mi?", a: "{site} üzerinde satılan tüm ürünler %100 orijinaldir ve faturalı olarak gönderilir." },
    ],
  },
  {
    title: "Ödeme",
    items: [
      { q: "Hangi ödeme yöntemlerini kullanabilirim?", a: "Kredi kartı ve banka kartıyla güvenli ödeme yapabilirsin. Ödemeler Shopier güvenli ödeme altyapısı üzerinden alınır; kart bilgilerin {site} tarafından saklanmaz." },
      { q: "Taksit yapabilir miyim?", a: "{installment}. Taksit seçenekleri ödeme sayfasında kart bilgine göre listelenir." },
      { q: "Ödeme güvenli mi?", a: "Ödeme sayfası 256-bit SSL sertifikası ve 3D Secure doğrulaması ile korunur." },
    ],
  },
  {
    title: "Kargo ve Teslimat",
    items: [
      { q: "Kargo ücreti ne kadar?", a: "{freeShip} ve üzeri siparişlerde kargo ücretsizdir. Bu tutarın altındaki siparişlerde kargo ücreti {fee}'dir." },
      { q: "Siparişim ne zaman kargoya verilir?", a: "Siparişler {dispatch} içinde {carrier} ile kargoya teslim edilir. Hafta sonu ve resmi tatillerde verilen siparişler ilk iş günü işleme alınır." },
      { q: "Teslimat ne kadar sürer?", a: "Kargoya verildikten sonra teslimat bölgene göre genellikle 1-3 iş günü içinde gerçekleşir." },
    ],
  },
  {
    title: "İade ve Değişim",
    items: [
      { q: "İade süresi kaç gün?", a: "Ürünü teslim aldığın tarihten itibaren {returnDays} gün içinde iade edebilirsin." },
      { q: "Beden değişimi yapabilir miyim?", a: "Evet. Stok durumuna göre beden değişimi ücretsizdir. [İade ve Değişim](/iade-ve-degisim) sayfasındaki adımları izleyebilirsin." },
      { q: "İade ücretimi ne zaman alırım?", a: "İade edilen ürün depomuza ulaşıp kontrol edildikten sonra ücret iaden en geç 14 gün içinde ödeme yaptığın karta yapılır. Bankana bağlı olarak hesabına yansıması birkaç gün sürebilir." },
    ],
  },
  {
    title: "Üyelik",
    items: [
      { q: "Üye olmak zorunlu mu?", a: "Hayır. Üye olmadan da sipariş verebilirsin. Üyelik; siparişlerini takip etmeni, adreslerini kaydetmeni ve kampanyalardan haberdar olmanı kolaylaştırır." },
      { q: "Şifremi unuttum, ne yapmalıyım?", a: "Giriş sayfasındaki 'Şifremi Unuttum' bağlantısından yeni şifre talebinde bulunabilirsin." },
    ],
  },
];

export const STATIC_PAGES: StaticPageDef[] = [
  {
    slug: "hakkimizda",
    title: "Hakkımızda",
    group: "kurumsal",
    description: "{site} hakkında: orijinal sneaker, spor giyim ve aksesuar ürünlerini Türkiye'nin her yerine ulaştıran online mağaza.",
    body: `{site}, sneaker kültürünü yaşayan ve yaşatan bir ekip tarafından kuruldu. Amacımız; dünyanın önde gelen spor ve sokak modası markalarının orijinal ürünlerini doğru fiyat, hızlı teslimat ve güvenilir hizmet anlayışıyla Türkiye'nin her yerine ulaştırmak.

## Neden {site}?
- **%100 orijinal ürün:** Tüm ürünlerimiz yetkili tedarik kanallarından temin edilir ve faturalı olarak gönderilir.
- **Hızlı kargo:** Siparişler {dispatch} içinde {carrier} ile kargoya teslim edilir.
- **Kolay iade:** Beden ya da model uymazsa {returnDays} gün içinde ücretsiz iade veya değişim yapabilirsin.
- **Güvenli ödeme:** Ödemeler Shopier güvenli ödeme altyapısı ve 3D Secure ile alınır.

## Koleksiyonumuz
Erkek, kadın ve çocuk kategorilerinde sneaker, koşu ayakkabısı, basketbol ayakkabısı, bot, terlik, spor giyim ve aksesuar ürünlerini tek çatı altında topluyoruz. Yeni sezon modellerini ve sınırlı sayıdaki özel serileri takip etmek için [Yeni Gelenler](/yeni-gelenler) sayfasını ziyaret edebilirsin.

## Şirket Bilgileri
- Ünvan: {legalName}
- Adres: {address}
- Vergi Dairesi / No: {taxOffice} / {taxNumber}
- MERSİS No: {mersis}
- E-posta: {email}
- Telefon: {phone}`,
  },
  {
    slug: "iletisim",
    title: "İletişim",
    group: "kurumsal",
    kind: "contact",
    description: "{site} müşteri hizmetleri iletişim bilgileri: telefon, e-posta, WhatsApp ve iletişim formu.",
    body: `Sipariş, ürün, iade ve değişim ile ilgili tüm soruların için müşteri hizmetlerimize ulaşabilirsin. Mesajlarına en geç 1 iş günü içinde dönüş yapıyoruz.`,
  },
  {
    slug: "sss",
    title: "Sıkça Sorulan Sorular",
    group: "yardim",
    kind: "faq",
    description: "{site} sıkça sorulan sorular: sipariş, ödeme, taksit, kargo, iade ve değişim hakkında merak edilenler.",
    body: `Aradığın cevabı bulamazsan [İletişim](/iletisim) sayfasından bize ulaşabilirsin.`,
  },
  {
    slug: "kargo-ve-teslimat",
    title: "Kargo ve Teslimat",
    group: "yardim",
    description: "{site} kargo ve teslimat koşulları: {freeShip} üzeri ücretsiz kargo, {dispatch} içinde kargoya teslim.",
    body: `## Kargo Ücreti
{freeShip} ve üzeri tüm siparişlerde kargo ücretsizdir. Bu tutarın altındaki siparişlerde {fee} kargo ücreti uygulanır ve ödeme adımında toplam tutara eklenir.

## Kargoya Teslim Süresi
Siparişlerin {dispatch} içinde {carrier} ile kargoya teslim edilir. Hafta sonu ve resmi tatillerde verilen siparişler ilk iş günü işleme alınır. Kampanya dönemlerinde bu süre uzayabilir; böyle bir durumda seni e-posta ile bilgilendiririz.

## Teslimat Süresi
Kargoya verilen siparişler bulunduğun bölgeye göre genellikle 1-3 iş günü içinde teslim edilir. Mobil bölgeler ve köylere teslimat süresi daha uzun olabilir.

## Kargo Takibi
Siparişin kargoya verildiğinde kargo takip numarası e-posta adresine gönderilir. Siparişinin durumunu [Sipariş Takibi](/siparis-takip) sayfasından da görebilirsin.

## Teslim Alırken
Paketi teslim alırken kargo görevlisinin yanında kontrol etmeni öneririz. Hasarlı pakette tutanak tutturarak teslim almaman ve bizimle iletişime geçmen gerekir.

## Yurt Dışı Gönderim
Şu an yalnızca Türkiye içine gönderim yapmaktayız.`,
  },
  {
    slug: "iade-ve-degisim",
    title: "İade ve Değişim",
    group: "yardim",
    description: "{site} iade ve değişim koşulları: {returnDays} gün içinde ücretsiz iade ve beden değişimi.",
    body: `Satın aldığın ürünü teslim tarihinden itibaren {returnDays} gün içinde herhangi bir gerekçe göstermeden iade edebilir ya da değiştirebilirsin.

## İade Koşulları
- Ürün kullanılmamış, yıkanmamış ve etiketi sökülmemiş olmalıdır.
- Ayakkabılar orijinal kutusuyla, kutu hasar görmeden gönderilmelidir (kutunun üzerine kargo etiketi yapıştırılmamalıdır).
- Faturanın iade bölümü doldurularak paketle birlikte gönderilmelidir.
- Hijyen nedeniyle çorap ve iç giyim ürünlerinde ambalajı açılmış ürünlerin iadesi kabul edilmez.

## İade Adımları
1. [İletişim](/iletisim) sayfasından ya da {email} adresinden sipariş numaranla iade talebi oluştur.
2. Sana iletilecek iade kodu ile ürünü {carrier} şubesine ücretsiz olarak teslim et.
3. Ürün depomuza ulaştıktan sonra 3 iş günü içinde kontrol edilir.
4. Onaylanan iadelerde ücret, ödeme yaptığın karta en geç 14 gün içinde iade edilir.

## Beden Değişimi
Beden değişimi için iade talebi oluştururken istediğin bedeni belirtmen yeterli. Stokta bulunması halinde yeni bedenin kargo ücreti alınmadan gönderilir. Stokta yoksa ücret iaden yapılır.

## Hasarlı veya Hatalı Ürün
Sana ulaşan ürün hasarlı ya da siparişinden farklıysa teslim tarihinden itibaren 3 gün içinde fotoğraflarıyla birlikte bize bildir. Kargo ücreti tarafımızca karşılanarak değişim yapılır.`,
  },
  {
    slug: "beden-rehberi",
    title: "Beden Rehberi",
    group: "yardim",
    kind: "size",
    description: "Sneaker ve spor giyim beden tablosu: EU, US, UK numara ve santimetre karşılıkları, marka kalıp önerileri.",
    body: `Doğru bedeni seçmek için ayak uzunluğunu ölçüp aşağıdaki tablolarla karşılaştırabilirsin.

## Ayak Ölçüsü Nasıl Alınır?
1. Bir kâğıdı duvara dayalı şekilde yere koy.
2. Topuğun duvara değecek şekilde kâğıdın üzerine bas.
3. En uzun parmağının ucunu işaretle ve duvarla arasındaki mesafeyi santimetre olarak ölç.
4. Ölçümü akşam saatlerinde ve iki ayak için de yap; büyük olan ölçüyü esas al.

## Erkek Ayakkabı Beden Tablosu
| EU | US | UK | CM |
|---|---|---|---|
| 40 | 7 | 6 | 25 |
| 40.5 | 7.5 | 6.5 | 25.5 |
| 41 | 8 | 7 | 26 |
| 42 | 8.5 | 7.5 | 26.5 |
| 42.5 | 9 | 8 | 27 |
| 43 | 9.5 | 8.5 | 27.5 |
| 44 | 10 | 9 | 28 |
| 44.5 | 10.5 | 9.5 | 28.5 |
| 45 | 11 | 10 | 29 |
| 46 | 12 | 11 | 30 |

## Kadın Ayakkabı Beden Tablosu
| EU | US | UK | CM |
|---|---|---|---|
| 36 | 5.5 | 3.5 | 22.5 |
| 36.5 | 6 | 4 | 23 |
| 37.5 | 6.5 | 4.5 | 23.5 |
| 38 | 7 | 5 | 24 |
| 38.5 | 7.5 | 5.5 | 24.5 |
| 39 | 8 | 6 | 25 |
| 40 | 8.5 | 6.5 | 25.5 |
| 40.5 | 9 | 7 | 26 |

## Çocuk Ayakkabı Beden Tablosu
| EU | US | CM |
|---|---|---|
| 28 | 11C | 17 |
| 29 | 11.5C | 17.5 |
| 30 | 12.5C | 18 |
| 31 | 13C | 19 |
| 32 | 1Y | 20 |
| 33 | 2Y | 20.5 |
| 34 | 2.5Y | 21 |
| 35 | 3.5Y | 22 |

## Giyim Beden Tablosu
| Beden | Göğüs (cm) | Bel (cm) | Boy (cm) |
|---|---|---|---|
| XS | 82-88 | 66-72 | 160-166 |
| S | 88-94 | 72-78 | 166-172 |
| M | 94-100 | 78-84 | 172-178 |
| L | 100-106 | 84-90 | 178-184 |
| XL | 106-112 | 90-96 | 184-190 |
| XXL | 112-120 | 96-104 | 190-196 |

## Markalara Göre Kalıp Önerileri
- **Nike, Jordan, Vans, Reebok:** Standart kalıp.
- **adidas Samba, Gazelle, Spezial:** Dar kalıp; yarım numara büyük önerilir.
- **New Balance:** Rahat ve standart kalıp.
- **Converse:** Büyük kalıp; yarım ya da bir numara küçük önerilir.
- **Timberland:** Büyük kalıp; yarım numara küçük önerilir.`,
  },
  {
    slug: "guvenli-alisveris",
    title: "Güvenli Alışveriş",
    group: "yardim",
    description: "{site} güvenli alışveriş: SSL, 3D Secure, Shopier güvenli ödeme ve kişisel verilerin korunması.",
    body: `{site} üzerinde yaptığın tüm alışverişler uçtan uca güvenlik önlemleriyle korunur.

## Güvenli Ödeme
Ödemeler, Türkiye'nin yaygın ödeme altyapılarından Shopier üzerinden alınır. Kart bilgilerin {site} sunucularında saklanmaz; ödeme sayfası 256-bit SSL şifreleme ve 3D Secure doğrulaması ile korunur.

## Taksit Seçenekleri
{installment}. Kartına uygun taksit seçenekleri ödeme sayfasında gösterilir.

## Orijinal Ürün Güvencesi
Tüm ürünler orijinal ve faturalıdır. Ürünler marka kutusu ve etiketleriyle birlikte gönderilir.

## Kişisel Verilerin Korunması
Kişisel verilerin 6698 sayılı Kişisel Verilerin Korunması Kanunu'na uygun olarak işlenir. Ayrıntılar için [KVKK Aydınlatma Metni](/kvkk-aydinlatma-metni) ve [Gizlilik Politikası](/gizlilik-politikasi) sayfalarını inceleyebilirsin.`,
  },
  {
    slug: "kampanyalar",
    title: "Kampanyalar",
    group: "kurumsal",
    kind: "campaigns",
    description: "{site} güncel kampanyalar, indirimler ve fırsatlar.",
    body: `Güncel kampanyalarımızı bu sayfada bulabilirsin. Kampanya koşulları duyuru metinlerinde belirtilmiştir; {site} kampanya koşullarında değişiklik yapma hakkını saklı tutar.`,
  },
  {
    slug: "mesafeli-satis-sozlesmesi",
    title: "Mesafeli Satış Sözleşmesi",
    group: "yasal",
    description: "{site} mesafeli satış sözleşmesi.",
    body: `## Madde 1 - Taraflar
**Satıcı**
- Ünvan: {legalName}
- Adres: {address}
- Vergi Dairesi / No: {taxOffice} / {taxNumber}
- MERSİS No: {mersis}
- Telefon: {phone}
- E-posta: {email}

**Alıcı**
{domain} internet sitesi üzerinden sipariş veren ve sipariş formunda bilgileri yer alan kişi.

## Madde 2 - Konu
İşbu sözleşmenin konusu, Alıcı'nın Satıcı'ya ait {domain} internet sitesinden elektronik ortamda siparişini verdiği, nitelikleri ve satış fiyatı sitede belirtilen ürünün satışı ve teslimi ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince tarafların hak ve yükümlülüklerinin belirlenmesidir.

## Madde 3 - Sözleşme Konusu Ürün ve Ödeme
Ürünün cinsi, türü, miktarı, marka/modeli, rengi, bedeni, vergiler dahil satış bedeli ve kargo ücreti sipariş özeti ve faturada belirtildiği gibidir. Ödeme, Shopier güvenli ödeme altyapısı üzerinden kredi kartı veya banka kartı ile yapılır.

## Madde 4 - Teslimat
Ürün, Alıcı'nın sipariş formunda belirttiği adrese {carrier} aracılığıyla teslim edilir. Ürün, yasal 30 günlük süreyi aşmamak kaydıyla {dispatch} içinde kargoya verilir. Teslimat anında Alıcı'nın adresinde bulunmaması durumunda Satıcı edimini yerine getirmiş kabul edilir.

## Madde 5 - Cayma Hakkı
Alıcı, ürünün kendisine veya gösterdiği adresteki kişiye teslim tarihinden itibaren 14 (on dört) gün içinde herhangi bir gerekçe göstermeksizin ve cezai şart ödemeksizin cayma hakkını kullanabilir. Satıcı ayrıca bu süreyi {returnDays} güne kadar uzatmıştır. Cayma hakkının kullanılması için bu süre içinde Satıcı'ya yazılı olarak ({email}) bildirimde bulunulması ve ürünün kullanılmamış olması gerekir.

## Madde 6 - Cayma Hakkının Kullanılamayacağı Durumlar
Mesafeli Sözleşmeler Yönetmeliği'nin 15. maddesi uyarınca; Alıcı'nın istekleri doğrultusunda kişiye özel hazırlanan ürünler ile tesliminden sonra ambalajı açılmış, sağlık ve hijyen açısından iadesi uygun olmayan ürünlerde (iç giyim, çorap vb.) cayma hakkı kullanılamaz.

## Madde 7 - Bedel İadesi
Cayma hakkının kullanılması halinde Satıcı, cayma bildiriminin kendisine ulaştığı tarihten itibaren 14 gün içinde ürün bedelini Alıcı'nın ödeme yaptığı yönteme uygun şekilde iade eder.

## Madde 8 - Genel Hükümler
Alıcı, ürünün temel nitelikleri, satış fiyatı, ödeme şekli ve teslimata ilişkin ön bilgileri okuyup bilgi sahibi olduğunu ve elektronik ortamda gerekli teyidi verdiğini kabul eder. Ürünün teslimatı için işbu sözleşmenin elektronik ortamda onaylanmış ve ödemenin gerçekleşmiş olması gerekir.

## Madde 9 - Uyuşmazlıkların Çözümü
İşbu sözleşmeden doğan uyuşmazlıklarda Ticaret Bakanlığınca ilan edilen değere kadar Alıcı'nın yerleşim yerindeki Tüketici Hakem Heyetleri, bu değerin üzerindeki uyuşmazlıklarda Tüketici Mahkemeleri yetkilidir.

## Madde 10 - Yürürlük
Alıcı, siparişi onayladığı anda işbu sözleşmenin tüm koşullarını kabul etmiş sayılır.

Son güncelleme: {updated}`,
  },
  {
    slug: "on-bilgilendirme-formu",
    title: "Ön Bilgilendirme Formu",
    group: "yasal",
    description: "{site} ön bilgilendirme formu.",
    body: `## Satıcı Bilgileri
- Ünvan: {legalName}
- Adres: {address}
- Telefon: {phone}
- E-posta: {email}
- MERSİS No: {mersis}

## Ürün ve Fiyat Bilgileri
Sözleşme konusu ürünün temel nitelikleri, vergiler dahil toplam fiyatı, varsa kargo ücreti ve ödeme şekli sipariş özetinde gösterilmektedir. İlan edilen fiyatlar ve vaatler güncelleme yapılana ve değiştirilene kadar geçerlidir.

## Ödeme ve Teslimat
Ödeme, Shopier güvenli ödeme altyapısı üzerinden kredi kartı veya banka kartı ile yapılır. {installment}. Ürün {dispatch} içinde {carrier} ile kargoya verilir. {freeShip} altındaki siparişlerde {fee} kargo ücreti uygulanır.

## Cayma Hakkı
Alıcı, ürünü teslim aldığı tarihten itibaren {returnDays} gün içinde herhangi bir gerekçe göstermeksizin cayma hakkını kullanabilir. Cayma bildirimi {email} adresine yapılabilir. Cayma hakkının kullanılamayacağı ürünler Mesafeli Satış Sözleşmesi'nde belirtilmiştir.

## Şikâyet ve İtirazlar
Alıcı, şikâyet ve itirazlarını yukarıdaki iletişim kanallarından Satıcı'ya iletebilir; ayrıca yerleşim yerindeki Tüketici Hakem Heyeti veya Tüketici Mahkemesi'ne başvurabilir.

Son güncelleme: {updated}`,
  },
  {
    slug: "kvkk-aydinlatma-metni",
    title: "KVKK Aydınlatma Metni",
    group: "yasal",
    description: "{site} 6698 sayılı KVKK kapsamında kişisel verilerin işlenmesine ilişkin aydınlatma metni.",
    body: `{legalName} ("Şirket") olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusu sıfatıyla kişisel verilerinizi aşağıda açıklanan çerçevede işlemekteyiz.

## İşlenen Kişisel Veriler
- **Kimlik:** ad, soyad
- **İletişim:** e-posta adresi, telefon numarası, teslimat ve fatura adresi
- **Müşteri işlem:** sipariş, iade ve talep bilgileri
- **İşlem güvenliği:** IP adresi, çerez kayıtları, oturum bilgileri
- **Pazarlama:** onay vermeniz halinde kampanya ve tercih bilgileri

Kart bilgileriniz Şirketimiz tarafından işlenmez ve saklanmaz; ödeme işlemleri Shopier ödeme altyapısı tarafından gerçekleştirilir.

## İşleme Amaçları
- Siparişlerin alınması, faturalandırılması ve teslim edilmesi
- İade, değişim ve müşteri hizmetleri süreçlerinin yürütülmesi
- Yasal yükümlülüklerin yerine getirilmesi (vergi, tüketici mevzuatı)
- Açık rızanız olması halinde kampanya ve tanıtım iletişimi
- Site güvenliğinin sağlanması ve hizmet kalitesinin artırılması

## Hukuki Sebepler
Kişisel verileriniz KVKK'nın 5. maddesinde yer alan sözleşmenin kurulması ve ifası, hukuki yükümlülüğün yerine getirilmesi, meşru menfaat ve açık rıza hukuki sebeplerine dayanılarak işlenir.

## Aktarım
Kişisel verileriniz yalnızca yukarıdaki amaçlarla sınırlı olarak kargo şirketleri, ödeme kuruluşu (Shopier), bilgi teknolojileri hizmet sağlayıcıları ve yetkili kamu kurumlarıyla paylaşılabilir.

## Toplama Yöntemi
Kişisel verileriniz internet sitemiz, üyelik ve sipariş formları, çerezler ve müşteri hizmetleri kanalları aracılığıyla elektronik ortamda toplanır.

## Haklarınız
KVKK'nın 11. maddesi uyarınca; verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, işleme amacını öğrenme, aktarıldığı üçüncü kişileri bilme, eksik veya yanlış işlenmişse düzeltilmesini, silinmesini veya yok edilmesini isteme, itiraz etme ve zarar halinde tazminat talep etme haklarına sahipsiniz. Başvurularınızı {email} adresine iletebilirsiniz.

Son güncelleme: {updated}`,
  },
  {
    slug: "gizlilik-politikasi",
    title: "Gizlilik Politikası",
    group: "yasal",
    description: "{site} gizlilik politikası.",
    body: `{site} olarak ziyaretçilerimizin ve müşterilerimizin gizliliğine önem veriyoruz. Bu politika, {domain} adresini kullanırken hangi bilgilerin toplandığını ve nasıl korunduğunu açıklar.

## Toplanan Bilgiler
Sipariş verirken, üye olurken veya bizimle iletişime geçerken paylaştığın ad, e-posta, telefon ve adres bilgileri ile siteyi kullanırken oluşan teknik veriler (IP adresi, tarayıcı türü, ziyaret edilen sayfalar) toplanır.

## Bilgilerin Kullanımı
Bilgilerin siparişlerini işlemek, teslimatı gerçekleştirmek, müşteri hizmetleri sunmak, yasal yükümlülükleri yerine getirmek ve onay vermen halinde kampanyalardan haberdar etmek için kullanılır.

## Ödeme Güvenliği
Kart bilgilerin {site} tarafından görülmez ve saklanmaz. Ödeme işlemleri Shopier güvenli ödeme sayfasında 3D Secure ile gerçekleştirilir.

## Üçüncü Taraflar
Bilgilerin; kargo firması, ödeme kuruluşu ve yasal zorunluluk halinde yetkili makamlar dışında üçüncü kişilerle paylaşılmaz, satılmaz ve kiralanmaz.

## Çerezler
Sitemizde deneyimini iyileştirmek için çerezler kullanılır. Ayrıntılar için [Çerez Politikası](/cerez-politikasi) sayfasını inceleyebilirsin.

## İletişim
Gizlilik ile ilgili soruların için {email} adresine yazabilirsin.

Son güncelleme: {updated}`,
  },
  {
    slug: "cerez-politikasi",
    title: "Çerez Politikası",
    group: "yasal",
    description: "{site} çerez (cookie) politikası ve çerez tercihleri.",
    body: `Çerezler, ziyaret ettiğin internet siteleri tarafından tarayıcına kaydedilen küçük metin dosyalarıdır. {site} olarak çerezleri sitenin düzgün çalışması, alışveriş deneyiminin iyileştirilmesi ve ziyaret istatistiklerinin tutulması amacıyla kullanıyoruz.

## Kullandığımız Çerez Türleri
- **Zorunlu çerezler:** Sepet, oturum ve güvenlik işlevleri için gereklidir; kapatılamaz.
- **İşlevsel çerezler:** Favoriler ve son gezilen ürünler gibi tercihlerini hatırlar.
- **Analitik çerezler:** Siteyi nasıl kullandığını anonim olarak ölçmemize yardımcı olur (örn. Google Analytics). Yalnızca onay vermen halinde çalışır.
- **Pazarlama çerezleri:** İlgi alanlarına uygun reklamlar gösterilmesini sağlar (örn. Meta Pixel). Yalnızca onay vermen halinde çalışır.

## Çerez Tercihlerini Yönetme
Siteye ilk girişinde çıkan bildirimden tercihini yapabilirsin. Tarayıcı ayarlarından çerezleri dilediğin zaman silebilir veya engelleyebilirsin; ancak bu durumda sitenin bazı işlevleri çalışmayabilir.

Son güncelleme: {updated}`,
  },
  {
    slug: "uyelik-sozlesmesi",
    title: "Üyelik Sözleşmesi",
    group: "yasal",
    description: "{site} üyelik sözleşmesi.",
    body: `## Taraflar
İşbu sözleşme, {legalName} ("{site}") ile {domain} internet sitesine üye olan kullanıcı ("Üye") arasında elektronik ortamda kurulmuştur.

## Üyelik
Üyelik, sitedeki üyelik formunun eksiksiz ve doğru doldurulması ve sözleşmenin onaylanmasıyla başlar. Üye, verdiği bilgilerin doğru olduğunu ve güncel tutacağını kabul eder.

## Üyenin Yükümlülükleri
- Hesap bilgilerinin ve şifresinin gizliliğinden Üye sorumludur.
- Üye, siteyi hukuka ve genel ahlaka aykırı amaçlarla kullanamaz.
- Üye, siteye zarar verecek yazılım veya yöntemler kullanamaz.

## {site}'in Hakları
{site}, sözleşmeye aykırı davranan üyelerin hesabını askıya alma veya sonlandırma hakkına sahiptir. {site}, site içeriğinde ve bu sözleşmede önceden bildirimde bulunmaksızın değişiklik yapabilir.

## Kişisel Veriler
Üyelik kapsamında paylaşılan kişisel veriler [KVKK Aydınlatma Metni](/kvkk-aydinlatma-metni) çerçevesinde işlenir.

## Sona Erme
Üye, dilediği zaman {email} adresine bildirimde bulunarak üyeliğini sonlandırabilir.

Son güncelleme: {updated}`,
  },
];

export const STATIC_BY_SLUG = new Map(STATIC_PAGES.map((p) => [p.slug, p]));
