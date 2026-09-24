/**
 * Panelin boş görünmemesi için demo işlem verisi: müşteriler, siparişler, mesajlar, bülten, stok alarmları, bildirimler.
 * Sipariş tablosu boşsa çalışır (tekrar çalıştırmak güvenlidir).
 */
import bcrypt from "bcryptjs";
import { eq, inArray } from "drizzle-orm";
import { db, schema } from "../src/db";
import type { OrderStatus } from "../src/db/schema";
import { TR_CITIES } from "../src/lib/tr-cities";

const FIRST = ["Ahmet", "Mehmet", "Ayşe", "Fatma", "Elif", "Can", "Zeynep", "Emre", "Burak", "Selin", "Deniz", "Mert", "Ece", "Kerem", "Yusuf", "Merve", "Cem", "Buse", "Oğuz", "İrem", "Kaan", "Derya", "Hakan", "Gizem", "Barış"];
const LAST = ["Yılmaz", "Kaya", "Demir", "Şahin", "Çelik", "Yıldız", "Aydın", "Öztürk", "Arslan", "Doğan", "Kılıç", "Aslan", "Koç", "Kurt", "Özdemir", "Polat", "Erdoğan", "Güneş"];
const DISTRICTS: Record<string, string[]> = { İstanbul: ["Kadıköy", "Beşiktaş", "Üsküdar", "Bakırköy", "Ataşehir"], Ankara: ["Çankaya", "Keçiören", "Yenimahalle"], İzmir: ["Karşıyaka", "Bornova", "Konak"], Bursa: ["Nilüfer", "Osmangazi"], Antalya: ["Muratpaşa", "Konyaaltı"], Konya: ["Selçuklu", "Meram"] };
const SUBJECTS = [
  ["Beden değişimi", "Merhaba, 42 numara aldığım ayakkabı biraz dar geldi. 42.5 ile değiştirebilir miyim? Kutusu ve etiketi duruyor."],
  ["Kargo durumu", "Siparişimi 3 gün önce verdim, kargo takip numarası henüz gelmedi. Bilgi verebilir misiniz?"],
  ["Ürün orijinal mi?", "Sitenizdeki ürünler orijinal mi, faturalı mı gönderiliyor? Teşekkürler."],
  ["Toptan alım", "Spor kulübümüz için 25 çift koşu ayakkabısı almak istiyoruz, toplu alımda indirim yapıyor musunuz?"],
  ["İade", "Aldığım ürünü iade etmek istiyorum, iade kodu nasıl alabilirim?"],
  ["Stok sorusu", "Samba OG'nin 38 numarası tekrar gelecek mi? Gelirse haber verebilir misiniz?"],
  ["Fatura", "Siparişimin faturasını şirket adına kesebilir misiniz?"],
  ["Mağaza adresi", "Fiziksel mağazanız var mı, gelip deneyebilir miyim?"],
];

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export async function seedDemoActivity() {
  if ((await db.$count(schema.orders)) > 3) {
    console.log("  demo siparişler zaten var");
    return;
  }
  const r = rng(20260924);
  const pick = <T>(a: readonly T[]) => a[Math.floor(r() * a.length)];
  const sites = await db.select().from(schema.sites);
  const merchant = await db.query.merchants.findFirst({ where: eq(schema.merchants.email, "satici@sneaker.local") });
  if (!merchant || !sites.length) return;
  const mine = sites.filter((s) => s.merchantId === merchant.id);
  const products = await db.select().from(schema.products).where(eq(schema.products.catalogKey, `m:${merchant.id}`));
  const hash = await bcrypt.hash("musteri12345", 10);

  // Müşteriler
  const customers: (typeof schema.customers.$inferSelect)[] = [];
  for (let i = 0; i < 36; i++) {
    const site = mine[i % mine.length];
    const first = pick(FIRST);
    const last = pick(LAST);
    const email = `${first}.${last}${i}`.toLocaleLowerCase("tr-TR").replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c").replace(/i̇/g, "i") + "@example.com";
    const [c] = await db
      .insert(schema.customers)
      .values({ siteId: site.id, email, passwordHash: hash, firstName: first, lastName: last, phone: `05${30 + Math.floor(r() * 9)} ${100 + Math.floor(r() * 899)} ${10 + Math.floor(r() * 89)} ${10 + Math.floor(r() * 89)}`, marketingConsent: r() > 0.4, createdAt: new Date(Date.now() - Math.floor(r() * 60) * 86400000) })
      .onConflictDoNothing()
      .returning();
    if (c) customers.push(c);
  }

  // Siparişler (son 45 gün)
  const statuses: OrderStatus[] = ["delivered", "delivered", "delivered", "shipped", "shipped", "preparing", "paid", "paid", "pending_payment", "cancelled"];
  let n = 0;
  for (let i = 0; i < 72; i++) {
    const site = pick(mine);
    const cust = r() > 0.35 ? customers.find((c) => c.siteId === site.id) : undefined;
    const first = cust?.firstName ?? pick(FIRST);
    const last = cust?.lastName ?? pick(LAST);
    const city = pick(Object.keys(DISTRICTS));
    const address = { fullName: `${first} ${last}`, phone: cust?.phone ?? "0532 000 00 00", city: TR_CITIES.includes(city as never) ? city : "İstanbul", district: pick(DISTRICTS[city]), line: `${pick(["Atatürk", "Cumhuriyet", "İnönü", "Bağdat", "Gazi"])} Cad. No: ${1 + Math.floor(r() * 120)} D: ${1 + Math.floor(r() * 20)}` };
    const lines = Array.from({ length: r() > 0.7 ? 2 : 1 }, () => {
      const p = pick(products);
      const v = pick(p.variants);
      return { p, size: v.size, qty: r() > 0.85 ? 2 : 1 };
    });
    const subtotal = lines.reduce((a, l) => a + l.p.price * l.qty, 0);
    const discount = r() > 0.8 ? Math.round(subtotal * 0.1) : 0;
    const fee = subtotal - discount >= site.settings.shipping.freeShippingThreshold * 100 ? 0 : site.settings.shipping.fee * 100;
    const daysAgo = Math.floor(Math.pow(r(), 1.4) * 45);
    const created = new Date(Date.now() - daysAgo * 86400000 - Math.floor(r() * 36000000));
    let status = pick(statuses);
    if (daysAgo < 2 && (status === "delivered" || status === "shipped")) status = "paid";
    if (daysAgo > 7 && (status === "paid" || status === "preparing")) status = "delivered";
    const orderNo = `${site.slug.slice(0, 3).toUpperCase()}${created.toISOString().slice(2, 10).replace(/-/g, "")}${String(1000 + i).slice(-4)}`;
    const [o] = await db
      .insert(schema.orders)
      .values({
        siteId: site.id,
        orderNo,
        customerId: cust?.id ?? null,
        email: cust?.email ?? `${first}.${last}.${i}@example.com`.toLocaleLowerCase("tr-TR"),
        phone: address.phone,
        firstName: first,
        lastName: last,
        shippingAddress: address,
        billingAddress: address,
        subtotal,
        discount,
        shippingFee: fee,
        total: subtotal - discount + fee,
        couponCode: discount ? "HOSGELDIN" : null,
        status,
        paymentRef: status === "pending_payment" ? null : `SHP${Math.floor(r() * 1e8)}`,
        installment: r() > 0.7 ? pick([3, 6, 9]) : null,
        source: r() > 0.85 ? "shopier" : "site",
        shippingCompany: ["shipped", "delivered"].includes(status) ? site.settings.shipping.carrier : null,
        trackingNo: ["shipped", "delivered"].includes(status) ? String(Math.floor(1e11 + r() * 8e11)) : null,
        createdAt: created,
        updatedAt: created,
      })
      .onConflictDoNothing()
      .returning();
    if (!o) continue;
    await db.insert(schema.orderItems).values(lines.map((l) => ({ orderId: o.id, productId: l.p.id, title: `${l.p.model} ${l.p.colorName}`, brand: l.p.brand, size: l.size, quantity: l.qty, unitPrice: l.p.price, image: l.p.images[0]?.url ?? null })));
    n++;
  }
  console.log(`  ${customers.length} müşteri, ${n} sipariş`);

  // İletişim mesajları
  for (let i = 0; i < SUBJECTS.length; i++) {
    const site = mine[i % mine.length];
    const first = pick(FIRST);
    const last = pick(LAST);
    await db.insert(schema.contactMessages).values({ siteId: site.id, name: `${first} ${last}`, email: `${first}${i}@example.com`.toLocaleLowerCase("tr-TR"), phone: r() > 0.5 ? "0533 111 22 33" : null, subject: SUBJECTS[i][0], message: SUBJECTS[i][1], read: i > 3, createdAt: new Date(Date.now() - i * 26 * 3600000) });
  }
  // Bülten
  for (let i = 0; i < 28; i++) {
    await db.insert(schema.newsletterSubscribers).values({ siteId: pick(mine).id, email: `abone${i}@example.com`, createdAt: new Date(Date.now() - Math.floor(r() * 40) * 86400000) }).onConflictDoNothing();
  }
  // Stok alarmları (tükenen bedenlere)
  const out = products.filter((p) => p.variants.some((v) => v.stock === 0)).slice(0, 6);
  for (const p of out) {
    const v = p.variants.find((x) => x.stock === 0)!;
    await db.insert(schema.stockAlerts).values({ siteId: pick(mine).id, productId: p.id, size: v.size, email: `bekleyen${p.id}@example.com` });
  }

  // Bildirimler
  const recent = await db.select().from(schema.orders).where(inArray(schema.orders.siteId, mine.map((s) => s.id))).orderBy(schema.orders.createdAt);
  const last5 = recent.filter((o) => o.status !== "pending_payment").slice(-6);
  for (const o of last5) {
    await db.insert(schema.notifications).values({ merchantId: merchant.id, siteId: o.siteId, type: "order", title: `Yeni sipariş: ${o.orderNo} (${(o.total / 100).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })})`, body: `${o.firstName} ${o.lastName} · ${sites.find((s) => s.id === o.siteId)?.name}`, link: `/panel/siparisler/${o.id}`, createdAt: o.createdAt, readAt: o === last5[last5.length - 1] ? null : o.createdAt });
  }
  await db.insert(schema.notifications).values([
    { merchantId: merchant.id, type: "message", title: `Yeni mesaj: ${SUBJECTS[0][0]}`, body: SUBJECTS[0][1].slice(0, 120), link: "/panel/mesajlar" },
    { merchantId: merchant.id, type: "stock", title: `Stok azaldı: ${products[3]?.title ?? "Ürün"}`, body: "42 numara: 1 adet", link: products[3] ? `/panel/urunler/${products[3].id}` : null },
    { merchantId: merchant.id, type: "system", title: "Hoş geldin! Kurulumu tamamlamak için Shopier hesabını bağla", body: "Ödeme ve ürün senkronu için Shopier API bilgilerini gir.", link: "/panel/shopier", readAt: new Date() },
    { merchantId: null, type: "merchant", title: "Yeni satıcı: Adım Spor", body: "Başlangıç paket · deneme", link: "/panel/saticilar" },
    { merchantId: null, type: "system", title: "Platform SMTP sunucusu tanımlı değil", body: "Müşteri e-postalarının gönderilmesi için Platform Ayarları > E-posta bölümünden SMTP tanımlayın.", link: "/panel/platform-ayarlari?sekme=eposta" },
  ]);
  console.log("  mesajlar, bülten, stok alarmları ve bildirimler eklendi");
}

/** Süper admin görünümü için ikinci (deneme) satıcı. */
export async function seedSecondMerchant() {
  const email = "adimspor@sneaker.local";
  if (await db.query.merchants.findFirst({ where: eq(schema.merchants.email, email) })) return;
  const [m] = await db
    .insert(schema.merchants)
    .values({ name: "Adım Spor", email, phone: "0312 000 00 00", status: "trial", plan: "baslangic", siteLimit: 1, productLimit: 200, aiMonthlyLimit: 100, trialEndsAt: new Date(Date.now() + 10 * 86400000) })
    .returning();
  await db.insert(schema.adminUsers).values({ merchantId: m.id, email, name: "Adım Spor Yetkilisi", role: "merchant_owner", passwordHash: await bcrypt.hash("adim12345", 10) });
  console.log("  ikinci satıcı: adimspor@sneaker.local / adim12345");
}
