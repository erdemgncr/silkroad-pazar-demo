# SneakerOS — devir notu (yeni oturum için)

## Proje nedir
Shopier satıcıları için çok kiracılı (multi-tenant) sneaker e-ticaret SaaS'ı. Süper admin paneli, satıcı paneli, satıcı başına sınırsız mağaza sitesi (her biri kendi alan adında), 10 mağaza teması, katalog havuzu, Shopier ödeme/ürün/sipariş entegrasyonu, Gemini ile ürün metni, Türkçe SEO, e-posta/bildirim, abonelik ödemesi.

## Kod nerede
- GitHub: `erdemgncr/silkroad-pazar-demo`, dal `claude/upbeat-maxwell-y7vara`, proje klasörü `sneaker-platform/`.

## Nasıl çalıştırılır (Docker GEREKMEZ)
- Node.js 20.9+ yeterli. Veritabanı gömülü (PGlite), `.data/` klasöründe.
- Windows: `BASLAT.bat` çift tık. macOS/Linux: `./baslat.sh`.
- Elle: `npm install` → `npm run setup` (.env + migration + demo veri) → `npm run dev`.
- Demo veriyi sıfırlamak: `.data` klasörünü sil, yeniden başlat.
- Adresler: http://localhost:3000 (tanıtım), http://localhost:3000/panel (panel), demo mağazalar `http://{kickshane,steparena,hypedrop,kundura,zipla,voltaj,pasaj,kaldirim,nadircift,kelepir}.localhost:3000`.
- Girişler: süper admin `admin@sneaker.local / admin12345`, satıcı `satici@sneaker.local / satici12345`, ikinci satıcı (sitesiz) `adimspor@sneaker.local / adim12345`.
- Kullanıcı daha önce eski bir kopyayı çalıştırıp eski tanıtım sayfasını gördü: eski BASLAT penceresini kapatıp güncel kodu temiz klasörde açmak gerekiyor. Yeni tanıtım sayfasının başlığı "Senin sneaker mağazan!".

## Teknik yapı
- Next.js 16 App Router (`src/proxy.ts` alan adına göre panel/mağaza ayrımı yapar; mağaza yolları içte `/s/{host}/...`), React 19, Tailwind v4, Drizzle ORM (PGlite ya da `DATABASE_URL` ile Postgres).
- Yeni route eklendiğinde `npx next typegen`. Kontroller: `npx tsc --noEmit`, `npx eslint src scripts --quiet`, `npm test` (vitest, 21 test), `npx next build`.
- Önemli yerler: `src/themes/` (10 tema), `src/components/store/` (vitrin), `src/components/panel/shell.tsx` (panel kabuğu), `src/components/panel/ui.tsx` (panel bileşenleri), `src/lib/actions/panel-*.ts` (sunucu işlemleri), `src/lib/ai/commands.ts` (Özelleştir komut ayrıştırıcı), `src/app/globals.css` (tema token'ları + `.glass`, `.orb` cam tasarım sınıfları).

## Son yapılanlar (kullanıcının son isteği)
1. Tanıtım sayfası (`src/app/page.tsx`) Shopier gibi sade, giriş/kayıt odaklı; temalar burada gösterilmiyor.
2. Kayıt = adım adım kurulum sihirbazı (`src/app/panel/kayit/`): Hesap → Mağaza → Tasarım (10 tema + renk) → Ürünler (havuzdan) → Paket → kur. `completeWizard` (panel-auth.ts) satıcı + site + ürünleri oluşturur.
3. Panel aydınlık "liquid glass", MeshQR tarzı: üst sekmeler, sağdan açılan profil menüsü, mobilde alt sekme çubuğu + ortada AI küresi. Özet sayfası yeniden yazıldı.
4. Özelleştir (`/panel/ozellestir`): ortada küre, çevrede 6 alan kartı, altta komut kutusu ("Tüm fiyatlara %5 zam yap" vb.) → önizleme → Uygula. Kural tabanlı Türkçe ayrıştırıcı; Gemini anahtarı varsa serbest cümleler.
5. Katalog (`/panel/katalog`): doğal dille arama, marka/kategori çipleri, görsel seçim, alttan "Mağazama ekle" çubuğu.
Hepsi tarayıcıda uçtan uca test edildi; mobilde taşma yok.

## Kullanıcı hakkında
- Türkçe konuşuyor, hızlı ve eksiksiz sonuç istiyor; Docker kullanmıyor.
- "Bazı hatalar var ama çözeriz" dedi: ilk iş projeyi yerelde çalıştırıp birlikte bakmak, gördüğü hataları sırayla düzeltmek.
- Kendisi istemedikçe PR açma. Commit'leri dalda tut ve gönder.

## Olası sonraki işler
- Kullanıcının yerelde göreceği hataları düzeltmek.
- Ürünler, siparişler ve site ayarları gibi eski panel sayfalarını da Özet/Özelleştir kalitesinde elden geçirmek (şu an toplu stil dönüşümüyle cam görünüme alındılar, düzenleri eski).
