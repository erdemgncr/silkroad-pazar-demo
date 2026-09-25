import { desc, eq } from "drizzle-orm";
import { Pause, Pencil, Play, Trash2 } from "lucide-react";
import Link from "next/link";
import { db, schema } from "@/db";
import { requireMerchant } from "@/lib/panel";
import { formatDate, formatPrice } from "@/lib/format";
import { Badge, Card, Empty, PageHeader } from "@/components/panel/ui";
import { ActionButton, ActionForm, Field, Select, Toggle } from "@/components/panel/forms";
import { deleteCoupon, saveCoupon, toggleCoupon } from "@/lib/actions/panel-marketing";

export const metadata = { title: "Kuponlar" };

export default async function CouponsPage({ searchParams }: PageProps<"/panel/kuponlar">) {
  const ctx = await requireMerchant();
  const sp = await searchParams;
  const editId = Number(sp.duzenle) || null;
  const [coupons, sites] = await Promise.all([
    db.select().from(schema.coupons).where(eq(schema.coupons.merchantId, ctx.merchant.id)).orderBy(desc(schema.coupons.createdAt)),
    db.select({ id: schema.sites.id, name: schema.sites.name }).from(schema.sites).where(eq(schema.sites.merchantId, ctx.merchant.id)),
  ]);
  const edit = coupons.find((c) => c.id === editId) ?? null;
  const now = new Date();
  const state = (c: (typeof coupons)[number]) =>
    !c.active ? { l: "Durduruldu", t: "zinc" as const } : c.endsAt && c.endsAt < now ? { l: "Süresi doldu", t: "red" as const } : c.startsAt && c.startsAt > now ? { l: "Planlandı", t: "blue" as const } : c.usageLimit != null && c.usedCount >= c.usageLimit ? { l: "Limit doldu", t: "amber" as const } : { l: "Aktif", t: "green" as const };
  const d = (x: Date | null) => (x ? x.toISOString().slice(0, 16) : "");

  return (
    <>
      <PageHeader title="Kuponlar" description="Sepette uygulanan indirim kodları. Tüm sitelerde ya da yalnızca seçtiğin sitede geçerli olabilir." />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div>
          {coupons.length === 0 ? (
            <Empty title="Henüz kupon yok" description="Sağdaki formdan ilk kuponunu oluştur." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {coupons.map((c) => {
                const st = state(c);
                return (
                  <div key={c.id} className="flex flex-col glass rounded-3xl p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-mono text-lg font-bold tracking-wide">{c.code}</p>
                        <p className="text-sm font-semibold text-orange-600">{c.type === "percent" ? `%${c.value} indirim` : `${formatPrice(c.value)} indirim`}</p>
                      </div>
                      <Badge tone={st.t}>{st.l}</Badge>
                    </div>
                    <ul className="mt-3 space-y-1 text-xs text-zinc-500">
                      <li>Geçerli: {c.siteId ? sites.find((s) => s.id === c.siteId)?.name : "Tüm siteler"}</li>
                      {c.minTotal > 0 && <li>Alt limit: {formatPrice(c.minTotal)}</li>}
                      <li>
                        Kullanım: {c.usedCount}
                        {c.usageLimit != null ? ` / ${c.usageLimit}` : ""}
                      </li>
                      {(c.startsAt || c.endsAt) && (
                        <li>
                          {c.startsAt ? formatDate(c.startsAt) : "…"} – {c.endsAt ? formatDate(c.endsAt) : "…"}
                        </li>
                      )}
                    </ul>
                    {c.usageLimit != null && (
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                        <div className="h-full bg-orange-500" style={{ width: `${Math.min(100, (c.usedCount / c.usageLimit) * 100)}%` }} />
                      </div>
                    )}
                    <div className="mt-4 flex gap-2">
                      <Link href={`/panel/kuponlar?duzenle=${c.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-black/10 bg-white/70 px-4 text-sm font-semibold hover:bg-white">
                        <Pencil size={14} /> Düzenle
                      </Link>
                      <ActionButton action={toggleCoupon.bind(null, c.id, !c.active)}>{c.active ? <Pause size={14} /> : <Play size={14} />}</ActionButton>
                      <ActionButton action={deleteCoupon.bind(null, c.id)} variant="danger" confirm={`${c.code} silinsin mi?`}>
                        <Trash2 size={14} />
                      </ActionButton>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <Card title={edit ? `${edit.code} düzenle` : "Yeni kupon"} actions={edit ? <Link href="/panel/kuponlar" className="text-sm font-medium hover:underline">Yeni</Link> : undefined}>
          <ActionForm action={saveCoupon.bind(null, edit?.id ?? null)} key={edit?.id ?? "yeni"} resetOnSuccess={!edit} submitLabel={edit ? "Güncelle" : "Kupon oluştur"}>
            <Field label="Kupon kodu" name="code" defaultValue={edit?.code ?? ""} required placeholder="YAZ25" className="uppercase" />
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Tür"
                name="type"
                defaultValue={edit?.type ?? "percent"}
                options={[
                  { value: "percent", label: "Yüzde (%)" },
                  { value: "fixed", label: "Tutar (TL)" },
                ]}
              />
              <Field label="Değer" name="value" inputMode="decimal" defaultValue={edit ? (edit.type === "percent" ? edit.value : edit.value / 100) : ""} required />
            </div>
            <Select label="Geçerli site" name="siteId" defaultValue={String(edit?.siteId ?? "")} options={[{ value: "", label: "Tüm sitelerim" }, ...sites.map((s) => ({ value: String(s.id), label: s.name }))]} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Sepet alt limiti (TL)" name="minTotal" inputMode="decimal" defaultValue={edit ? edit.minTotal / 100 : ""} />
              <Field label="Kullanım limiti" name="usageLimit" type="number" min={1} defaultValue={edit?.usageLimit ?? ""} />
              <Field label="Başlangıç" name="startsAt" type="datetime-local" defaultValue={d(edit?.startsAt ?? null)} />
              <Field label="Bitiş" name="endsAt" type="datetime-local" defaultValue={d(edit?.endsAt ?? null)} />
            </div>
            <Toggle label="Aktif" name="active" defaultChecked={edit?.active ?? true} />
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
