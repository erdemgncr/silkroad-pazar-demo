import Link from "next/link";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { CheckCircle2, CircleDashed, CloudDownload, CloudUpload, KeyRound, Pencil, PlugZap, RefreshCw, Trash2, Webhook, XCircle } from "lucide-react";
import { db, schema } from "@/db";
import { requireMerchant } from "@/lib/panel";
import { formatDateTime } from "@/lib/format";
import { webhookUrl } from "@/lib/shopier/sync";
import { Badge, Card, Notice, PageHeader } from "@/components/panel/ui";
import { ActionButton, ActionForm, Field } from "@/components/panel/forms";
import { deleteShopierAccount, importShopierProducts, pushAllToShopier, saveShopierAccount, setupWebhooks, syncShopierOrders, testShopier } from "@/lib/actions/panel-shopier";

export const metadata = { title: "Shopier Bağlantısı" };

export default async function ShopierPage({ searchParams }: PageProps<"/panel/shopier">) {
  const ctx = await requireMerchant();
  const sp = await searchParams;
  const editId = sp.duzenle === "yeni" ? "yeni" : Number(sp.duzenle) || null;
  const accounts = await db.select().from(schema.shopierAccounts).where(eq(schema.shopierAccounts.merchantId, ctx.merchant.id));
  const ids = accounts.map((a) => a.id);
  const [sites, logs, linkStats] = await Promise.all([
    db.select({ id: schema.sites.id, name: schema.sites.name, acc: schema.sites.shopierAccountId, idx: schema.sites.shopierWebsiteIndex, mode: schema.sites.paymentMode }).from(schema.sites).where(eq(schema.sites.merchantId, ctx.merchant.id)),
    ids.length ? db.select().from(schema.syncLogs).where(inArray(schema.syncLogs.shopierAccountId, ids)).orderBy(desc(schema.syncLogs.createdAt)).limit(25) : [],
    ids.length
      ? db
          .select({ acc: schema.productShopierLinks.shopierAccountId, status: schema.productShopierLinks.status, n: sql<number>`count(*)::int` })
          .from(schema.productShopierLinks)
          .where(inArray(schema.productShopierLinks.shopierAccountId, ids))
          .groupBy(schema.productShopierLinks.shopierAccountId, schema.productShopierLinks.status)
      : [],
  ]);
  const edit = typeof editId === "number" ? accounts.find((a) => a.id === editId) : null;
  const showForm = editId === "yeni" || Boolean(edit) || accounts.length === 0;

  return (
    <>
      <PageHeader
        title="Shopier Bağlantısı"
        description="Ödemeler Shopier güvenli ödeme altyapısıyla alınır; ürünler, stoklar ve siparişler Shopier ile iki yönlü senkronize edilir."
        actions={
          accounts.length > 0 && !showForm ? (
            <Link href="/panel/shopier?duzenle=yeni" className="inline-flex h-10 items-center rounded-full bg-zinc-900 px-4 text-sm font-semibold text-white">
              + Shopier hesabı ekle
            </Link>
          ) : null
        }
      />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {[
          ["1", "Ödeme modülü", "Shopier > Entegrasyonlar > Modül Yönetimi'nden API Key ve API Secret alın. Her hesaba en fazla 5 site bağlanır (website index 1-5)."],
          ["2", "Ürün API'si", "Shopier > Hesabım > Kişisel Erişim Anahtarı (PAT) oluşturun. Ürün aktarımı, stok ve sipariş senkronu için gereklidir."],
          ["3", "Webhook", "Hesabı kaydettikten sonra 'Webhook kur' ile sipariş ve ürün değişiklikleri anında panele düşer."],
        ].map(([n, t, d]) => (
          <div key={n} className="glass rounded-3xl p-4">
            <p className="flex items-center gap-2 font-semibold">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-zinc-900 text-xs text-white">{n}</span> {t}
            </p>
            <p className="mt-2 text-sm text-zinc-500">{d}</p>
          </div>
        ))}
      </div>

      {showForm && (
        <Card title={edit ? `${edit.name} düzenle` : "Shopier hesabı ekle"} className="mb-6" actions={accounts.length ? <Link href="/panel/shopier" className="text-sm font-medium hover:underline">Vazgeç</Link> : undefined}>
          <ActionForm action={saveShopierAccount.bind(null, edit?.id ?? null)} key={edit?.id ?? "yeni"} submitLabel="Kaydet ve bağlantıyı test et">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Hesap adı" name="name" defaultValue={edit?.name ?? ""} placeholder="Ana mağaza" required />
              <Field label="Shopier mağaza adresi" name="shopSlug" defaultValue={edit?.shopSlug ?? ""} placeholder="shopier.com/magazam → magazam" hint="Ürün sayfası ile ödeme modunda kullanılır." />
              <Field label="Kişisel Erişim Anahtarı (PAT)" name="personalAccessToken" type="password" autoComplete="off" placeholder={edit?.personalAccessToken ? "•••••••• (değiştirmek için yazın)" : ""} hint="Ürün, stok, sipariş ve webhook işlemleri için." className="md:col-span-2" />
              <Field label="Ödeme modülü API Key" name="apiKey" type="password" autoComplete="off" placeholder={edit?.apiKey ? "•••••••• (kayıtlı)" : ""} />
              <Field label="Ödeme modülü API Secret" name="apiSecret" type="password" autoComplete="off" placeholder={edit?.apiSecret ? "•••••••• (kayıtlı)" : ""} />
            </div>
            <Notice tone="blue">
              Shopier ödeme modülünde <b>Geri dönüş URL&apos;si</b> olarak her site için şunu girin: <code className="rounded bg-white px-1">https://SİTE-ALANADI/api/shopier/callback</code>
            </Notice>
          </ActionForm>
        </Card>
      )}

      <div className="space-y-6">
        {accounts.map((a) => {
          const used = sites.filter((s) => s.acc === a.id);
          const stat = (st: string) => linkStats.find((l) => l.acc === a.id && l.status === st)?.n ?? 0;
          return (
            <Card
              key={a.id}
              title={a.name}
              description={a.shopSlug ? `shopier.com/${a.shopSlug}` : undefined}
              actions={
                <div className="flex gap-2">
                  <Link href={`/panel/shopier?duzenle=${a.id}`} className="grid h-9 w-9 place-items-center rounded-full border border-black/10 bg-white/70 hover:bg-white" title="Düzenle">
                    <Pencil size={15} />
                  </Link>
                  <ActionButton action={deleteShopierAccount.bind(null, a.id)} variant="danger" confirm={`${a.name} hesabı kaldırılsın mı? Bağlı sitelerin ödeme ayarı sıfırlanır.`}>
                    <Trash2 size={15} />
                  </ActionButton>
                </div>
              }
            >
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-2 text-sm">
                  <p className="font-semibold">Bağlantı durumu</p>
                  <Status ok={Boolean(a.apiKey && a.apiSecret)} label="Ödeme modülü (API Key/Secret)" />
                  <Status ok={Boolean(a.personalAccessToken)} label="Kişisel erişim anahtarı" />
                  <Status ok={a.productApiEnabled === true} pending={a.productApiEnabled == null} label="Ürün API erişimi" />
                  <Status ok={a.webhookIds.length > 0} label={`Webhook (${a.webhookIds.length})`} />
                  {a.lastCheckMessage && <p className="rounded-lg bg-white/40 p-2 text-xs text-zinc-600">{a.lastCheckMessage}</p>}
                  {a.lastCheckAt && <p className="text-xs text-zinc-400">Son kontrol: {formatDateTime(a.lastCheckAt)}</p>}
                </div>
                <div>
                  <p className="mb-2 text-sm font-semibold">Website index (5 site)</p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[1, 2, 3, 4, 5].map((i) => {
                      const s = used.find((x) => x.idx === i);
                      return (
                        <div key={i} className={`rounded-lg border p-1.5 text-center text-[11px] ${s ? "border-zinc-900 bg-zinc-900 text-white" : "border-dashed border-zinc-300 text-zinc-400"}`}>
                          <p className="font-bold">#{i}</p>
                          <p className="truncate">{s ? s.name : "Boş"}</p>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-xs text-zinc-500">Siteyi bağlamak için: Siteler &gt; site &gt; Ödeme sekmesi.</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <Badge tone="green">{stat("synced")} ürün senkron</Badge>
                    {stat("error") > 0 && <Badge tone="red">{stat("error")} hatalı</Badge>}
                    {a.lastSyncStatus && <Badge>{a.lastSyncStatus}</Badge>}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-semibold">İşlemler</p>
                  <ActionButton action={testShopier.bind(null, a.id)}>
                    <PlugZap size={15} /> Bağlantıyı test et
                  </ActionButton>
                  <ActionButton action={pushAllToShopier.bind(null, a.id)} confirm="Satıştaki tüm ürünler Shopier'e aktarılsın mı? (Var olanlar güncellenir)">
                    <CloudUpload size={15} /> {"Tüm ürünleri Shopier'e gönder"}
                  </ActionButton>
                  <ActionButton action={importShopierProducts.bind(null, a.id)}>
                    <CloudDownload size={15} /> {"Shopier'deki ürünleri içe aktar"}
                  </ActionButton>
                  <ActionButton action={syncShopierOrders.bind(null, a.id)}>
                    <RefreshCw size={15} /> Son siparişleri çek
                  </ActionButton>
                  <ActionButton action={setupWebhooks.bind(null, a.id)}>
                    <Webhook size={15} /> Webhook kur
                  </ActionButton>
                  <p className="break-all text-[11px] text-zinc-400">
                    <KeyRound size={11} className="mr-1 inline" />
                    {webhookUrl(a.id)}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {logs.length > 0 && (
        <Card title="Senkron kayıtları" className="mt-6">
          <ul className="divide-y divide-black/5 text-sm">
            {logs.map((l) => (
              <li key={l.id} className="flex flex-wrap items-start gap-3 py-2.5">
                <Badge tone={l.status === "ok" ? "green" : l.status === "error" ? "red" : "zinc"}>{l.kind}</Badge>
                <span className="min-w-0 flex-1">{l.message}</span>
                <span className="text-xs text-zinc-400">{formatDateTime(l.createdAt)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}

function Status({ ok, pending, label }: { ok: boolean; pending?: boolean; label: string }) {
  return (
    <p className="flex items-center gap-2">
      {ok ? <CheckCircle2 size={16} className="text-emerald-500" /> : pending ? <CircleDashed size={16} className="text-zinc-400" /> : <XCircle size={16} className="text-rose-500" />}
      {label}
    </p>
  );
}
