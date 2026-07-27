# Item görselleri

Bu klasör oyundan çıkarılmış ekipman ikonlarını tutar. Klasör boşken uygulama
sorunsuz çalışır — `ItemIconBox` çizilmiş siluetlere düşer.

## Görseller nasıl eklenir

1. **Oyun arşivini aç.** Silkroad kurulumundaki `Media.pk2` dosyasını bir pk2
   çıkarıcıyla açıp `icon\` klasörünü bir yere çıkar.

2. **DDJ dosyalarını PNG'ye çevir.** DDJ, Joymax'ın DDS sarmalayıcısıdır:
   ilk 20 bayt kendi başlığı, sonrası standart DDS. Dönüştürücü hazır:

   ```bash
   pip install pillow
   python tools/ddj_to_png.py "C:/cikardigin/icon" -o assets/items
   ```

3. **Dosya adlarını eşle.** Uygulama şu kalıbı arar:

   ```
   assets/items/{iconBase}_{derece}.png   → 13D Sun Blade  = ch_blade_13.png
   assets/items/{iconBase}.png            → dereceden bağımsız genel görsel
   ```

   `iconBase` değerleri `lib/data/models.dart` içindeki `ItemKind` enum'unda
   tanımlı: `ch_sword`, `ch_blade`, `ch_spear`, `ch_tblade`, `ch_bow`,
   `eu_sword`, `eu_tsword`, `eu_axe`, `eu_dagger`, `eu_cbow`, `eu_harp`,
   `eu_staff`, `eu_tstaff`, `shield`, `ch_garment`, `ch_protector`,
   `ch_heavy`, `eu_clothes`, `eu_light`, `eu_heavy`, `earring`, `necklace`,
   `ring`, `avatar`, `pet_attack`, `pet_grab`, `stone`, `elixir`.

4. **Çalıştır.** `flutter run` — ikonlar otomatik görünür, ayrıca kod
   değişikliği gerekmez.

## Telif

İkonlar Joymax'a aittir. Kendi oyun kurulumundan çıkarıp fan platformunda
kullanmak yaygın bir uygulamadır ancak resmi bir izin değildir. Ticari
kullanımda hak sahibinden izin alınmalıdır.
