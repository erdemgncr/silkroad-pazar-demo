import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Merchant, Product } from "@/db/schema";
import { getPlatformSetting } from "@/lib/platform-settings";
import { CATEGORY_BY_KEY, GENDER_LABEL } from "@/lib/taxonomy";
import { formatPrice } from "@/lib/format";

/**
 * Google Gemini ile Türkçe, SEO uyumlu ve site bazında özgün ürün metni üretimi.
 * Anahtar sırası: satıcının kendi anahtarı → platform anahtarı (Platform Ayarları) → GEMINI_API_KEY.
 */

export type AiCopy = { title: string; metaTitle: string; metaDescription: string; description: string };

export class AiError extends Error {}

const API = "https://generativelanguage.googleapis.com/v1beta/models";

export async function aiConfig(merchant: Merchant | null) {
  const ai = await getPlatformSetting("ai");
  const key = merchant?.geminiApiKey || ai.geminiApiKey || process.env.GEMINI_API_KEY || "";
  return { key, model: ai.geminiModel || process.env.GEMINI_MODEL || "gemini-2.5-flash", tone: ai.tone, source: merchant?.geminiApiKey ? "merchant" : ai.geminiApiKey ? "platform" : process.env.GEMINI_API_KEY ? "env" : "none" };
}

function period() {
  return new Date().toISOString().slice(0, 7);
}

/** Aylık kullanım hakkını kontrol eder; ay değiştiyse sayacı sıfırlar. */
export async function checkQuota(merchant: Merchant, n = 1) {
  const used = merchant.aiUsagePeriod === period() ? merchant.aiUsedThisMonth : 0;
  // Satıcı kendi anahtarını kullanıyorsa platform kotası uygulanmaz.
  if (!merchant.geminiApiKey && used + n > merchant.aiMonthlyLimit) {
    throw new AiError(`Aylık AI hakkınız doldu (${merchant.aiMonthlyLimit}). Paketinizi yükseltebilir ya da Hesap > AI bölümünden kendi Gemini anahtarınızı ekleyebilirsiniz.`);
  }
  return used;
}

export async function addUsage(merchantId: number, n = 1) {
  const m = await db.query.merchants.findFirst({ where: eq(schema.merchants.id, merchantId) });
  if (!m) return;
  const used = m.aiUsagePeriod === period() ? m.aiUsedThisMonth : 0;
  await db.update(schema.merchants).set({ aiUsedThisMonth: used + n, aiUsagePeriod: period() }).where(eq(schema.merchants.id, merchantId));
}

async function callGemini(key: string, model: string, prompt: string, schemaDef: object): Promise<unknown> {
  const r = await fetch(`${API}/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.9, topP: 0.95, responseMimeType: "application/json", responseSchema: schemaDef },
    }),
    signal: AbortSignal.timeout(45_000),
  });
  const j = (await r.json().catch(() => ({}))) as { candidates?: { content?: { parts?: { text?: string }[] } }[]; error?: { message?: string } };
  if (!r.ok) throw new AiError(`Gemini hatası (HTTP ${r.status}): ${j.error?.message ?? "bilinmeyen hata"}`);
  const text = j.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  try {
    return JSON.parse(text);
  } catch {
    throw new AiError("Gemini geçerli bir yanıt döndürmedi, tekrar deneyin.");
  }
}

function facts(p: Product) {
  const cat = CATEGORY_BY_KEY[p.category];
  const sizes = p.variants.filter((v) => v.stock > 0).map((v) => v.size);
  return [
    `Marka: ${p.brand}`,
    `Model: ${p.model}`,
    `Ürün adı: ${p.title}`,
    `Renk: ${p.colorName}`,
    `Cinsiyet: ${GENDER_LABEL[p.gender]}`,
    `Kategori: ${cat?.label ?? p.category}`,
    p.material ? `Malzeme: ${p.material}` : "",
    `Fiyat: ${formatPrice(p.price)}`,
    sizes.length ? `Stoktaki bedenler: ${sizes.join(", ")}` : "",
    p.description ? `Mevcut açıklama (yeniden yazılacak, kopyalanmayacak): ${p.description.slice(0, 600)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

const COPY_SCHEMA = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    metaTitle: { type: "STRING" },
    metaDescription: { type: "STRING" },
    description: { type: "STRING" },
  },
  required: ["title", "metaTitle", "metaDescription", "description"],
};

/** Belirli bir site için özgün ürün metni üretir (başlık, meta başlık/açıklama, açıklama). */
export async function generateProductCopy(opts: {
  product: Product;
  merchant: Merchant;
  site: { name: string; city: string; shipping: { carrier: string; dispatchDays: string; returnDays: number; freeShippingThreshold: number } } | null;
  extra?: string;
}): Promise<AiCopy> {
  const cfg = await aiConfig(opts.merchant);
  if (!cfg.key) throw new AiError("Gemini API anahtarı tanımlı değil. Süper admin Platform Ayarları > AI bölümünden ya da Hesap > AI bölümünden anahtar ekleyin.");
  await checkQuota(opts.merchant);
  const s = opts.site;
  const prompt = `Sen Türkiye'de sneaker ve spor ayakkabı satan bir e-ticaret sitesi için çalışan kıdemli bir SEO metin yazarısın.
Aşağıdaki ürün için ${s ? `"${s.name}" sitesine özel` : "genel katalog için"} Türkçe ürün metni yaz.

KURALLAR:
- Tamamen özgün yaz; başka sitelerde aynı ürün için yazılmış metinlere benzememeli. Cümle yapısını ve açılışı çeşitlendir.
- Türkçe arama alışkanlıklarını kullan: "${opts.product.brand} ${opts.product.model} ${GENDER_LABEL[opts.product.gender].toLocaleLowerCase("tr-TR")}", "orijinal", "fiyatı", "beden" gibi ifadeleri doğal biçimde geçir; anahtar kelime doldurma yapma.
- Ton: ${cfg.tone}.
- Uydurma teknik özellik, sertifika, kampanya, puan veya müşteri yorumu ekleme. Yalnızca verilen bilgileri ve genel, doğru kullanım önerilerini kullan.
- title: 60-90 karakter, marka + model + cinsiyet + renk + kategori içersin.
- metaTitle: en fazla 60 karakter, sonuna site adı ekleme.
- metaDescription: 140-158 karakter, tıklamaya teşvik eden, ${s ? `kargo/iade avantajına (${s.shipping.dispatchDays} içinde kargo, ${s.shipping.returnDays} gün iade) değinen` : "ürünü özetleyen"} bir cümle.
- description: 3-4 paragraf, toplam 160-260 kelime; paragrafları boş satırla ayır; madde işareti veya başlık kullanma. Stil/kombin önerisi ve bakım ipucu ekle.${s?.city ? `\n- Yerel SEO için bir yerde doğal biçimde "${s.city}" ve "Türkiye'nin her yerine" ifadelerine değin.` : ""}
${opts.extra ? `- Ek talimat: ${opts.extra}` : ""}

ÜRÜN BİLGİLERİ:
${facts(opts.product)}`;
  const out = (await callGemini(cfg.key, cfg.model, prompt, COPY_SCHEMA)) as Partial<AiCopy>;
  if (!out.title || !out.description) throw new AiError("Gemini eksik yanıt döndürdü, tekrar deneyin.");
  await addUsage(opts.merchant.id);
  return {
    title: out.title.trim().slice(0, 140),
    metaTitle: (out.metaTitle ?? out.title).trim().slice(0, 70),
    metaDescription: (out.metaDescription ?? "").trim().slice(0, 170),
    description: out.description.trim(),
  };
}

/** Platform/satıcı anahtarını doğrulamak için basit test çağrısı. */
export async function testGemini(key: string, model: string) {
  const out = (await callGemini(key, model, 'Sadece {"ok": true} döndür.', { type: "OBJECT", properties: { ok: { type: "BOOLEAN" } }, required: ["ok"] })) as { ok?: boolean };
  return Boolean(out.ok);
}

/** Serbest istem için yapılandırılmış (JSON şemalı) Gemini yanıtı. Anahtar yoksa null döner. */
export async function aiJson(merchant: Merchant | null, prompt: string, schemaDef: object): Promise<unknown | null> {
  const cfg = await aiConfig(merchant);
  if (!cfg.key) return null;
  return callGemini(cfg.key, cfg.model, prompt, schemaDef);
}
