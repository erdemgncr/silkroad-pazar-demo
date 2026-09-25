import Link from "next/link";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { Download, Mail, MailOpen, Phone, Trash2 } from "lucide-react";
import { db, schema } from "@/db";
import { requirePanel } from "@/lib/panel";
import { visibleSites } from "@/lib/panel-data";
import { formatDateTime } from "@/lib/format";
import { Badge, Card, Empty, PageHeader, TabNav } from "@/components/panel/ui";
import { ActionButton, ActionForm, TextArea } from "@/components/panel/forms";
import { deleteMessage, deleteStockAlert, deleteSubscriber, replyMessage, setMessageRead } from "@/lib/actions/panel-marketing";

export const metadata = { title: "Mesajlar" };

export default async function MessagesPage({ searchParams }: PageProps<"/panel/mesajlar">) {
  const ctx = await requirePanel();
  const sp = await searchParams;
  const tab = sp.sekme === "bulten" || sp.sekme === "stok" ? sp.sekme : "iletisim";
  const sites = await visibleSites(ctx);
  const ids = sites.length ? sites.map((s) => s.id) : [-1];
  const siteName = (id: number) => sites.find((s) => s.id === id)?.name ?? "";
  const [unread, subs, alerts] = await Promise.all([
    db.$count(schema.contactMessages, and(inArray(schema.contactMessages.siteId, ids), eq(schema.contactMessages.read, false))),
    db.$count(schema.newsletterSubscribers, inArray(schema.newsletterSubscribers.siteId, ids)),
    db.$count(schema.stockAlerts, inArray(schema.stockAlerts.siteId, ids)),
  ]);
  const tabs = [
    { key: "iletisim", label: "İletişim formu", badge: unread },
    { key: "bulten", label: "Bülten aboneleri", badge: subs },
    { key: "stok", label: "Gelince haber ver", badge: alerts },
  ];

  return (
    <>
      <PageHeader title="Mesajlar" description="Sitelerinden gelen iletişim formları, bülten aboneleri ve stok bildirimi talepleri." />
      <TabNav tabs={tabs} active={tab} base="/panel/mesajlar" />
      {tab === "iletisim" && <ContactList ids={ids} siteName={siteName} open={Number(sp.ac) || 0} />}
      {tab === "bulten" && <Subscribers ids={ids} siteName={siteName} />}
      {tab === "stok" && <Alerts ids={ids} siteName={siteName} />}
    </>
  );
}

async function ContactList({ ids, siteName, open }: { ids: number[]; siteName: (id: number) => string; open: number }) {
  const rows = await db.select().from(schema.contactMessages).where(inArray(schema.contactMessages.siteId, ids)).orderBy(desc(schema.contactMessages.createdAt)).limit(100);
  if (!rows.length) return <Empty title="Henüz mesaj yok" description="Sitelerindeki iletişim formundan gelen mesajlar burada görünür; ayrıca bildirim e-postası da gönderilir." />;
  return (
    <div className="space-y-3">
      {rows.map((m) => {
        const isOpen = open === m.id;
        return (
          <div key={m.id} className={`rounded-xl border bg-white ${m.read ? "border-zinc-200" : "border-orange-300"}`}>
            <Link href={isOpen ? "/panel/mesajlar" : `/panel/mesajlar?ac=${m.id}`} scroll={false} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:gap-4">
              <span className="flex items-center gap-2">
                {m.read ? <MailOpen size={17} className="text-zinc-400" /> : <Mail size={17} className="text-orange-500" />}
                <span className={m.read ? "font-medium" : "font-bold"}>{m.name}</span>
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-zinc-600">
                <b className="text-zinc-900">{m.subject}</b> — {m.message}
              </span>
              <span className="flex shrink-0 items-center gap-2 text-xs text-zinc-400">
                <Badge>{siteName(m.siteId)}</Badge>
                {formatDateTime(m.createdAt)}
              </span>
            </Link>
            {isOpen && (
              <div className="grid gap-5 border-t border-black/5 p-4 lg:grid-cols-2">
                <div className="space-y-3 text-sm">
                  <p className="whitespace-pre-line leading-relaxed">{m.message}</p>
                  <ul className="space-y-1 text-zinc-600">
                    <li className="flex items-center gap-2">
                      <Mail size={14} /> <a href={`mailto:${m.email}`} className="underline">{m.email}</a>
                    </li>
                    {m.phone && (
                      <li className="flex items-center gap-2">
                        <Phone size={14} /> {m.phone}
                      </li>
                    )}
                    {m.orderNo && <li>Sipariş no: {m.orderNo}</li>}
                  </ul>
                  <div className="flex gap-2">
                    <ActionButton action={setMessageRead.bind(null, m.id, !m.read)}>{m.read ? "Okunmadı işaretle" : "Okundu işaretle"}</ActionButton>
                    <ActionButton action={deleteMessage.bind(null, m.id)} variant="danger" confirm="Mesaj silinsin mi?">
                      <Trash2 size={14} />
                    </ActionButton>
                  </div>
                </div>
                <ActionForm action={replyMessage.bind(null, m.id)} submitLabel="Yanıtı gönder" resetOnSuccess>
                  <TextArea label={`${m.email} adresine yanıt`} name="body" rows={6} defaultValue={`Merhaba ${m.name.split(" ")[0]},\n\n\n\nİyi günler dileriz,\n${siteName(m.siteId)}`} />
                </ActionForm>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

async function Subscribers({ ids, siteName }: { ids: number[]; siteName: (id: number) => string }) {
  const rows = await db.select().from(schema.newsletterSubscribers).where(inArray(schema.newsletterSubscribers.siteId, ids)).orderBy(desc(schema.newsletterSubscribers.createdAt)).limit(300);
  return (
    <Card
      title={`Aboneler (${rows.length})`}
      description="İleti izni vererek bültene katılan ziyaretçiler. Toplu e-posta için CSV'yi e-posta pazarlama aracına aktarabilirsin."
      actions={
        <a href="/api/panel/bulten" className="inline-flex h-9 items-center gap-1.5 rounded-full border border-black/10 bg-white/70 px-4 text-sm font-semibold hover:bg-white">
          <Download size={14} /> CSV
        </a>
      }
    >
      {rows.length === 0 ? (
        <p className="text-sm text-zinc-500">Henüz abone yok.</p>
      ) : (
        <ul className="divide-y divide-black/5 text-sm">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <span className="min-w-0 truncate font-medium">{r.email}</span>
              <span className="flex items-center gap-3">
                <Badge>{siteName(r.siteId)}</Badge>
                <span className="text-xs text-zinc-400">{formatDateTime(r.createdAt)}</span>
                <ActionButton action={deleteSubscriber.bind(null, r.id)} variant="danger" confirm="Abone silinsin mi?">
                  <Trash2 size={13} />
                </ActionButton>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

async function Alerts({ ids, siteName }: { ids: number[]; siteName: (id: number) => string }) {
  const rows = await db
    .select({ a: schema.stockAlerts, title: schema.products.title, pid: schema.products.id, image: sql<string | null>`${schema.products.images}->0->>'url'` })
    .from(schema.stockAlerts)
    .innerJoin(schema.products, eq(schema.products.id, schema.stockAlerts.productId))
    .where(inArray(schema.stockAlerts.siteId, ids))
    .orderBy(desc(schema.stockAlerts.createdAt))
    .limit(300);
  return (
    <Card title={`Bekleyen talepler (${rows.length})`} description="Ürün sayfasında 'Gelince haber ver' diyen müşteriler. İlgili bedene stok girip ürünü kaydettiğinde otomatik e-posta gönderilir.">
      {rows.length === 0 ? (
        <p className="text-sm text-zinc-500">Bekleyen talep yok.</p>
      ) : (
        <ul className="divide-y divide-black/5 text-sm">
          {rows.map(({ a, title, pid, image }) => (
            <li key={a.id} className="flex flex-wrap items-center gap-3 py-2.5">
              <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {image && <img src={image} alt="" className="h-full w-full object-cover" />}
              </span>
              <span className="min-w-0 flex-1">
                <Link href={`/panel/urunler/${pid}`} className="block truncate font-medium hover:underline">
                  {title}
                </Link>
                <span className="text-xs text-zinc-500">
                  {a.email} · {a.size ? `${a.size} numara` : "Satışa çıkınca"} · {siteName(a.siteId)}
                </span>
              </span>
              <span className="text-xs text-zinc-400">{formatDateTime(a.createdAt)}</span>
              <ActionButton action={deleteStockAlert.bind(null, a.id)} variant="danger">
                <Trash2 size={13} />
              </ActionButton>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
