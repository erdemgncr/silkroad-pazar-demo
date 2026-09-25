import Link from "next/link";
import { asc, desc, eq } from "drizzle-orm";
import { Check, Sparkles, Trash2 } from "lucide-react";
import { db, schema } from "@/db";
import { canManageTeam, requireMerchant, requirePanel } from "@/lib/panel";
import { PLANS } from "@/lib/plans";
import { formatDate, formatDateTime, formatPrice } from "@/lib/format";
import { invoiceNo, planPrice } from "@/lib/billing";
import { getPlatformSetting } from "@/lib/platform-settings";
import { startSubscription } from "@/lib/actions/panel-billing";
import { aiConfig } from "@/lib/ai/gemini";
import { merchantCatalogKey } from "@/lib/catalog-admin";
import { Badge, Card, Notice, PageHeader, TabNav } from "@/components/panel/ui";
import { ActionButton, ActionForm, Field, Select, Toggle } from "@/components/panel/forms";
import { addTeamMember, changeAdminPassword, removeTeamMember, testMyAi, updateCompany, updateMerchantAi, updateProfile } from "@/lib/actions/panel-account";

export const metadata = { title: "Hesap ve Paket" };

export default async function AccountPage({ searchParams }: PageProps<"/panel/hesap">) {
  const base = await requirePanel();
  const sp = await searchParams;
  const tabs = [
    { key: "profil", label: "Profil ve şifre" },
    { key: "paket", label: "Paket ve ödemeler" },
    { key: "firma", label: "Firma bilgileri" },
    { key: "ai", label: "AI (Gemini)" },
    { key: "ekip", label: "Ekip" },
  ];
  const tab = tabs.some((t) => t.key === sp.sekme) ? (sp.sekme as string) : "profil";
  return (
    <>
      <PageHeader title={base.isPlatform ? "Satıcı Hesabı" : "Hesap ve Paket"} description={base.isPlatform ? "Seçili satıcının hesap, paket, AI ve ekip ayarları. Profil sekmesi senin kendi hesabındır." : "Profilin, paketin, firma bilgilerin, AI ayarların ve ekibin."} />
      <TabNav tabs={tabs} active={tab} base="/panel/hesap" />
      {tab === "profil" && <Profile />}
      {tab === "paket" && <Plan />}
      {tab === "firma" && <Company />}
      {tab === "ai" && <Ai />}
      {tab === "ekip" && <Team />}
    </>
  );
}

async function Profile() {
  const { user } = await requirePanel();
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card title="Profil">
        <ActionForm action={updateProfile}>
          <Field label="Ad soyad" name="name" defaultValue={user.name} required />
          <Field label="E-posta (giriş)" name="email" type="email" defaultValue={user.email} required />
          <p className="text-xs text-zinc-500">Son giriş: {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "—"}</p>
        </ActionForm>
      </Card>
      <Card title="Şifre değiştir">
        <ActionForm action={changeAdminPassword} resetOnSuccess>
          <Field label="Mevcut şifre" name="current" type="password" autoComplete="current-password" required />
          <Field label="Yeni şifre" name="next" type="password" autoComplete="new-password" minLength={8} required />
          <Field label="Yeni şifre (tekrar)" name="confirm" type="password" autoComplete="new-password" required />
        </ActionForm>
      </Card>
    </div>
  );
}

async function Plan() {
  const { merchant } = await requireMerchant();
  const [sites, products, invoices, billing] = await Promise.all([
    db.$count(schema.sites, eq(schema.sites.merchantId, merchant.id)),
    db.$count(schema.products, eq(schema.products.catalogKey, merchantCatalogKey(merchant.id))),
    db.select().from(schema.subscriptionInvoices).where(eq(schema.subscriptionInvoices.merchantId, merchant.id)).orderBy(desc(schema.subscriptionInvoices.createdAt)).limit(24),
    getPlatformSetting("billing"),
  ]);
  const prices = await Promise.all(Object.values(PLANS).map(async (p) => ({ key: p.key, m1: await planPrice(p.key, 1), m12: await planPrice(p.key, 12) })));
  const aiUsed = merchant.aiUsagePeriod === new Date().toISOString().slice(0, 7) ? merchant.aiUsedThisMonth : 0;
  const now = new Date();
  const bar = (used: number, limit: number) => (
    <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
      <div className={`h-full ${used / limit > 0.9 ? "bg-rose-500" : "bg-zinc-900"}`} style={{ width: `${Math.min(100, (used / Math.max(1, limit)) * 100)}%` }} />
    </div>
  );
  const expired = merchant.paidUntil ? merchant.paidUntil < now : merchant.status === "trial" && merchant.trialEndsAt ? merchant.trialEndsAt < now : false;
  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-zinc-500">Mevcut paket</p>
            <p className="text-2xl font-black">
              {PLANS[merchant.plan].name} <Badge tone={merchant.status === "active" && !expired ? "green" : merchant.status === "trial" ? "amber" : "red"}>{expired ? "Süresi doldu" : merchant.status === "active" ? "Aktif" : merchant.status === "trial" ? "Deneme" : "Askıda"}</Badge>
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              {merchant.paidUntil
                ? `Abonelik bitişi: ${formatDate(merchant.paidUntil)}`
                : merchant.trialEndsAt
                  ? `Deneme bitişi: ${formatDate(merchant.trialEndsAt)}`
                  : "Süresiz (platform tarafından tanımlandı)"}
            </p>
          </div>
          {billing.mode === "demo" && <Badge tone="amber">Ödemeler test modunda</Badge>}
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Site", sites, merchant.siteLimit],
          ["Ürün", products, merchant.productLimit],
          ["AI metin (bu ay)", aiUsed, merchant.geminiApiKey ? Infinity : merchant.aiMonthlyLimit],
        ].map(([l, u, lim]) => (
          <div key={l as string} className="glass rounded-3xl p-5">
            <p className="text-sm text-zinc-500">{l as string}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {u as number} <span className="text-base font-medium text-zinc-400">/ {lim === Infinity ? "∞" : (lim as number)}</span>
            </p>
            {lim !== Infinity && bar(u as number, lim as number)}
          </div>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        {Object.values(PLANS).map((p) => {
          const current = p.key === merchant.plan;
          const pr = prices.find((x) => x.key === p.key)!;
          return (
            <div key={p.key} className={`flex flex-col rounded-2xl border-2 bg-white p-6 ${current ? "border-zinc-900" : "border-zinc-200"}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">{p.name}</h3>
                {current && <Badge tone="green">Mevcut paket</Badge>}
              </div>
              <p className="mt-2 text-3xl font-black">
                {p.priceMonthly.toLocaleString("tr-TR")} ₺<span className="text-sm font-medium text-zinc-500"> / ay</span>
              </p>
              {pr.m12.discount > 0 && (
                <p className="text-sm text-emerald-700">
                  Yıllık: {formatPrice(pr.m12.amount)} ({formatPrice(pr.m12.discount)} indirim)
                </p>
              )}
              <ul className="mt-4 flex-1 space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check size={16} className="mt-0.5 shrink-0 text-emerald-600" /> {f}
                  </li>
                ))}
              </ul>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <ActionButton action={startSubscription.bind(null, p.key, 1)} className="w-full">
                  {current ? "1 ay uzat" : "Aylık al"}
                </ActionButton>
                <ActionButton action={startSubscription.bind(null, p.key, 12)} variant="primary" className="w-full">
                  {current ? "1 yıl uzat" : "Yıllık al"}
                </ActionButton>
              </div>
            </div>
          );
        })}
      </div>
      <Card title="Ödemeler">
        {invoices.length === 0 ? (
          <p className="text-sm text-zinc-500">Henüz ödeme yok.</p>
        ) : (
          <ul className="divide-y divide-black/5 text-sm">
            {invoices.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <Link href={`/panel/abonelik/${i.id}`} className="font-semibold hover:underline">
                  {invoiceNo(i.id)}
                </Link>
                <span className="text-zinc-500">
                  {PLANS[i.plan].name} · {i.months} ay · {formatDate(i.createdAt)}
                </span>
                <span className="font-semibold tabular-nums">{formatPrice(i.amount)}</span>
                <Badge tone={i.status === "paid" ? "green" : i.status === "pending" ? "amber" : "red"}>{i.status === "paid" ? "Ödendi" : i.status === "pending" ? "Bekliyor" : i.status === "failed" ? "Başarısız" : "İptal"}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

async function Company() {
  const { merchant } = await requireMerchant();
  const c = merchant.companyInfo;
  return (
    <Card title="Firma bilgileri" description="Faturalandırma ve platform iletişimi için. Sitelerde görünen şirket bilgileri her sitenin kendi ayarlarından yönetilir.">
      <ActionForm action={updateCompany}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Mağaza / marka adı" name="name" defaultValue={merchant.name} required />
          <Field label="Telefon" name="phone" defaultValue={merchant.phone ?? ""} />
          <Field label="Ticari unvan" name="legalName" defaultValue={c.legalName ?? ""} />
          <Field label="Vergi dairesi" name="taxOffice" defaultValue={c.taxOffice ?? ""} />
          <Field label="Vergi / TC kimlik no" name="taxNumber" defaultValue={c.taxNumber ?? ""} />
          <Field label="Adres" name="address" defaultValue={c.address ?? ""} />
        </div>
      </ActionForm>
    </Card>
  );
}

async function Ai() {
  const { merchant } = await requireMerchant();
  const cfg = await aiConfig(merchant);
  const used = merchant.aiUsagePeriod === new Date().toISOString().slice(0, 7) ? merchant.aiUsedThisMonth : 0;
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card title="Google Gemini" description="Ürünler için her sitene özgün, Türkçe SEO uyumlu başlık, meta açıklama ve ürün açıklaması üretir.">
        <div className="mb-5 flex items-center gap-3 rounded-xl bg-gradient-to-r from-violet-50 to-fuchsia-50 p-4">
          <Sparkles className="text-violet-600" />
          <div className="text-sm">
            <p className="font-semibold">
              {cfg.source === "merchant" ? "Kendi anahtarın kullanılıyor (sınırsız)" : cfg.source === "none" ? "AI henüz etkin değil" : `Platform anahtarı · bu ay ${used}/${merchant.aiMonthlyLimit}`}
            </p>
            <p className="text-zinc-600">Model: {cfg.model}</p>
          </div>
        </div>
        <ActionForm action={updateMerchantAi} resetOnSuccess>
          <Field label="Kendi Gemini API anahtarın (isteğe bağlı)" name="geminiApiKey" type="password" autoComplete="off" placeholder={merchant.geminiApiKey ? "•••••••• (kayıtlı)" : "AIza…"} hint="aistudio.google.com üzerinden ücretsiz oluşturabilirsin. Kendi anahtarınla aylık kota uygulanmaz." />
          {merchant.geminiApiKey && <Toggle label="Kendi anahtarımı kaldır" name="clear" />}
        </ActionForm>
        <div className="mt-4">
          <ActionButton action={testMyAi}>Bağlantıyı test et</ActionButton>
        </div>
      </Card>
      <Card title="Nasıl kullanılır?">
        <ol className="list-decimal space-y-2 pl-5 text-sm text-zinc-600">
          <li>Ürünler sayfasında ürünleri seç, üstteki çubuktan siteyi seçip <b>AI metin üret</b>e bas (tek seferde 20 ürün).</li>
          <li>Ürün düzenleme sayfasında &quot;Sitelerde&quot; bölümünden her site için ayrı ayrı <b>AI ile yaz</b> diyebilirsin.</li>
          <li>Üretilen metinler o siteye özel kaydedilir; aynı ürün her sitende farklı metinle yayınlandığı için Google kopya içerik görmez.</li>
          <li>Metinleri istediğin gibi düzenleyebilir ya da otomatiğe döndürebilirsin.</li>
        </ol>
      </Card>
    </div>
  );
}

async function Team() {
  const ctx = await requireMerchant();
  const users = await db.select().from(schema.adminUsers).where(eq(schema.adminUsers.merchantId, ctx.merchant.id)).orderBy(asc(schema.adminUsers.createdAt));
  const can = canManageTeam(ctx);
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <Card title={`Kullanıcılar (${users.length})`}>
        <ul className="divide-y divide-black/5">
          {users.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-zinc-900 text-sm font-bold text-white">{u.name.slice(0, 1)}</span>
                <div>
                  <p className="font-medium">{u.name}</p>
                  <p className="text-xs text-zinc-500">
                    {u.email} · son giriş {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={u.role === "merchant_owner" ? "violet" : "zinc"}>{u.role === "merchant_owner" ? "Yönetici" : "Personel"}</Badge>
                {can && u.id !== ctx.user.id && (
                  <ActionButton action={removeTeamMember.bind(null, u.id)} variant="danger" confirm={`${u.name} kaldırılsın mı?`}>
                    <Trash2 size={14} />
                  </ActionButton>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Card>
      <Card title="Kullanıcı ekle" description="Eklenen kişiye geçici şifreyle giriş e-postası gönderilir.">
        {can ? (
          <ActionForm action={addTeamMember} resetOnSuccess submitLabel="Davet et">
            <Field label="Ad soyad" name="name" required />
            <Field label="E-posta" name="email" type="email" required />
            <Select
              label="Yetki"
              name="role"
              options={[
                { value: "merchant_staff", label: "Personel (sipariş, ürün, mesaj)" },
                { value: "merchant_owner", label: "Yönetici (tüm yetkiler)" },
              ]}
            />
          </ActionForm>
        ) : (
          <p className="text-sm text-zinc-500">Kullanıcı eklemek için hesap yöneticisi olmalısın.</p>
        )}
      </Card>
    </div>
  );
}
