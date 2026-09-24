import type { Gender, ProductType } from "@/lib/taxonomy";
import { CATEGORY_BY_KEY, slugify } from "@/lib/taxonomy";

/**
 * Demo katalog. Shopier bağlandığında ürünler Shopier'den senkronize edilir;
 * bu liste yalnızca tasarım/önizleme için kullanılır.
 */

type Colorway = [name: string, hex: string];
type ModelDef = {
  brand: string;
  model: string;
  genders: Gender[];
  category: string;
  price: number;
  sale?: number; // indirim yüzdesi
  colors: Colorway[];
  material: string;
  isNew?: boolean;
  best?: boolean;
  featured?: boolean;
  /** Gelecek tarihli çıkış: "Yakında" takviminde gösterilir. */
  releaseInDays?: number;
  summary: string;
};

const M: ModelDef[] = [
  // Nike
  { brand: "Nike", model: "Air Force 1 '07", genders: ["erkek", "kadin"], category: "sneaker", price: 4799, colors: [["Beyaz", "#ffffff"], ["Siyah", "#111111"], ["Beyaz/Kırmızı", "#ffffff"]], material: "Deri saya, kauçuk taban", best: true, featured: true, summary: "Basketbol sahasından sokağa taşınan zamansız court klasiği; gizli Air yastıklama ve delikli burun detayıyla." },
  { brand: "Nike", model: "Dunk Low Retro", genders: ["erkek", "kadin"], category: "sneaker", price: 4599, colors: [["Beyaz/Siyah", "#ffffff"], ["Gri/Lacivert", "#9ca3af"], ["Yeşil/Beyaz", "#16a34a"]], material: "Deri saya, kauçuk taban", best: true, featured: true, summary: "80'lerin kolej basketbolundan ilham alan, renk bloklu ikonik silüet." },
  { brand: "Nike", model: "Air Max 90", genders: ["erkek", "kadin"], category: "sneaker", price: 5299, sale: 20, colors: [["Beyaz/Gri", "#ffffff"], ["Siyah/Kırmızı", "#111111"]], material: "Deri ve tekstil saya, Max Air taban", best: true, summary: "Görünür Max Air ünitesi ve waffle dış tabanıyla 90'ların koşu ruhunu yaşatır." },
  { brand: "Nike", model: "Air Max Plus", genders: ["erkek"], category: "sneaker", price: 6999, colors: [["Siyah", "#111111"], ["Mavi/Beyaz", "#3b82f6"]], material: "Tekstil saya, Tuned Air taban", isNew: true, summary: "Dalgalı TPU kafes yapısı ve Tuned Air teknolojisiyle cesur bir sokak stili." },
  { brand: "Nike", model: "V2K Run", genders: ["kadin", "erkek"], category: "sneaker", price: 4999, colors: [["Gümüş/Beyaz", "#d1d5db"], ["Siyah/Antrasit", "#111111"]], material: "Mesh ve sentetik saya, köpük taban", isNew: true, featured: true, summary: "Y2K koşu estetiğini tıknaz taban ve metalik detaylarla yeniden yorumlar." },
  { brand: "Nike", model: "Cortez", genders: ["kadin", "erkek"], category: "sneaker", price: 3799, sale: 15, colors: [["Beyaz/Kırmızı/Mavi", "#ffffff"], ["Bej", "#e7d8bf"]], material: "Deri saya, köpük ara taban", summary: "1972'den bu yana değişmeyen ince profil ve klasik renk bloklaması." },
  { brand: "Nike", model: "Pegasus 41", genders: ["erkek", "kadin"], category: "kosu", price: 5499, colors: [["Siyah/Beyaz", "#111111"], ["Mavi/Turuncu", "#3b82f6"]], material: "Mühendislik mesh, ReactX köpük", isNew: true, summary: "Günlük antrenmanlar için tepkili ReactX köpük ve Air Zoom birimleriyle çok yönlü koşu ayakkabısı." },
  { brand: "Nike", model: "Air Max 270", genders: ["erkek", "kadin", "cocuk"], category: "sneaker", price: 5799, sale: 25, colors: [["Siyah/Beyaz", "#111111"], ["Beyaz/Pembe", "#ffffff"]], material: "Mesh saya, Max Air topuk", summary: "Topuktaki 270 derecelik Air ünitesiyle gün boyu yumuşak basış." },
  { brand: "Nike", model: "Giannis Immortality 4", genders: ["erkek"], category: "basketbol", price: 3999, colors: [["Siyah/Turuncu", "#111111"], ["Mor/Yeşil", "#7c3aed"]], material: "Tekstil saya, köpük ara taban", summary: "Hızlı yön değiştirmeler için tasarlanmış hafif ve dengeli basketbol ayakkabısı." },
  { brand: "Nike", model: "Calm Slide", genders: ["erkek", "kadin"], category: "terlik", price: 1899, colors: [["Siyah", "#111111"], ["Bej", "#e7d8bf"]], material: "Tek parça köpük", summary: "Tek parça yumuşak köpük yapısıyla minimalist ve rahat terlik." },
  { brand: "Nike", model: "Air Force 1 (GS)", genders: ["cocuk"], category: "sneaker", price: 3699, colors: [["Beyaz", "#ffffff"], ["Siyah", "#111111"]], material: "Deri saya, kauçuk taban", best: true, summary: "Genç ayaklar için orijinal Air Force 1 tasarımının birebir küçük versiyonu." },

  // Jordan
  { brand: "Jordan", model: "Air Jordan 1 Mid", genders: ["erkek", "kadin"], category: "sneaker", price: 5999, colors: [["Siyah/Kırmızı", "#111111"], ["Beyaz/Mavi", "#ffffff"], ["Gri/Beyaz", "#9ca3af"]], material: "Deri saya, Air-Sole taban", best: true, featured: true, summary: "1985'ten bugüne sneaker kültürünün en ikonik bilek boy silüeti." },
  { brand: "Jordan", model: "Air Jordan 1 Low", genders: ["erkek", "kadin", "cocuk"], category: "sneaker", price: 4999, colors: [["Beyaz/Siyah", "#ffffff"], ["Kahverengi/Bej", "#7c4a21"]], material: "Deri saya, kauçuk taban", best: true, summary: "AJ1 mirasını alçak profilde, günlük kullanıma uygun rahatlıkla sunar." },
  { brand: "Jordan", model: "Air Jordan 4 Retro", genders: ["erkek"], category: "sneaker", price: 9499, colors: [["Beyaz/Gri", "#ffffff"], ["Siyah/Kırmızı", "#111111"]], material: "Nubuk ve deri saya, Air taban", featured: true, releaseInDays: 9, summary: "Kanat detayları ve görünür Air ünitesiyle koleksiyonerlerin gözdesi." },
  { brand: "Jordan", model: "Luka 3", genders: ["erkek"], category: "basketbol", price: 5499, colors: [["Beyaz/Mavi", "#ffffff"], ["Siyah/Sarı", "#111111"]], material: "Tekstil saya, IsoPlate taban", isNew: true, summary: "Adım geri atışlar ve ani duruşlar için stabil platform sunan performans modeli." },

  // adidas
  { brand: "adidas", model: "Samba OG", genders: ["erkek", "kadin"], category: "sneaker", price: 4299, colors: [["Beyaz/Siyah", "#ffffff"], ["Siyah/Beyaz", "#111111"], ["Yeşil/Beyaz", "#16a34a"]], material: "Deri saya, süet T-burun, gum taban", best: true, featured: true, summary: "Futbol antrenmanlarından sokak modasının zirvesine uzanan terrace klasiği." },
  { brand: "adidas", model: "Gazelle", genders: ["erkek", "kadin"], category: "sneaker", price: 3999, sale: 10, colors: [["Lacivert/Beyaz", "#1e3a8a"], ["Kırmızı/Beyaz", "#dc2626"], ["Pembe/Beyaz", "#f9a8d4"]], material: "Süet saya, kauçuk taban", best: true, summary: "Yumuşak süet sayası ve ince profiliyle 60'lardan bu yana vazgeçilmez." },
  { brand: "adidas", model: "Campus 00s", genders: ["erkek", "kadin"], category: "sneaker", price: 4499, colors: [["Gri/Beyaz", "#9ca3af"], ["Siyah/Beyaz", "#111111"], ["Yeşil/Beyaz", "#16a34a"]], material: "Süet saya, kalın kauçuk taban", isNew: true, summary: "Kaykay kültüründen ilham alan tıknaz orantılar ve kalın dilli süet tasarım." },
  { brand: "adidas", model: "Superstar", genders: ["erkek", "kadin", "cocuk"], category: "sneaker", price: 3799, sale: 20, colors: [["Beyaz/Siyah", "#ffffff"], ["Siyah/Beyaz", "#111111"]], material: "Deri saya, kabuk burun", best: true, summary: "Kabuk burnu ve üç bantlı yan detayıyla hip-hop kültürünün simgesi." },
  { brand: "adidas", model: "Stan Smith", genders: ["erkek", "kadin"], category: "sneaker", price: 3999, colors: [["Beyaz/Yeşil", "#ffffff"], ["Beyaz/Lacivert", "#ffffff"]], material: "Deri saya, kauçuk taban", summary: "Tenis kortlarından gelen sade ve temiz çizgilerin en bilinen örneği." },
  { brand: "adidas", model: "Handball Spezial", genders: ["kadin", "erkek"], category: "sneaker", price: 4199, colors: [["Lacivert/Gum", "#1e3a8a"], ["Bej/Kahverengi", "#e7d8bf"]], material: "Süet saya, gum taban", isNew: true, summary: "Hentbol sahasından gelen süet saya ve gum tabanlı retro tasarım." },
  { brand: "adidas", model: "Ultraboost 5", genders: ["erkek", "kadin"], category: "kosu", price: 6999, sale: 30, colors: [["Siyah", "#111111"], ["Beyaz/Gri", "#ffffff"]], material: "Primeknit saya, Light BOOST taban", summary: "Enerji geri dönüşlü Light BOOST taban ile uzun koşularda üst düzey konfor." },
  { brand: "adidas", model: "Adilette 22", genders: ["erkek", "kadin"], category: "terlik", price: 1599, colors: [["Siyah", "#111111"], ["Bej", "#e7d8bf"]], material: "Şeker kamışı bazlı EVA", summary: "Topografik desenli, hafif ve su dostu tasarım terlik." },

  // New Balance
  { brand: "New Balance", model: "530", genders: ["erkek", "kadin"], category: "sneaker", price: 4299, colors: [["Beyaz/Gümüş", "#ffffff"], ["Gri/Lacivert", "#9ca3af"]], material: "Mesh ve sentetik saya, ABZORB taban", best: true, featured: true, summary: "2000'lerin koşu ayakkabılarını anımsatan, katmanlı ve nefes alan tasarım." },
  { brand: "New Balance", model: "9060", genders: ["erkek", "kadin"], category: "sneaker", price: 6499, colors: [["Gri", "#9ca3af"], ["Bej/Kahverengi", "#e7d8bf"], ["Siyah", "#111111"]], material: "Süet ve mesh saya, ABZORB + SBS taban", isNew: true, featured: true, summary: "99X serisinden ilham alan dalgalı taban ve cesur orantılar." },
  { brand: "New Balance", model: "550", genders: ["erkek", "kadin"], category: "sneaker", price: 4599, sale: 15, colors: [["Beyaz/Yeşil", "#ffffff"], ["Beyaz/Lacivert", "#ffffff"]], material: "Deri saya, kauçuk taban", best: true, summary: "1989 basketbol arşivinden dönen temiz ve dengeli court silüeti." },
  { brand: "New Balance", model: "327", genders: ["kadin", "erkek"], category: "sneaker", price: 3999, colors: [["Bej/Turuncu", "#e7d8bf"], ["Siyah/Beyaz", "#111111"]], material: "Süet ve naylon saya, kauçuk taban", summary: "Büyük 'N' logosu ve topuğa tırmanan dış tabanıyla 70'ler ruhu." },
  { brand: "New Balance", model: "2002R", genders: ["erkek"], category: "sneaker", price: 5999, colors: [["Gri", "#9ca3af"], ["Kahverengi", "#7c4a21"]], material: "Süet ve mesh saya, N-ERGY taban", featured: true, summary: "Premium malzemeler ve teknik koşu detaylarının şehirle buluştuğu model." },
  { brand: "New Balance", model: "1080v14", genders: ["erkek", "kadin"], category: "kosu", price: 6299, colors: [["Mavi/Beyaz", "#3b82f6"], ["Siyah", "#111111"]], material: "Hypoknit saya, Fresh Foam X", isNew: true, summary: "Fresh Foam X ara tabanıyla her mesafede yumuşak ve dengeli sürüş." },
  { brand: "New Balance", model: "530 Çocuk", genders: ["cocuk"], category: "sneaker", price: 2999, colors: [["Beyaz/Gümüş", "#ffffff"], ["Pembe/Beyaz", "#f9a8d4"]], material: "Mesh saya, hafif taban", summary: "Yetişkin modelinin sevilen tasarımı, çocuklar için hafifletilmiş yapıda." },

  // Puma
  { brand: "Puma", model: "Speedcat OG", genders: ["kadin", "erkek"], category: "sneaker", price: 3999, colors: [["Kırmızı/Beyaz", "#dc2626"], ["Siyah/Beyaz", "#111111"], ["Pembe", "#f9a8d4"]], material: "Süet saya, ince kauçuk taban", isNew: true, featured: true, summary: "Motorsporları mirasından gelen ince, alçak profilli ve sezonun en çok aranan modeli." },
  { brand: "Puma", model: "Palermo", genders: ["erkek", "kadin"], category: "sneaker", price: 3499, sale: 20, colors: [["Yeşil/Sarı", "#16a34a"], ["Lacivert/Gum", "#1e3a8a"]], material: "Süet saya, gum taban", summary: "80'lerin İngiliz terrace kültüründen ilham alan renkli retro model." },
  { brand: "Puma", model: "Suede Classic", genders: ["erkek", "kadin", "cocuk"], category: "sneaker", price: 2999, sale: 25, colors: [["Siyah/Beyaz", "#111111"], ["Kırmızı/Beyaz", "#dc2626"]], material: "Süet saya, kauçuk taban", summary: "1968'den beri sokakların vazgeçilmezi olan süet ikon." },
  { brand: "Puma", model: "CA Pro Classic", genders: ["erkek", "kadin"], category: "sneaker", price: 3299, colors: [["Beyaz", "#ffffff"], ["Beyaz/Yeşil", "#ffffff"]], material: "Deri saya, kauçuk taban", summary: "California tenis kortlarından ilham alan sade, temiz çizgiler." },
  { brand: "Puma", model: "MB.04", genders: ["erkek"], category: "basketbol", price: 5299, colors: [["Turuncu/Mor", "#f97316"], ["Siyah/Pembe", "#111111"]], material: "Tekstil saya, NITRO köpük", releaseInDays: 16, summary: "NITRO köpük teknolojisi ve cesur renkleriyle sahada fark yaratan imza model." },

  // Converse
  { brand: "Converse", model: "Chuck Taylor All Star Hi", genders: ["erkek", "kadin", "cocuk"], category: "sneaker", price: 2499, colors: [["Siyah", "#111111"], ["Beyaz", "#ffffff"], ["Kırmızı", "#dc2626"]], material: "Kanvas saya, vulkanize kauçuk taban", best: true, summary: "Kanvas saya ve vulkanize tabanıyla bir asırdır değişmeyen bilek boy klasik." },
  { brand: "Converse", model: "Chuck 70 Ox", genders: ["erkek", "kadin"], category: "sneaker", price: 3199, colors: [["Bej", "#e7d8bf"], ["Siyah", "#111111"]], material: "Kalın kanvas, OrthoLite taban", summary: "Daha kalın kanvas ve parlak taban bandıyla premium Chuck deneyimi." },
  { brand: "Converse", model: "Run Star Hike", genders: ["kadin"], category: "sneaker", price: 3799, sale: 15, colors: [["Siyah/Beyaz", "#111111"], ["Beyaz/Gum", "#ffffff"]], material: "Kanvas saya, platform taban", summary: "Testere dişli platform tabanıyla klasik Chuck'ı cesur bir forma taşır." },

  // Vans
  { brand: "Vans", model: "Old Skool", genders: ["erkek", "kadin", "cocuk"], category: "sneaker", price: 2799, colors: [["Siyah/Beyaz", "#111111"], ["Lacivert/Beyaz", "#1e3a8a"], ["Bordo", "#dc2626"]], material: "Süet ve kanvas saya, waffle taban", best: true, summary: "Yan şeridi ve waffle tabanıyla kaykay kültürünün en tanınan modeli." },
  { brand: "Vans", model: "Sk8-Hi", genders: ["erkek", "kadin"], category: "sneaker", price: 3099, colors: [["Siyah/Beyaz", "#111111"], ["Beyaz", "#ffffff"]], material: "Süet ve kanvas saya, dolgulu yaka", summary: "Bilek desteği sunan dolgulu yakasıyla efsanevi bilek boy kaykay ayakkabısı." },
  { brand: "Vans", model: "Knu Skool", genders: ["kadin", "erkek"], category: "sneaker", price: 3299, colors: [["Siyah/Beyaz", "#111111"], ["Yeşil/Beyaz", "#16a34a"]], material: "Süet saya, kalın dolgulu dil", isNew: true, summary: "90'ların şişkin kaykay ayakkabılarını yeniden yorumlayan kalın silüet." },
  { brand: "Vans", model: "Classic Slip-On", genders: ["erkek", "kadin"], category: "sneaker", price: 2499, sale: 20, colors: [["Dama Siyah/Beyaz", "#111111"], ["Siyah", "#111111"]], material: "Kanvas saya, waffle taban", summary: "Bağcıksız pratik yapısı ve dama desenli ikonik görünüm." },

  // Asics
  { brand: "Asics", model: "Gel-1130", genders: ["erkek", "kadin"], category: "sneaker", price: 4299, colors: [["Beyaz/Gümüş", "#ffffff"], ["Siyah/Gri", "#111111"]], material: "Mesh ve sentetik saya, GEL taban", isNew: true, featured: true, summary: "2008 koşu arşivinden dönen, metalik detaylı Y2K favorisi." },
  { brand: "Asics", model: "Gel-Kayano 14", genders: ["erkek", "kadin"], category: "sneaker", price: 5499, colors: [["Beyaz/Mavi", "#ffffff"], ["Gri/Gümüş", "#9ca3af"]], material: "Mesh saya, GEL + SpEVA taban", featured: true, summary: "Teknik koşu detaylarını lifestyle çizgisine taşıyan kült model." },
  { brand: "Asics", model: "Gel-Nimbus 26", genders: ["erkek", "kadin"], category: "kosu", price: 5999, sale: 20, colors: [["Siyah/Turuncu", "#111111"], ["Mavi", "#3b82f6"]], material: "Örgü saya, FF BLAST PLUS ECO", summary: "PureGEL teknolojisiyle uzun mesafede yüksek yastıklama." },

  // Reebok
  { brand: "Reebok", model: "Club C 85", genders: ["erkek", "kadin"], category: "sneaker", price: 2999, sale: 15, colors: [["Beyaz/Yeşil", "#ffffff"], ["Beyaz/Lacivert", "#ffffff"]], material: "Deri saya, EVA ara taban", summary: "1985 tenis kortlarından gelen sade, temiz ve zamansız tasarım." },
  { brand: "Reebok", model: "Classic Leather", genders: ["erkek", "kadin"], category: "sneaker", price: 2799, colors: [["Beyaz", "#ffffff"], ["Siyah", "#111111"]], material: "Yumuşak deri saya, EVA taban", summary: "Yumuşak deri sayası ve konforlu tabanıyla her kombine uyan klasik." },

  // Salomon, Hoka, Skechers, Timberland
  { brand: "Salomon", model: "XT-6", genders: ["erkek", "kadin"], category: "outdoor", price: 7499, colors: [["Siyah", "#111111"], ["Gri/Yeşil", "#9ca3af"]], material: "Mesh saya, Contagrip taban", featured: true, summary: "Ultra maraton performansını şehir stiliyle buluşturan teknik ikon." },
  { brand: "Salomon", model: "Speedcross 6", genders: ["erkek", "kadin"], category: "outdoor", price: 5999, colors: [["Siyah/Yeşil", "#111111"], ["Mavi", "#3b82f6"]], material: "Su itici mesh, agresif tırtıklı taban", summary: "Çamurlu ve yumuşak zeminlerde üstün tutuş sağlayan patika ayakkabısı." },
  { brand: "Hoka", model: "Clifton 9", genders: ["erkek", "kadin"], category: "kosu", price: 5799, colors: [["Siyah/Beyaz", "#111111"], ["Mavi/Turuncu", "#3b82f6"]], material: "Mesh saya, CMEVA köpük", best: true, summary: "Hafifliği ve yumuşak sürüşüyle günlük koşuların favorisi." },
  { brand: "Hoka", model: "Bondi 8", genders: ["erkek", "kadin"], category: "kosu", price: 6299, colors: [["Beyaz", "#ffffff"], ["Siyah", "#111111"]], material: "Mesh saya, maksimum yastıklama", summary: "Serinin en fazla yastıklamalı modeli; uzun süre ayakta kalanlar için ideal." },
  { brand: "Skechers", model: "D'Lites", genders: ["kadin"], category: "sneaker", price: 2699, sale: 20, colors: [["Beyaz/Lacivert", "#ffffff"], ["Siyah", "#111111"]], material: "Deri saya, Air-Cooled Memory Foam", summary: "Hafıza köpüklü iç tabanı ve tıknaz formuyla 90'ların rahat klasiği." },
  { brand: "Timberland", model: "6 Inch Premium Boot", genders: ["erkek", "kadin"], category: "outdoor", price: 7999, sale: 10, colors: [["Buğday", "#c08a3e"], ["Siyah", "#111111"]], material: "Su geçirmez nubuk deri, kauçuk lug taban", best: true, summary: "Su geçirmez deri ve dikişsiz yapısıyla dört mevsim dayanıklı ikonik bot." },

  // Giyim
  { brand: "Nike", model: "Sportswear Club Fleece Hoodie", genders: ["erkek", "kadin"], category: "sweatshirt", price: 2299, colors: [["Siyah", "#111111"], ["Gri Melanj", "#9ca3af"]], material: "%80 pamuk, %20 polyester", best: true, summary: "Yumuşak fırçalanmış iç yüzeyli, rahat kesim kapüşonlu sweatshirt." },
  { brand: "Jordan", model: "Essentials Tişört", genders: ["erkek"], category: "tisort", price: 1199, colors: [["Beyaz", "#ffffff"], ["Siyah", "#111111"]], material: "%100 pamuk", summary: "Göğüs baskılı, rahat kalıp günlük pamuk tişört." },
  { brand: "adidas", model: "Adicolor Classics Eşofman Altı", genders: ["erkek", "kadin"], category: "esofman", price: 1999, sale: 20, colors: [["Siyah/Beyaz", "#111111"], ["Lacivert/Beyaz", "#1e3a8a"]], material: "%100 geri dönüştürülmüş polyester", summary: "Yan bantlı ikonik tasarım, paçası lastikli rahat eşofman altı." },
  { brand: "The North Face", model: "1996 Retro Nuptse Mont", genders: ["erkek", "kadin"], category: "mont", price: 12999, colors: [["Siyah", "#111111"], ["Sarı/Siyah", "#facc15"]], material: "700 dolgu gücünde kaz tüyü", featured: true, summary: "Parlak kaplamalı, kaz tüyü dolgulu ikonik şişme mont." },
  { brand: "New Balance", model: "Sport Essentials Tişört", genders: ["kadin", "erkek"], category: "tisort", price: 999, sale: 15, colors: [["Beyaz", "#ffffff"], ["Bej", "#e7d8bf"]], material: "%100 pamuk", summary: "Logo baskılı, hafif ve nefes alan pamuk tişört." },
  { brand: "Puma", model: "Essentials Sweatshirt", genders: ["erkek", "kadin"], category: "sweatshirt", price: 1599, colors: [["Siyah", "#111111"], ["Yeşil", "#16a34a"]], material: "%68 pamuk, %32 polyester", summary: "Bisiklet yaka, rahat kalıp ve yumuşak dokulu sweatshirt." },

  // Aksesuar
  { brand: "Nike", model: "Heritage Sırt Çantası", genders: ["unisex"], category: "canta", price: 1299, colors: [["Siyah", "#111111"], ["Lacivert", "#1e3a8a"]], material: "%100 polyester", summary: "Ön fermuarlı cebi ve dolgulu askılarıyla günlük kullanıma uygun sırt çantası." },
  { brand: "adidas", model: "Trefoil Baseball Şapka", genders: ["unisex"], category: "sapka", price: 799, colors: [["Siyah", "#111111"], ["Beyaz", "#ffffff"]], material: "%100 pamuk", summary: "Ön yüzü işlemeli, ayarlanabilir arka kayışlı klasik şapka." },
  { brand: "Nike", model: "Everyday Cushioned 3'lü Çorap", genders: ["unisex"], category: "corap", price: 599, colors: [["Beyaz", "#ffffff"], ["Siyah", "#111111"]], material: "Pamuk karışımı", best: true, summary: "Tabanı yastıklamalı, ter emici 3'lü bilekli çorap seti." },
  { brand: "New Balance", model: "6 Panel Şapka", genders: ["unisex"], category: "sapka", price: 699, sale: 10, colors: [["Lacivert", "#1e3a8a"], ["Bej", "#e7d8bf"]], material: "%100 pamuk", summary: "Kavisli siperlikli, nakış logolu 6 panel şapka." },
  { brand: "Puma", model: "Phase Sırt Çantası", genders: ["unisex"], category: "canta", price: 899, colors: [["Siyah", "#111111"], ["Gri", "#9ca3af"]], material: "%100 polyester", summary: "Hafif, kompakt ve fermuarlı ön cepli günlük sırt çantası." },
];

const SIZES: Record<string, string[]> = {
  erkek: ["40", "40.5", "41", "42", "42.5", "43", "44", "44.5", "45", "46"],
  kadin: ["36", "36.5", "37.5", "38", "38.5", "39", "40", "40.5"],
  cocuk: ["28", "29", "30", "31", "32", "33", "34", "35", "36", "37.5"],
  giyim: ["XS", "S", "M", "L", "XL", "XXL"],
  corap: ["35-38", "39-42", "43-46"],
  std: ["STD"],
};

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type DemoProduct = {
  externalId: string;
  slug: string;
  title: string;
  brand: string;
  model: string;
  colorName: string;
  colorHex: string;
  gender: Gender;
  productType: ProductType;
  category: string;
  price: number; // kuruş
  compareAtPrice: number | null;
  description: string;
  material: string;
  sku: string;
  images: { url: string; alt: string }[];
  variants: { size: string; stock: number; sku: string }[];
  tags: string[];
  isNew: boolean;
  isBestSeller: boolean;
  isFeatured: boolean;
  releaseDate: Date | null;
  popularity: number;
};

const GENDER_WORD: Record<Gender, string> = { erkek: "Erkek", kadin: "Kadın", cocuk: "Çocuk", unisex: "Unisex" };

export function buildDemoCatalog(): DemoProduct[] {
  const out: DemoProduct[] = [];
  const rand = rng(20260924);
  let n = 1000;
  for (const m of M) {
    const cat = CATEGORY_BY_KEY[m.category];
    for (const gender of m.genders) {
      m.colors.forEach(([colorName, colorHex], ci) => {
        n++;
        const type = cat.type;
        const sizes =
          type === "ayakkabi"
            ? SIZES[gender === "unisex" ? "erkek" : gender]
            : m.category === "corap"
              ? SIZES.corap
              : type === "aksesuar"
                ? SIZES.std
                : SIZES.giyim;
        const genderWord = GENDER_WORD[gender];
        const title = `${m.brand} ${m.model}`;
        const slug = slugify(`${m.brand} ${m.model} ${gender === "unisex" ? "" : genderWord} ${colorName} ${cat.singular}`);
        const price = gender === "cocuk" && !m.model.includes("GS") && !m.model.includes("Çocuk") ? Math.round(m.price * 0.72) : m.price;
        const priceRounded = Math.round(price / 10) * 10 - 1;
        const sale = m.sale && (ci === 0 || rand() > 0.4) ? m.sale : 0;
        const finalPrice = sale ? Math.round((priceRounded * (100 - sale)) / 100 / 10) * 10 - 1 : priceRounded;
        const variants = sizes.map((size, si) => {
          const r = rand();
          const stock = r < 0.14 ? 0 : r < 0.3 ? 1 + Math.floor(rand() * 2) : 3 + Math.floor(rand() * 18);
          return { size, stock: m.releaseInDays ? 0 : stock, sku: `${n}-${si + 1}` };
        });
        const images = Array.from({ length: 5 }, (_, i) => ({
          url: `https://picsum.photos/seed/${slug}-${i + 1}/900/900`,
          alt: `${title} ${genderWord} ${colorName} ${i === 0 ? "yan görünüm" : `görsel ${i + 1}`}`,
        }));
        const releaseDate = m.releaseInDays ? new Date(Date.now() + m.releaseInDays * 86400000 + ci * 3 * 86400000) : null;
        out.push({
          externalId: `demo-${n}`,
          slug,
          title,
          brand: m.brand,
          model: m.model,
          colorName,
          colorHex,
          gender,
          productType: type,
          category: m.category,
          price: finalPrice * 100,
          compareAtPrice: sale ? priceRounded * 100 : null,
          description: m.summary,
          material: m.material,
          sku: `SP-${slugify(m.brand).slice(0, 3).toUpperCase()}-${n}`,
          images,
          variants,
          tags: [slugify(`${m.brand} ${m.model}`)],
          isNew: Boolean(m.isNew) || rand() > 0.82,
          isBestSeller: Boolean(m.best),
          isFeatured: Boolean(m.featured) && ci === 0,
          releaseDate,
          popularity: Math.floor(rand() * 1000) + (m.best ? 800 : 0) + (m.featured ? 300 : 0),
        });
      });
    }
  }
  return out;
}
