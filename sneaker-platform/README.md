# SneakerOS — Shopier satıcıları için çok siteli sneaker mağaza platformu

Tek panelden sınırsız sneaker e-ticaret sitesi kurup yönetmeyi sağlayan SaaS platformu. Platform yöneticisi (süper admin) satıcıları, paketleri ve ortak ayarları yönetir; her satıcının kendi paneli vardır.

## Özellikler

### Mağaza siteleri
- **10 hazır tema**: Urban, Arena, Neon, Studio, Pulse, Volt, Metro, Brut, Luxe, Outlet. Her temanın header, ana sayfa kurgusu, ürün kartı ve ürün sayfası düzeni farklı. Örnekler:
  - **Volt:** kenardan kenara yatay görsel şeridi ve üzerinde yüzen koyu satın alma kutusu.
  - **Metro:** dikey küçük görseller, model numarası ve beden tavsiyesi.
  - **Outlet:** geri sayımlı fırsatlar ve mobil alt menü.
- **Çok kiracılı yapı:** Her site kendi alan adında; kendi teması, içerikleri, SEO metinleri, SMTP ayarı ve Google hesaplarıyla bağımsız çalışır.
- **Tema önizleme:** Satıcı temayı uygulamadan önce kendi sitesinde, kendi ürünleriyle deneyebilir.
- **Türkiye odaklı SEO:**
  - Site başına benzersiz Türkçe başlık, meta ve açıklama üreten metin motoru.
  - Türkçe slug, TRY Product/Offer şeması, kargo ve iade şemaları, BreadcrumbList, FAQ ve LocalBusiness.
  - Site başına sitemap.xml ve robots.txt.
  - Filtre URL'lerinde noindex; www ve alt alan adından 301 yönlendirme.
- **Yasal sayfalar:** Mesafeli satış, ön bilgilendirme, KVKK, çerez ve üyelik sözleşmesi. Şirket bilgileriyle otomatik dolar ve panelden düzenlenebilir.

### Satıcı paneli
- **Genel bakış:** Ciro ve sipariş trendi, kurulum adımları, çok satanlar, stoğu azalanlar.
- **Site yönetimi:** Genel, ana sayfa (slider/banner/bölümler), iletişim ve şirket, kargo ve fiyat ayarı, SEO ve analitik, alan adları (DNS talimatı), ödeme (Shopier website index doluluğu), e-posta (SMTP ve test), sayfalar, blog, kopyala/sil.
- **Ürünler:**
  - Filtreleme ve toplu işlemler: satışa aç/kapat, öne çıkar, fiyat % değiştir, Shopier'e gönder, sil.
  - Beden/stok editörü ve galeri yükleme.
  - Site bazında SEO metni; **Google Gemini ile her siteye özgün AI açıklama** (tekil veya 20'li toplu).
  - Stok gelince "haber ver" e-postası.
- **Katalog havuzu:** Görselleri, bedenleri ve açıklamaları hazır ürünleri tek tıkla kataloğa ekleme; havuzdan güncelleme.
- **Siparişler:**
  - Durum akışı, kargo firması ve takip no, müşteriye otomatik e-posta.
  - İptal/iadede stok iadesi, Shopier'e kargo bildirimi, Excel (CSV) dışa aktarma.
- **Müşteriler, Kuponlar** (site bazlı, tarih ve limitli), **Mesajlar** (iletişim formu yanıtlama, bülten aboneleri CSV, stok alarmları).
- **Bildirimler:** Panel zili ve e-posta kayıtları. Tercihler: yeni sipariş, mesaj, stok, Shopier hatası, günlük özet.
- **Shopier bağlantısı:** Hesap ekleme ve test, ürün aktarımı (iki yönlü), sipariş çekme, webhook kurulumu, senkron kayıtları.
- **Hesap:** Profil ve şifre, paket kullanımı ve paket talebi, firma bilgileri, kendi Gemini anahtarı, ekip üyeleri.

### Süper admin paneli
- **Satıcılar:** Oluşturma (tek adımda panel kullanıcısı, ilk site ve havuz ürünleri), paket ve limitler, deneme, askıya alma, şifre sıfırlama, silme.
- **Satıcı adına yönetim:** Üst bardaki satıcı seçiciyle istediğin satıcının ürün, Shopier, tema ve hesap ayarlarını yönetebilirsin.
- **Tüm siteler, siparişler, müşteriler ve mesajlar**; **katalog havuzu** yönetimi.
- **Platform ayarları:**
  - Genel: platform adı, destek e-postası, sunucu IP'si, varsayılan paket ve deneme süresi.
  - Platform SMTP ve test e-postası; Gemini anahtarı, model ve yazım tonu.

### E-posta ve bildirimler
- **Gönderim sırası:** Sitenin kendi SMTP'si → platform SMTP'si → ortam değişkenleri. Hiçbiri yoksa e-posta yalnızca kaydedilir.
- **Otomatik e-postalar:** Sipariş onayı, kargoya verildi, durum değişikliği, hoş geldin, şifre sıfırlama, stoğa girdi. Satıcıya yeni sipariş, mesaj, stok ve günlük özet bildirimleri gider.
- **Zamanlanmış işler** (`src/instrumentation.ts`): Her sabah 08:00'de günlük özet ve deneme süresi uyarıları; saatte bir Shopier sipariş yedeği çekimi.

## Bilgisayarında çalıştırma (Docker gerekmez)

Tek gereken **Node.js** (LTS sürümü, nodejs.org). Veritabanı projenin içinde gömülü çalışır (`.data` klasörü).

**Windows:** Klasördeki **`BASLAT.bat`** dosyasına çift tıkla. İlk seferde paketleri kurar, veritabanını ve demo mağazaları hazırlar, sonra tarayıcıda paneli açar. Sonraki açılışlar birkaç saniye sürer.

**macOS / Linux:** `baslat.command` dosyasına çift tıkla ya da terminalde `./baslat.sh` çalıştır.

Elle çalıştırmak istersen:

```bash
npm install
npm run setup     # .env oluşturur, veritabanını ve demo verisini hazırlar
npm run dev       # http://localhost:3000/panel
```

> Demo veriyi sıfırlamak için `.data` klasörünü silip tekrar başlatman yeterli. Harici PostgreSQL kullanmak istersen `.env` içindeki `DATABASE_URL`'i doldur (isteğe bağlı `docker compose up -d` ile yerel PostgreSQL açılabilir).

### Adresler ve girişler

| Ne | Adres | Giriş |
|---|---|---|
| Süper admin | http://localhost:3000/panel | `admin@sneaker.local` / `admin12345` |
| Satıcı paneli | http://localhost:3000/panel | `satici@sneaker.local` / `satici12345` |
| İkinci satıcı (deneme) | http://localhost:3000/panel | `adimspor@sneaker.local` / `adim12345` |

| Tema | Demo site |
|---|---|
| Urban | http://kickshane.localhost:3000 |
| Arena | http://steparena.localhost:3000 |
| Neon | http://hypedrop.localhost:3000 |
| Studio | http://kundura.localhost:3000 |
| Pulse | http://zipla.localhost:3000 |
| Volt | http://voltaj.localhost:3000 |
| Metro | http://pasaj.localhost:3000 |
| Brut | http://kaldirim.localhost:3000 |
| Luxe | http://nadircift.localhost:3000 |
| Outlet | http://kelepir.localhost:3000 |

> `*.localhost` adresleri Chrome, Edge ve Firefox'ta ek ayar gerektirmeden çalışır. Safari'de açılmazsa paneldeki **Önizle** butonunu kullan; site panel adresinde açılır.

Demo siteler **test ödeme modunda** çalışır. Sepet → ödeme → "Ödemeyi Onayla (Test)" akışıyla sipariş oluşur, stok düşer ve sipariş panele gelir. Gerçek ödeme için: Panel → Shopier Bağlantısı → Hesap ekle, ardından sitenin **Ödeme** sekmesinde "Shopier Ödeme Modülü"nü seç.

Demo ürün görselleri `picsum.photos` üzerinden gelir. Gerçek kullanımda görseller katalog havuzundan, panelden yüklenen dosyalardan ya da Shopier'den gelir.

## Canlıya alma (Docker + otomatik SSL)

```bash
cp .env.production.example .env.production   # alan adlarını ve anahtarları doldur
docker compose -f docker-compose.prod.yml up -d --build
```

- **PANEL_HOST** (örn. `panel.ornekplatform.com`) ve **ROOT_DOMAIN** (örn. `ornekplatform.com`) için DNS A kaydını sunucuya yönlendir. Her site otomatik olarak `{site}.ROOT_DOMAIN` adresinden de yayınlanır; bunun için `*.ROOT_DOMAIN` wildcard kaydı eklenmelidir.
- Satıcı kendi alan adının A kaydını sunucu IP'sine yönlendirdiğinde, Caddy ilk ziyarette `/api/tls/ask` ile alan adını doğrular ve Let's Encrypt sertifikasını otomatik alır.
- Veritabanı şeması konteyner açılırken otomatik güncellenir (`scripts/migrate.mjs`). Yüklenen görseller `uploads` biriminde saklanır.
- İlk süper admin için: `ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run db:seed` (geliştirme makinesinden, üretim veritabanına bağlanarak) ya da demo verisiz kurulum için seed betiğini uyarlayın.

## Mimari

```
Tarayıcı ──> proxy.ts ──┬─ ADMIN_HOSTS (panel alan adı) ──> /panel/*  (süper admin + satıcı paneli)
                        └─ diğer alan adları ────────────> /s/{host}/* (mağaza sitesi)
```

| Yol | Açıklama |
|---|---|
| `src/proxy.ts` | Alan adına göre panel ya da mağaza ayrımı; önizleme ve tema önizleme çerezi |
| `src/app/s/[site]/...` | Mağaza sayfaları (site, alan adından çözülür) |
| `src/app/panel/...` | Panel sayfaları; `src/lib/actions/panel-*.ts` sunucu işlemleri |
| `src/themes/` | Tema kaydı (`registry.ts`), header'lar ve ana sayfa kurguları |
| `src/components/store/` | Vitrin bileşenleri (ürün kartı, filtreler, galeri, sepet, ödeme) |
| `src/components/panel/` | Panel kabuğu, form bileşenleri, ürün editörü |
| `src/lib/seo/copy.ts` | Site bazlı benzersiz Türkçe SEO metin motoru |
| `src/lib/ai/gemini.ts` | Gemini ile özgün ürün metni üretimi ve kota takibi |
| `src/lib/shopier/` | Shopier ödeme modülü, REST istemcisi ve senkron işlemleri |
| `src/lib/mailer.ts`, `notify.ts`, `jobs.ts` | E-posta şablonları, bildirimler, zamanlanmış işler |
| `src/db/schema.ts` | Veritabanı şeması (Drizzle ORM, PostgreSQL) |

## Komutlar

| Komut | Açıklama |
|---|---|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build && npm start` | Üretim derlemesi |
| `npm run typecheck` / `npm run lint` | TypeScript ve ESLint kontrolü |
| `npm test` | Birim testleri (Shopier imzaları, SEO motoru) |
| `npm run db:generate` | Şema değişikliğinden migration üret |
| `npm run setup` | Migration + demo verisi |

## Notlar

- Yasal metinler genel şablondur; yayına almadan önce hukuk danışmanınızca gözden geçirilmelidir.
- Shopier ürün API'si mağaza bazında ek yetki gerektirebilir; yetki yoksa 403 döner. Panelde "Bağlantıyı test et" durumu gösterir.
- AI metinleri için Platform Ayarları > AI bölümüne Gemini anahtarı girilmelidir (satıcılar kendi anahtarlarını da kullanabilir).
