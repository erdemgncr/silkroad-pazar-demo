import { Sparkles } from "lucide-react";
import { requirePlatform } from "@/lib/panel";
import { getPlatformSetting } from "@/lib/platform-settings";
import { PLANS } from "@/lib/plans";
import { Card, Notice, PageHeader, TabNav } from "@/components/panel/ui";
import { ActionButton, ActionForm, Field, Select, TextArea, Toggle } from "@/components/panel/forms";
import { saveAiSettings, saveBillingSettings, saveGeneralSettings, saveSmtpSettings, sendPlatformTestMail, testPlatformAi } from "@/lib/actions/panel-platform";
import { panelUrl } from "@/lib/notify";

export const metadata = { title: "Platform Ayarları" };

export default async function PlatformSettingsPage({ searchParams }: PageProps<"/panel/platform-ayarlari">) {
  const ctx = await requirePlatform();
  const sp = await searchParams;
  const tabs = [
    { key: "genel", label: "Genel" },
    { key: "eposta", label: "E-posta (SMTP)" },
    { key: "ai", label: "AI (Gemini)" },
    { key: "odemeler", label: "Abonelik ödemeleri" },
    { key: "paketler", label: "Paketler" },
  ];
  const tab = tabs.some((t) => t.key === sp.sekme) ? (sp.sekme as string) : "genel";
  const [general, smtp, ai, billing] = await Promise.all([getPlatformSetting("general"), getPlatformSetting("smtp"), getPlatformSetting("ai"), getPlatformSetting("billing")]);
  return (
    <>
      <PageHeader title="Platform Ayarları" description="Tüm satıcı ve siteler için geçerli genel ayarlar. Site bazında SMTP tanımlanmamışsa e-postalar buradaki sunucudan gönderilir." />
      <TabNav tabs={tabs} active={tab} base="/panel/platform-ayarlari" />
      {tab === "genel" && (
        <Card title="Genel">
          <ActionForm action={saveGeneralSettings}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Platform adı" name="platformName" defaultValue={general.platformName} />
              <Field label="Destek e-postası" name="supportEmail" type="email" defaultValue={general.supportEmail} hint="Platform bildirimleri (yeni satıcı, paket talebi) bu adrese gider." />
              <Field label="Sunucu IP adresi" name="serverIp" defaultValue={general.serverIp} hint="Satıcılara alan adı DNS A kaydı için gösterilir." />
              <Select label="Varsayılan paket" name="defaultPlan" defaultValue={general.defaultPlan} options={Object.values(PLANS).map((p) => ({ value: p.key, label: p.name }))} />
              <Field label="Deneme süresi (gün)" name="trialDays" type="number" min={0} defaultValue={general.trialDays} />
            </div>
            <Toggle label="Satıcı kaydı açık" name="signupOpen" defaultChecked={general.signupOpen} hint="Kapalıyken satıcı hesapları yalnızca bu panelden oluşturulur." />
          </ActionForm>
        </Card>
      )}
      {tab === "eposta" && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <Card title="Platform SMTP sunucusu" description="Kendi SMTP ayarı olmayan tüm siteler, müşteri e-postalarını bu sunucudan kendi site adlarıyla gönderir.">
            {!smtp.host && (
              <div className="mb-4">
                <Notice tone="amber">SMTP sunucusu tanımlı değil; e-postalar gönderilmiyor, yalnızca kayıt altına alınıyor.</Notice>
              </div>
            )}
            <ActionForm action={saveSmtpSettings}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="SMTP sunucusu" name="host" defaultValue={smtp.host} placeholder="smtp.sendgrid.net" />
                <Field label="Port" name="port" type="number" defaultValue={smtp.port} />
                <Field label="Kullanıcı adı" name="username" defaultValue={smtp.username} autoComplete="off" />
                <Field label="Şifre" name="password" type="password" placeholder={smtp.password ? "•••••••• (kayıtlı)" : ""} autoComplete="new-password" />
                <Field label="Gönderen e-posta" name="fromEmail" type="email" defaultValue={smtp.fromEmail} placeholder="no-reply@platform.com" />
                <Field label="Varsayılan gönderen adı" name="fromName" defaultValue={smtp.fromName} />
              </div>
              <Toggle label="SSL/TLS (port 465)" name="secure" defaultChecked={smtp.secure} />
            </ActionForm>
          </Card>
          <Card title="Test e-postası">
            <ActionForm action={sendPlatformTestMail} submitLabel="Gönder">
              <Field label="Alıcı" name="to" type="email" defaultValue={general.supportEmail || ctx.user.email} />
            </ActionForm>
          </Card>
        </div>
      )}
      {tab === "ai" && (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card title="Google Gemini" description="Satıcılar kendi anahtarını girmezse bu anahtar kullanılır; satıcı başına aylık kota paketlerden gelir.">
            <ActionForm action={saveAiSettings}>
              <Field label="Gemini API anahtarı" name="geminiApiKey" type="password" autoComplete="off" placeholder={ai.geminiApiKey ? "•••••••• (kayıtlı)" : "AIza…"} />
              <Select
                label="Model"
                name="geminiModel"
                defaultValue={ai.geminiModel}
                options={[
                  { value: "gemini-2.5-flash", label: "gemini-2.5-flash (hızlı, önerilen)" },
                  { value: "gemini-2.5-flash-lite", label: "gemini-2.5-flash-lite (en ekonomik)" },
                  { value: "gemini-2.5-pro", label: "gemini-2.5-pro (en kaliteli)" },
                ]}
              />
              <TextArea label="Yazım tonu" name="tone" rows={2} defaultValue={ai.tone} />
            </ActionForm>
            <div className="mt-4">
              <ActionButton action={testPlatformAi}>
                <Sparkles size={14} /> Bağlantıyı test et
              </ActionButton>
            </div>
          </Card>
          <Card title="Nasıl çalışır?">
            <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-600">
              <li>AI, ürün bilgileri ve sitenin şehir/kargo bilgileriyle her site için farklı Türkçe başlık, meta açıklama ve ürün açıklaması yazar.</li>
              <li>Uydurma özellik, kampanya veya yorum yazmaması için kısıtlanmıştır.</li>
              <li>Satıcı başına aylık kullanım sayılır; ay değişince sıfırlanır.</li>
            </ul>
          </Card>
        </div>
      )}
      {tab === "odemeler" && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <Card title="Satıcılardan paket ücreti tahsilatı" description="Satıcılar Hesap > Paket bölümünden aylık veya yıllık paket satın alır; ödeme onaylanınca paket, limitler ve abonelik süresi otomatik güncellenir.">
            <ActionForm action={saveBillingSettings}>
              <Select
                label="Ödeme modu"
                name="mode"
                defaultValue={billing.mode}
                options={[
                  { value: "demo", label: "Test modu (gerçek ödeme alınmaz)" },
                  { value: "shopier", label: "Shopier ödeme modülü ile kartla tahsilat" },
                ]}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Shopier API Key" name="shopierApiKey" type="password" autoComplete="off" placeholder={billing.shopierApiKey ? "•••••••• (kayıtlı)" : ""} />
                <Field label="Shopier API Secret" name="shopierApiSecret" type="password" autoComplete="off" placeholder={billing.shopierApiSecret ? "•••••••• (kayıtlı)" : ""} />
                <Field label="Website index" name="websiteIndex" type="number" min={1} max={5} defaultValue={billing.websiteIndex} />
                <Field label="Yıllık alım indirimi (%)" name="yearlyDiscountPercent" type="number" min={0} max={60} defaultValue={billing.yearlyDiscountPercent} />
              </div>
              <TextArea label="Havale / EFT bilgisi (isteğe bağlı)" name="bankInfo" rows={3} defaultValue={billing.bankInfo} placeholder={"Banka: …\nIBAN: TR…\nAlıcı: …"} />
            </ActionForm>
          </Card>
          <Card title="Shopier kurulumu">
            <ol className="list-decimal space-y-2 pl-5 text-sm text-zinc-600">
              <li>Platformun kendi Shopier hesabında Entegrasyonlar &gt; Modül Yönetimi&apos;nden API bilgilerini alın.</li>
              <li>
                Geri dönüş adresi olarak şunu girin:
                <code className="mt-1 block break-all rounded bg-zinc-100 px-2 py-1 text-xs">{panelUrl("/api/billing/shopier")}</code>
              </li>
              <li>Havale ile ödeyen satıcıların faturalarını Satıcılar &gt; satıcı sayfasından &quot;Ödendi&quot; olarak onaylayın.</li>
            </ol>
          </Card>
        </div>
      )}
      {tab === "paketler" && (
        <div className="grid gap-5 lg:grid-cols-3">
          {Object.values(PLANS).map((p) => (
            <Card key={p.key} title={`${p.name} · ${p.priceMonthly} ₺/ay`}>
              <ul className="space-y-1 text-sm text-zinc-600">
                <li>Site: {p.siteLimit}</li>
                <li>Ürün: {p.productLimit.toLocaleString("tr-TR")}</li>
                <li>AI metin: {p.aiMonthlyLimit.toLocaleString("tr-TR")}/ay</li>
              </ul>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-zinc-500">
                {p.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </Card>
          ))}
          <p className="text-xs text-zinc-500 lg:col-span-3">Paket fiyat ve limitleri src/lib/plans.ts dosyasından yönetilir; satıcı bazında özel limitler Satıcılar sayfasından verilebilir.</p>
        </div>
      )}
    </>
  );
}
