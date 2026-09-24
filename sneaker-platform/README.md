# SneakerOS — Shopier satıcıları için çok siteli sneaker mağaza platformu

Tek panelden sınırsız sneaker e-ticaret sitesi kurup yönetmeyi sağlayan SaaS platformu.

- **5 hazır tema** (Urban, Arena, Neon, Studio, Pulse). Her birinin header, ana sayfa, ürün kartı, listeleme ve ürün detay düzeni farklı.
- **Çok kiracılı yapı:** Her site kendi alan adında, kendi teması, içerikleri, SEO metinleri ve Google hesaplarıyla bağımsız çalışır.
- **SaaS:** Platform yöneticisi, satıcılar (Shopier satıcıları), paketler ve limitler.
- **Merkezi katalog havuzu:** Satıcılar görselleri, bedenleri ve açıklamaları hazır ürünleri tek tıkla kendi mağazalarına ekler.
- **Shopier entegrasyonu:**
  - Ödeme modülü (website_index 1-5) ve Shopier ürün sayfası ile ödeme.
  - REST API ile ürün, varyasyon/beden, sipariş ve webhook senkronu.
- **Türkiye odaklı SEO:**
  - Site başına benzersiz başlık, meta ve açıklama üreten metin motoru.
  - Türkçe slug, TRY Product/Offer şeması, kargo ve iade şemaları, LocalBusiness.
  - Site başına sitemap.xml ve robots.txt.
  - Filtre URL'lerinde noindex, www ve alt alan adından 301 yönlendirme.
- **Yasal sayfalar:** Mesafeli satış, ön bilgilendirme, KVKK, çerez, üyelik sözleşmesi. Şirket bilgileriyle otomatik dolar.

## Local'de çalıştırma

Gerekenler: **Node.js 20+** ve **Docker** (PostgreSQL için).

```bash
# 1) Veritabanını başlat
docker compose up -d

# 2) Ortam değişkenleri
cp .env.example .env

# 3) Bağımlılıklar
npm install

# 4) Tabloları oluştur ve demo verisini yükle (katalog havuzu, demo satıcı, 5 örnek site)
npm run setup

# 5) Geliştirme sunucusu
npm run dev
```

### Adresler

| Ne | Adres | Giriş |
|---|---|---|
| Panel (satıcı) | http://localhost:3000/panel | `satici@sneaker.local` / `satici12345` |
| Panel (platform yöneticisi) | http://localhost:3000/panel | `admin@sneaker.local` / `admin12345` |
| Urban tema | http://kickshane.localhost:3000 | |
| Arena tema | http://steparena.localhost:3000 | |
| Neon tema | http://hypedrop.localhost:3000 | |
| Studio tema | http://kundura.localhost:3000 | |
| Pulse tema | http://zipla.localhost:3000 | |

> `*.localhost` adresleri Chrome, Edge ve Firefox'ta ek ayar gerektirmeden çalışır. Safari'de açılmazsa panelde siteler listesindeki **Önizle** butonunu kullan; site panel adresinde açılır.

Demo siteler **test ödeme modunda** çalışır. Sepet → ödeme → "Ödemeyi Onayla (Test)" akışıyla sipariş oluşur, stok düşer ve sipariş panele gelir. Gerçek ödeme için: Panel → Shopier Bağlantısı → Hesap ekle, ardından sitenin ödeme ayarında "Shopier Ödeme Modülü"nü seç.

Demo ürün görselleri `picsum.photos` üzerinden gelir (rastgele fotoğraflar). Gerçek kullanımda görseller katalog havuzundan ya da Shopier'den gelir.

## Mimari

```
Tarayıcı ──> proxy.ts ──┬─ ADMIN_HOSTS (panel alan adı) ──> /panel/*  (panel)
                        └─ diğer alan adları ────────────> /s/{host}/* (mağaza sitesi)
```

- `src/proxy.ts`: Alan adına göre panel ya da mağaza ayrımı. Panelde "Önizle" çerezini de yönetir.
- `src/app/s/[site]/...`: Mağaza sayfaları. Site, alan adından çözülür.
- `src/app/panel/...`: Satıcı ve platform paneli.
- `src/themes/`: Temalar (header'lar, ana sayfa kurguları, kayıt).
- `src/components/store/`: Vitrin bileşenleri (ürün kartı, filtreler, galeri, sepet, ödeme).
- `src/lib/seo/copy.ts`: Site bazlı benzersiz Türkçe SEO metin motoru.
- `src/lib/shopier/`: Shopier ödeme modülü (imza/callback), REST istemcisi ve senkron işlemleri.
- `src/db/schema.ts`: Veritabanı şeması (Drizzle ORM, PostgreSQL).

## Komutlar

| Komut | Açıklama |
|---|---|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build && npm start` | Üretim derlemesi |
| `npm run typecheck` | TypeScript kontrolü |
| `npm test` | Birim testleri (Shopier imzaları, SEO motoru) |
| `npm run db:generate` | Şema değişikliğinden migration üret |
| `npm run setup` | Migration + demo verisi |

## Notlar

- Yasal metinler genel şablondur; yayına almadan önce hukuk danışmanınızca gözden geçirilmelidir.
- Shopier ürün API'si (`/v1/products`) mağaza bazında ek yetki gerektirebilir; yetki yoksa 403 döner. Panelde "Bağlantıyı Test Et" durumu gösterir.
