import Link from "next/link";
import { and, desc, eq, inArray, isNull, sql, type SQL } from "drizzle-orm";
import { Bell, Mail, Package, PackageCheck, Plug, Store, TriangleAlert } from "lucide-react";
import { db, schema } from "@/db";
import { requirePanel, selectedMerchantId } from "@/lib/panel";
import { formatDateTime } from "@/lib/format";
import { Badge, ButtonLink, Card, Empty, PageHeader, Pager, TabNav } from "@/components/panel/ui";
import { ActionButton, ActionForm, Field, Toggle } from "@/components/panel/forms";
import { deleteReadNotifications, markAllNotificationsRead } from "@/lib/actions/panel-common";
import { updateNotifyPrefs } from "@/lib/actions/panel-account";

export const metadata = { title: "Bildirimler" };

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  order: PackageCheck,
  message: Mail,
  stock: Package,
  sync: Plug,
  merchant: Store,
  system: TriangleAlert,
};
const TYPE_LABEL: Record<string, string> = { order: "Sipariş", message: "Mesaj", stock: "Stok", sync: "Shopier", merchant: "Satıcı", system: "Sistem" };

export default async function NotificationsPage({ searchParams }: PageProps<"/panel/bildirimler">) {
  const ctx = await requirePanel();
  const sp = await searchParams;
  const tab = sp.sekme === "eposta" || sp.sekme === "tercihler" ? sp.sekme : "bildirimler";
  const tabs = [
    { key: "bildirimler", label: "Bildirimler" },
    { key: "eposta", label: "E-posta kayıtları" },
    ...(ctx.merchant || (await selectedMerchantId(ctx)) ? [{ key: "tercihler", label: "Tercihler" }] : []),
  ];
  return (
    <>
      <PageHeader title={ctx.isPlatform ? "Bildirim & E-posta" : "Bildirimler"} description="Siparişler, mesajlar, stok uyarıları ve Shopier senkron hataları için panel bildirimleri ile gönderilen tüm e-postaların kaydı." />
      <TabNav tabs={tabs} active={tab} base="/panel/bildirimler" />
      {tab === "bildirimler" && <NotificationList merchantId={ctx.merchant?.id ?? null} type={typeof sp.tur === "string" ? sp.tur : ""} page={Math.max(1, Number(sp.sayfa) || 1)} />}
      {tab === "eposta" && <EmailLogs merchantId={ctx.merchant?.id ?? null} status={typeof sp.durum === "string" ? sp.durum : ""} page={Math.max(1, Number(sp.sayfa) || 1)} />}
      {tab === "tercihler" && <Prefs />}
    </>
  );
}

async function NotificationList({ merchantId, type, page }: { merchantId: number | null; type: string; page: number }) {
  const conds: SQL[] = [merchantId ? eq(schema.notifications.merchantId, merchantId) : isNull(schema.notifications.merchantId)];
  if (type) conds.push(eq(schema.notifications.type, type));
  const where = and(...conds);
  const [rows, [{ n }]] = await Promise.all([
    db.select().from(schema.notifications).where(where).orderBy(desc(schema.notifications.createdAt)).limit(40).offset((page - 1) * 40),
    db.select({ n: sql<number>`count(*)::int` }).from(schema.notifications).where(where),
  ]);
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {["", "order", "message", "stock", "sync", "merchant", "system"].map((t) => (
          <Link key={t} href={`/panel/bildirimler${t ? `?tur=${t}` : ""}`} className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${type === t ? "bg-zinc-900 text-white" : "border border-zinc-200 bg-white hover:border-zinc-400"}`}>
            {t ? TYPE_LABEL[t] : "Tümü"}
          </Link>
        ))}
        <span className="ml-auto flex gap-2">
          <ActionButton action={markAllNotificationsRead}>Tümünü okundu say</ActionButton>
          <ActionButton action={deleteReadNotifications} variant="danger" confirm="Okunmuş bildirimler silinsin mi?">
            Okunanları temizle
          </ActionButton>
        </span>
      </div>
      {rows.length === 0 ? (
        <Empty title="Bildirim yok" description="Yeni sipariş, iletişim mesajı, stok azalması ve Shopier hatalarında burada bildirim görürsün." />
      ) : (
        <div className="overflow-hidden glass rounded-3xl">
          <ul className="divide-y divide-black/5">
            {rows.map((r) => {
              const Icon = ICONS[r.type] ?? Bell;
              const inner = (
                <div className="flex gap-3 px-4 py-3.5">
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${r.readAt ? "bg-zinc-100 text-zinc-400" : "bg-orange-100 text-orange-600"}`}>
                    <Icon size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${r.readAt ? "" : "font-semibold"}`}>{r.title}</p>
                    {r.body && <p className="mt-0.5 text-sm text-zinc-500">{r.body}</p>}
                  </div>
                  <div className="shrink-0 text-right">
                    <Badge>{TYPE_LABEL[r.type] ?? r.type}</Badge>
                    <p className="mt-1 text-xs text-zinc-400">{formatDateTime(r.createdAt)}</p>
                  </div>
                </div>
              );
              return <li key={r.id}>{r.link ? <Link href={r.link} className="block hover:bg-white/60">{inner}</Link> : inner}</li>;
            })}
          </ul>
        </div>
      )}
      <Pager page={page} pages={Math.max(1, Math.ceil(n / 40))} href={(p) => `/panel/bildirimler?${new URLSearchParams({ ...(type ? { tur: type } : {}), sayfa: String(p) })}`} />
    </>
  );
}

async function EmailLogs({ merchantId, status, page }: { merchantId: number | null; status: string; page: number }) {
  const conds: SQL[] = [];
  if (merchantId) conds.push(eq(schema.emailLogs.merchantId, merchantId));
  if (status) conds.push(eq(schema.emailLogs.status, status as "sent"));
  const where = conds.length ? and(...conds) : undefined;
  const [rows, [{ n }], stats] = await Promise.all([
    db.select().from(schema.emailLogs).where(where).orderBy(desc(schema.emailLogs.createdAt)).limit(50).offset((page - 1) * 50),
    db.select({ n: sql<number>`count(*)::int` }).from(schema.emailLogs).where(where),
    db
      .select({ status: schema.emailLogs.status, n: sql<number>`count(*)::int` })
      .from(schema.emailLogs)
      .where(merchantId ? eq(schema.emailLogs.merchantId, merchantId) : undefined)
      .groupBy(schema.emailLogs.status),
  ]);
  const siteIds = [...new Set(rows.map((r) => r.siteId).filter(Boolean) as number[])];
  const sites = siteIds.length ? await db.select({ id: schema.sites.id, name: schema.sites.name }).from(schema.sites).where(inArray(schema.sites.id, siteIds)) : [];
  const count = (s: string) => stats.find((x) => x.status === s)?.n ?? 0;
  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          ["", `Tümü (${count("sent") + count("failed") + count("logged")})`],
          ["sent", `Gönderildi (${count("sent")})`],
          ["failed", `Hatalı (${count("failed")})`],
          ["logged", `SMTP yok (${count("logged")})`],
        ].map(([k, l]) => (
          <Link key={k} href={`/panel/bildirimler?sekme=eposta${k ? `&durum=${k}` : ""}`} className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${status === k ? "bg-zinc-900 text-white" : "border border-zinc-200 bg-white hover:border-zinc-400"}`}>
            {l}
          </Link>
        ))}
      </div>
      {count("logged") > 0 && (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Bazı e-postalar SMTP sunucusu tanımlı olmadığı için gönderilmedi. Site ayarlarında <b>E-posta (SMTP)</b> sekmesinden ya da süper admin platform ayarlarından e-posta sunucusu tanımlayın.
        </p>
      )}
      {rows.length === 0 ? (
        <Empty title="E-posta kaydı yok" />
      ) : (
        <div className="overflow-hidden glass rounded-3xl">
          <table className="w-full text-sm">
            <thead className="hidden bg-white/40 text-left text-xs text-zinc-500 md:table-header-group">
              <tr>
                <th className="px-4 py-3 font-medium">Konu / Alıcı</th>
                <th className="px-4 py-3 font-medium">Şablon</th>
                <th className="px-4 py-3 font-medium">Durum</th>
                <th className="px-4 py-3 font-medium">Tarih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{r.subject}</p>
                    <p className="text-xs text-zinc-500">
                      {r.to}
                      {r.siteId ? ` · ${sites.find((s) => s.id === r.siteId)?.name ?? ""}` : ""} · {r.transport}
                    </p>
                    {r.error && <p className="mt-1 text-xs text-rose-600">{r.error}</p>}
                    <p className="mt-1 text-xs text-zinc-400 md:hidden">{formatDateTime(r.createdAt)}</p>
                  </td>
                  <td className="hidden px-4 py-3 text-zinc-500 md:table-cell">{r.template}</td>
                  <td className="px-4 py-3">
                    <Badge tone={r.status === "sent" ? "green" : r.status === "failed" ? "red" : "amber"}>{r.status === "sent" ? "Gönderildi" : r.status === "failed" ? "Hata" : "SMTP yok"}</Badge>
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-zinc-500 md:table-cell">{formatDateTime(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pager page={page} pages={Math.max(1, Math.ceil(n / 50))} href={(p) => `/panel/bildirimler?${new URLSearchParams({ sekme: "eposta", ...(status ? { durum: status } : {}), sayfa: String(p) })}`} />
    </>
  );
}

async function Prefs() {
  const { requireMerchant } = await import("@/lib/panel");
  const { merchant, user } = await requireMerchant();
  const p = merchant.notifyPrefs;
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card title="E-posta bildirimleri" description="Panel bildirimleri her zaman oluşturulur; aşağıdakiler ayrıca e-posta ile gönderilir.">
        <ActionForm action={updateNotifyPrefs}>
          <Field label="Bildirim e-postası" name="notifyEmail" type="email" defaultValue={merchant.notifyEmail ?? ""} placeholder={merchant.email} hint="Boşsa hesap e-postası kullanılır. Site bazında farklı adres için site ayarları > E-posta sekmesini kullanın." />
          <div className="grid gap-3">
            <Toggle label="Yeni sipariş" name="newOrder" defaultChecked={p.newOrder} hint="Her ödenmiş siparişte sipariş özetiyle." />
            <Toggle label="İletişim formu mesajları" name="contactMessage" defaultChecked={p.contactMessage} />
            <Toggle label="Stok azaldı uyarısı" name="lowStock" defaultChecked={p.lowStock} />
            <Toggle label="Shopier senkron hataları" name="syncError" defaultChecked={p.syncError} />
            <Toggle label="Günlük özet" name="dailySummary" defaultChecked={p.dailySummary} hint="Her sabah önceki günün satış özeti." />
          </div>
        </ActionForm>
      </Card>
      <Card title="Nasıl çalışır?">
        <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-600">
          <li>Bildirim e-postaları, ilgili sitenin SMTP ayarından; yoksa platform e-posta sunucusundan gönderilir.</li>
          <li>Müşterilere giden e-postalar (sipariş onayı, kargo, şifre sıfırlama) her zaman sitenin adıyla gönderilir.</li>
          <li>Tüm gönderimler &quot;E-posta kayıtları&quot; sekmesinde durumuyla birlikte listelenir.</li>
        </ul>
        <div className="mt-4">
          <ButtonLink href="/panel/siteler" variant="secondary">
            Site e-posta ayarları
          </ButtonLink>
        </div>
        <p className="mt-4 text-xs text-zinc-400">Oturum: {user.email}</p>
      </Card>
    </div>
  );
}
