import Link from "next/link";
import { Download } from "lucide-react";
import { requirePanel } from "@/lib/panel";
import { visibleSites } from "@/lib/panel-data";
import { listOrders, orderQs, parseOrderQuery } from "@/lib/panel-orders";
import { formatDateTime, formatPrice } from "@/lib/format";
import { Badge, Empty, FilterBar, PageHeader, Pager, STATUS_BADGE, Stat } from "@/components/panel/ui";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";

export const metadata = { title: "Siparişler" };

const selectCls = "h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm";

export default async function OrdersPage({ searchParams }: PageProps<"/panel/siparisler">) {
  const ctx = await requirePanel();
  const sp = await searchParams;
  const q = parseOrderQuery(sp);
  const sites = await visibleSites(ctx);
  const ids = sites.map((s) => s.id);
  const [{ rows, total, revenue, pages }, open] = await Promise.all([listOrders(ids, q), listOrders(ids, { ...q, status: "acik", page: 1 }, 1)]);
  const siteName = (id: number) => sites.find((s) => s.id === id)?.name ?? "";
  const statusTabs = [
    { key: "", label: "Tümü" },
    { key: "acik", label: "Hazırlanacak" },
    { key: "pending_payment", label: "Ödeme bekleyen" },
    { key: "shipped", label: "Kargoda" },
    { key: "delivered", label: "Teslim edildi" },
    { key: "cancelled", label: "İptal" },
  ];

  return (
    <>
      <PageHeader
        title={ctx.isPlatform ? "Tüm Siparişler" : "Siparişler"}
        description="Sitelerinden ve Shopier'den gelen tüm siparişler tek listede."
        actions={
          <a href={`/api/panel/siparisler${orderQs(q, { page: 1 })}`} className="inline-flex h-10 items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 text-sm font-semibold hover:bg-white">
            <Download size={16} /> Excel (CSV)
          </a>
        }
      />
      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Stat label="Listelenen sipariş" value={total} />
        <Stat label="Listelenen ciro" value={formatPrice(revenue)} hint="Ödenmiş siparişler" />
        <Stat label="Hazırlanacak" value={open.total} hint="Ödeme alındı / hazırlanıyor" />
      </div>
      <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        {statusTabs.map((t) => (
          <Link key={t.key} href={`/panel/siparisler${orderQs(q, { status: t.key, page: 1 })}`} className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium ${q.status === t.key ? "bg-zinc-900 text-white" : "border border-zinc-200 bg-white hover:border-zinc-400"}`}>
            {t.label}
          </Link>
        ))}
      </div>
      <FilterBar>
        <input type="hidden" name="durum" value={q.status} />
        <input name="q" defaultValue={q.q} placeholder="Sipariş no, müşteri, e-posta, telefon, takip no" className={`${selectCls} min-w-0 sm:flex-1 sm:min-w-[240px]`} />
        <select name="site" defaultValue={q.site} className={selectCls}>
          <option value="">Tüm siteler</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select name="kaynak" defaultValue={q.source} className={selectCls}>
          <option value="">Tüm kaynaklar</option>
          <option value="site">Site</option>
          <option value="shopier">Shopier</option>
        </select>
        <input type="date" name="bas" defaultValue={q.from} className={selectCls} aria-label="Başlangıç tarihi" />
        <input type="date" name="bit" defaultValue={q.to} className={selectCls} aria-label="Bitiş tarihi" />
      </FilterBar>

      {rows.length === 0 ? (
        <Empty title="Sipariş bulunamadı" description="Filtreleri değiştirmeyi deneyin." />
      ) : (
        <div className="overflow-hidden glass rounded-3xl">
          <table className="w-full text-sm">
            <thead className="hidden bg-white/40 text-left text-xs text-zinc-500 md:table-header-group">
              <tr>
                <th className="px-4 py-3 font-medium">Sipariş</th>
                <th className="px-4 py-3 font-medium">Müşteri</th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">Site</th>
                <th className="px-4 py-3 font-medium">Tutar</th>
                <th className="px-4 py-3 font-medium">Durum</th>
                <th className="hidden px-4 py-3 font-medium xl:table-cell">Tarih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {rows.map((o) => (
                <tr key={o.id} className="hover:bg-white/60">
                  <td className="px-4 py-3">
                    <Link href={`/panel/siparisler/${o.id}`} className="flex items-center gap-3">
                      <span className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {o.image && <img src={o.image} alt="" className="h-full w-full object-cover" loading="lazy" />}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-semibold hover:underline">{o.orderNo}</span>
                        <span className="block text-xs text-zinc-500">
                          {o.itemCount} ürün {o.source === "shopier" && "· Shopier"}
                        </span>
                        <span className="mt-1 block text-xs text-zinc-500 md:hidden">
                          {o.firstName} {o.lastName} · {formatPrice(o.total)}
                        </span>
                        <span className="mt-1 block md:hidden">
                          <Badge tone={STATUS_BADGE[o.status].tone}>{ORDER_STATUS_LABEL[o.status]}</Badge>
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <p className="font-medium">
                      {o.firstName} {o.lastName}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {o.shippingAddress.city} · {o.phone}
                    </p>
                  </td>
                  <td className="hidden px-4 py-3 text-zinc-600 lg:table-cell">{siteName(o.siteId)}</td>
                  <td className="hidden whitespace-nowrap px-4 py-3 font-semibold tabular-nums md:table-cell">{formatPrice(o.total)}</td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <Badge tone={STATUS_BADGE[o.status].tone}>{ORDER_STATUS_LABEL[o.status]}</Badge>
                    {o.trackingNo && <p className="mt-1 text-xs text-zinc-500">{o.trackingNo}</p>}
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-zinc-500 xl:table-cell">{formatDateTime(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pager page={q.page} pages={pages} href={(p) => `/panel/siparisler${orderQs(q, { page: p })}`} />
    </>
  );
}
