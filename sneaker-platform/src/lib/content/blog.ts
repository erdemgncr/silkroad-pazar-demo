import { hashString, seededRandom } from "@/lib/format";

/**
 * Başlangıç blog yazıları. Her site kendi tohumuna göre farklı başlık varyasyonu ve sıralama alır.
 * Panelden yazılar düzenlenebilir, silinebilir ya da yenileri eklenebilir.
 * İçerik biçimi: "## " ile başlayan satırlar alt başlık, "- " ile başlayanlar madde işaretidir.
 */
type Article = {
  key: string;
  titles: string[];
  slug: string;
  excerpt: string;
  body: string;
  coverSeed: string;
};

const ARTICLES: Article[] = [
  {
    key: "temizlik",
    slug: "beyaz-sneaker-temizligi-rehberi",
    titles: [
      "Beyaz Sneaker Temizliği: İlk Günkü Gibi Kalması İçin 8 Adım",
      "Beyaz Ayakkabı Nasıl Temizlenir? Evde Uygulanabilecek Yöntemler",
      "Sneaker Bakım Rehberi: Beyaz Ayakkabılar Nasıl Temizlenir?",
    ],
    excerpt: "Beyaz sneaker'ların sararmasını önlemek ve lekeleri güvenle çıkarmak için malzemeye göre adım adım temizlik rehberi.",
    coverSeed: "clean",
    body: `Beyaz sneaker'lar her kombine uyar ama en çok emek isteyen ayakkabılardır. Doğru yöntemle temizlendiğinde yıllarca ilk günkü görünümünü korurlar. Bu rehberde deri, süet ve kumaş sayalar için ayrı ayrı uygulanabilecek yöntemleri derledik.

## 1. Önce Bağcıkları ve Tabanlığı Çıkarın
Bağcıkları ılık, sabunlu suda bekletin. Tabanlıkları ise nemli bir bezle silip havalandırın. Bu sayede ayakkabının her noktasına rahatça ulaşabilirsiniz.

## 2. Kuru Fırçalama ile Başlayın
Yumuşak kıllı bir fırçayla sayadaki ve tabandaki toz ile kurumuş çamuru temizleyin. Islak temizliğe geçmeden önce yapılan bu adım, lekelerin yayılmasını engeller.

## 3. Deri Sayalar İçin Hafif Sabunlu Su
Bir kase ılık suya birkaç damla sıvı sabun ekleyin. Mikrofiber bir bezi bu karışımla nemlendirip sayayı dairesel hareketlerle silin. Deriyi fazla ıslatmamaya dikkat edin.

## 4. Süet ve Nubukta Su Kullanmayın
Süet yüzeylerde özel süet silgisi ve süet fırçası kullanın. İnatçı lekelerde çok az miktarda beyaz sirkeyle nemlendirilmiş bez kullanılabilir; ardından yüzeyi fırçayla kabartın.

## 5. Kauçuk Taban İçin Karbonat Karışımı
Bir kaşık karbonat ile biraz suyu macun kıvamına getirin ve eski bir diş fırçasıyla tabana uygulayın. Kenar bantlarındaki sararma belirgin şekilde azalır.

## 6. Makinede Yıkamaktan Kaçının
Çamaşır makinesi, yapıştırıcıları zayıflatabilir ve ayakkabının formunu bozabilir. Üretici aksini belirtmedikçe elde temizlik her zaman daha güvenlidir.

## 7. Gölgede Kurutun
Ayakkabının içini kâğıt havluyla doldurun ve doğrudan güneş ışığından uzak, havadar bir yerde kurutun. Kalorifer üzerinde kurutmak sararmaya neden olur.

## 8. Koruyucu Sprey Kullanın
Temizlikten sonra uygulanan su ve leke itici sprey, bir sonraki temizliği çok daha kolay hale getirir.

## Sık Yapılan Hatalar
- Çamaşır suyu kullanmak: Beyaz yüzeylerde kalıcı sararmaya yol açar.
- Sert fırça kullanmak: Deride çizik, süette tüylenme oluşturur.
- Islak ayakkabıyı kutuda saklamak: Kötü koku ve küf riskini artırır.

Düzenli bakım yapılan bir sneaker, hem daha uzun ömürlü olur hem de her giyişte ilk günkü özgüveni verir.`,
  },
  {
    key: "beden",
    slug: "sneaker-beden-secimi-kalip-rehberi",
    titles: [
      "Sneaker Bedeni Nasıl Seçilir? Marka Marka Kalıp Rehberi",
      "Doğru Ayakkabı Numarası Seçme Rehberi: Nike, adidas, New Balance",
      "Online Sneaker Alırken Beden Seçimi: Bilmeniz Gereken Her Şey",
    ],
    excerpt: "Ayak ölçünüzü evde nasıl alacağınızı ve Nike, adidas, New Balance, Converse gibi markaların kalıp farklarını anlattık.",
    coverSeed: "size",
    body: `Online alışverişte en sık karşılaşılan soru "Hangi numarayı almalıyım?" sorusudur. Markalar ve hatta aynı markanın farklı modelleri arasında kalıp farkları olabilir. Bu rehberle doğru bedeni ilk seferde seçebilirsiniz.

## Ayak Ölçüsü Evde Nasıl Alınır?
- Bir A4 kâğıdı duvara dayalı şekilde yere koyun.
- Topuğunuz duvara değecek şekilde kâğıdın üzerine basın.
- En uzun parmağınızın ucunu işaretleyin ve duvar ile işaret arasındaki mesafeyi santimetre olarak ölçün.
- Ölçümü akşam saatlerinde ve her iki ayak için yapın; büyük olan ölçüyü esas alın.

Ölçtüğünüz santimetre değerini ürün sayfalarındaki beden tablosunda "CM" sütunuyla karşılaştırarak Avrupa (EU) numaranızı bulabilirsiniz.

## Markalara Göre Kalıp Farkları
- Nike: Genel olarak standart kalıptır. Air Max serisi bazı kullanıcılar için hafif dar gelebilir.
- adidas: Samba, Gazelle ve Spezial gibi terrace modelleri dar kalıptır; yarım numara büyük tercih edilebilir.
- New Balance: Rahat ve standart kalıptır. Bazı modellerde geniş (2E) seçenekler bulunur.
- Converse: Büyük kalıptır; genellikle yarım ya da bir numara küçük alınması önerilir.
- Vans: Standart kalıptır.
- Timberland: Botlarda yarım numara küçük tercih edilir.

## Çocuklarda Beden Seçimi
Çocuk ayakları hızla büyüdüğü için ölçülen değerin yaklaşık 1 cm üzerini seçmek hem konfor hem de kullanım süresi açısından doğru bir tercihtir.

## Beden Uymazsa Ne Olur?
Ürünü teslim aldıktan sonra 14 gün içinde kullanılmamış ve kutusu hasar görmemiş şekilde değişim talebinde bulunabilirsiniz. Hesabım sayfasındaki "Siparişlerim" bölümünden süreci kolayca başlatabilirsiniz.`,
  },
  {
    key: "trend",
    slug: "sonbahar-sneaker-trendleri",
    titles: [
      "Bu Sezonun Sneaker Trendleri: Terrace, Y2K Koşu ve Süet",
      "Sonbaharın En Çok Aranan Sneaker Modelleri",
      "Sneaker Trendleri: Bu Sezon Hangi Modeller Öne Çıkıyor?",
    ],
    excerpt: "İnce profilli terrace modellerden metalik detaylı Y2K koşu ayakkabılarına, sezonun öne çıkan sneaker trendlerini inceledik.",
    coverSeed: "trend",
    body: `Sneaker dünyasında trendler artık sezon sezon değil, neredeyse ay ay değişiyor. Yine de bu sezon bazı eğilimlerin net şekilde öne çıktığını söyleyebiliriz.

## 1. İnce Profilli Terrace Modelleri
adidas Samba ve Gazelle ile başlayan ince profil akımı, Puma Speedcat ve adidas Handball Spezial ile devam ediyor. Gum taban, süet saya ve retro renk blokları bu trendin olmazsa olmazları.

## 2. Y2K Koşu Estetiği
2000'lerin koşu ayakkabılarından ilham alan metalik detaylar, katmanlı mesh sayalar ve belirgin tabanlar hâlâ çok popüler. New Balance 530, Asics Gel-1130 ve Nike V2K Run bu akımın en sevilen örnekleri.

## 3. Süet ve Toprak Tonları
Sonbaharla birlikte bej, kahverengi, haki ve bordo tonlarındaki süet modellere ilgi artıyor. Bu tonlar hem kot hem de kumaş pantolonlarla kolayca kombinlenebiliyor.

## 4. Tıknaz (Chunky) Silüetler
New Balance 9060 ve Vans Knu Skool gibi hacimli modeller, geniş paça pantolonlarla birlikte sokak stilinin vazgeçilmezi olmaya devam ediyor.

## 5. Gorpcore ve Teknik Ayakkabılar
Salomon XT-6 gibi patika koşu ayakkabıları şehir stiline taşınmış durumda. Su itici malzemeler ve agresif tabanlar, yağmurlu günler için de pratik bir çözüm sunuyor.

## Hangi Trend Size Uygun?
Minimal bir gardırobunuz varsa beyaz veya siyah terrace modeller, daha cesur kombinler için ise renkli Y2K koşu ayakkabıları iyi bir tercih olabilir. Tüm trend modelleri "Yeni Gelenler" sayfamızda bulabilirsiniz.`,
  },
  {
    key: "kosu",
    slug: "kosu-ayakkabisi-secerken-dikkat-edilmesi-gerekenler",
    titles: [
      "Koşu Ayakkabısı Seçerken Dikkat Edilmesi Gereken 7 Şey",
      "Doğru Koşu Ayakkabısı Nasıl Seçilir?",
      "Yeni Başlayanlar İçin Koşu Ayakkabısı Seçim Rehberi",
    ],
    excerpt: "Basış tipi, yastıklama, drop ve zemin... Koşu ayakkabısı alırken sakatlık riskini azaltacak kriterleri derledik.",
    coverSeed: "run",
    body: `Koşu ayakkabısı, koşucunun en önemli ekipmanıdır. Yanlış seçilmiş bir ayakkabı performansı düşürmekle kalmaz, sakatlık riskini de artırır.

## 1. Basış Tipinizi Öğrenin
Ayağınızın içe (pronasyon), dışa (supinasyon) ya da nötr bastığını bilmek, stabilite ya da nötr ayakkabı seçiminde belirleyicidir. Eski ayakkabınızın tabanındaki aşınma bölgesi size ipucu verir.

## 2. Yastıklama Seviyesi
Uzun mesafe ve toparlanma koşuları için Hoka Bondi veya Asics Gel-Nimbus gibi yüksek yastıklamalı modeller, tempo koşuları için daha hafif ve tepkili modeller tercih edilebilir.

## 3. Drop (Topuk-Burun Farkı)
Topuktan basan koşucular genellikle 8-12 mm drop ile daha rahat eder. Orta ayaktan basanlar daha düşük drop tercih edebilir.

## 4. Zemin
Asfalt ve koşu bandı için yol koşusu ayakkabıları, toprak ve patika için tırtıklı tabanlı trail modelleri kullanılmalıdır.

## 5. Ağırlık
Hafif ayakkabı yarış ve hız antrenmanlarında avantaj sağlar; ancak günlük antrenmanlarda dayanıklılık ve destek daha önemlidir.

## 6. Doğru Beden
Koşu sırasında ayak şişer. Bu nedenle burun kısmında yaklaşık bir başparmak genişliğinde boşluk kalmalıdır. Çoğu koşucu günlük numarasından yarım numara büyük tercih eder.

## 7. Değişim Zamanı
Koşu ayakkabıları ortalama 600-800 km sonra yastıklama özelliğini kaybeder. Düzenli koşuyorsanız kilometrenizi takip etmeniz faydalı olur.

Koşu ayakkabısı koleksiyonumuzda Nike Pegasus, Hoka Clifton, Asics Gel-Nimbus ve New Balance 1080 gibi popüler modelleri inceleyebilirsiniz.`,
  },
  {
    key: "kombin",
    slug: "sneaker-kombin-onerileri",
    titles: [
      "Sneaker Kombin Rehberi: Jean, Eşofman ve Takım Elbiseyle",
      "Sneaker Nasıl Kombinlenir? 6 Farklı Stil Önerisi",
      "Günlükten Şıka Sneaker Kombin Önerileri",
    ],
    excerpt: "Beyaz court modellerden tıknaz koşu ayakkabılarına, sneaker'ları farklı stillerle kombinlemenin püf noktaları.",
    coverSeed: "style",
    body: `Sneaker'lar artık sadece spor için değil; ofisten davetlere kadar her ortamda tercih ediliyor. Doğru kombinle aynı ayakkabıyı çok farklı şekillerde kullanabilirsiniz.

## Jean ile Klasik Sokak Stili
Beyaz bir court modeli (Air Force 1, Stan Smith, Club C) düz kesim jean ve sade bir tişörtle kombinleyin. Paçaları bir kez katlamak ayakkabıyı ön plana çıkarır.

## Eşofman ve Hoodie ile Rahat Görünüm
Tıknaz koşu modelleri (New Balance 9060, Nike V2K Run) eşofman takımı ve oversize hoodie ile uyumludur. Ton sür ton renkler kombine bütünlük katar.

## Terrace Modellerle Retro Dokunuş
Samba, Gazelle veya Speedcat gibi ince profilli modeller; geniş paça pantolon, kolej ceket ya da futbol forması ile retro bir stil oluşturur.

## Kumaş Pantolon ve Blazer ile Şık Kombin
Deri, sade renkli sneaker'lar kumaş pantolon ve blazer ceketle modern bir iş stili yaratır. Bu kombinde logo ve renk detaylarının minimal olması önemlidir.

## Etek ve Elbise ile
Beyaz ya da pastel tonlu sneaker'lar midi etek ve elbiselerle rahat ama şık bir görünüm sunar. Platform tabanlı modeller boyu uzun gösterir.

## Renk Seçimi İçin Kısa İpuçları
- Kombininizde en fazla üç ana renk kullanın.
- Ayakkabının vurgu rengini çanta, şapka veya çorapta tekrarlayın.
- Nötr tonlu sneaker'lar desenli kıyafetleri dengeler.

Kombin önerilerimizde yer alan tüm modelleri kategori sayfalarımızda renk ve beden filtreleriyle kolayca bulabilirsiniz.`,
  },
];

export function starterBlogPosts(seed: number) {
  const rand = seededRandom(seed * 7 + 3);
  const shuffled = [...ARTICLES].sort(() => rand() - 0.5);
  const now = Date.now();
  return shuffled.map((a, i) => {
    const title = a.titles[Math.floor(rand() * a.titles.length)];
    return {
      slug: a.slug,
      title,
      excerpt: a.excerpt,
      content: a.body,
      cover: `https://picsum.photos/seed/blog-${a.coverSeed}-${seed % 7}/1200/750`,
      metaTitle: title,
      metaDescription: a.excerpt,
      publishedAt: new Date(now - (i * 9 + 3) * 86400000 - hashString(a.key) % 86400000),
    };
  });
}
