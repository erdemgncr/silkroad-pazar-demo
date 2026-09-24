"use client";

import { useState, useTransition } from "react";
import { clsx } from "clsx";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import { ActionForm, Field, GalleryField, Select, TextArea, Toggle, inputCls, labelCls, type FormState } from "./forms";

type Variant = { size: string; stock: number; sku?: string };

export type ProductFormValues = {
  title: string;
  slug: string;
  brand: string;
  model: string;
  colorName: string;
  colorHex: string;
  gender: string;
  category: string;
  price: string;
  compareAtPrice: string;
  sku: string;
  material: string;
  description: string;
  tags: string;
  images: { url: string; alt?: string }[];
  variants: Variant[];
  isNew: boolean;
  isBestSeller: boolean;
  isFeatured: boolean;
  active: boolean;
  releaseDate: string;
};

const PRESETS: Record<string, string[]> = {
  "Erkek (39-46)": ["39", "40", "40.5", "41", "42", "42.5", "43", "44", "44.5", "45", "46"],
  "Kadın (36-41)": ["36", "36.5", "37.5", "38", "38.5", "39", "40", "41"],
  "Çocuk (28-35)": ["28", "29", "30", "31", "32", "33", "34", "35"],
  "Giyim (XS-XXL)": ["XS", "S", "M", "L", "XL", "XXL"],
  Standart: ["STD"],
};

function VariantEditor({ value, onChange }: { value: Variant[]; onChange: (v: Variant[]) => void }) {
  const [newSize, setNewSize] = useState("");
  const total = value.reduce((a, v) => a + v.stock, 0);
  const setAll = (n: number) => onChange(value.map((v) => ({ ...v, stock: n })));
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        {Object.entries(PRESETS).map(([label, sizes]) => (
          <button
            key={label}
            type="button"
            onClick={() => onChange([...value, ...sizes.filter((s) => !value.some((v) => v.size === s)).map((s) => ({ size: s, stock: 0 }))])}
            className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium hover:bg-zinc-50"
          >
            + {label}
          </button>
        ))}
      </div>
      {value.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-zinc-200">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
              <tr>
                <th className="px-3 py-2 font-medium">Beden</th>
                <th className="px-3 py-2 font-medium">Stok</th>
                <th className="hidden px-3 py-2 font-medium sm:table-cell">Beden SKU / barkod</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {value.map((v, i) => (
                <tr key={`${v.size}-${i}`} className={clsx(v.stock < 1 && "bg-rose-50/40")}>
                  <td className="px-3 py-1.5">
                    <input value={v.size} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, size: e.target.value } : x)))} className="h-9 w-20 rounded-md border border-zinc-200 px-2 font-medium" />
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      type="number"
                      min={0}
                      value={v.stock}
                      onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, stock: Math.max(0, Number(e.target.value) || 0) } : x)))}
                      className="h-9 w-20 rounded-md border border-zinc-200 px-2 tabular-nums"
                    />
                  </td>
                  <td className="hidden px-3 py-1.5 sm:table-cell">
                    <input value={v.sku ?? ""} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, sku: e.target.value } : x)))} className="h-9 w-full rounded-md border border-zinc-200 px-2" placeholder="İsteğe bağlı" />
                  </td>
                  <td className="px-2">
                    <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="grid h-8 w-8 place-items-center rounded text-zinc-400 hover:text-rose-600" aria-label="Bedeni kaldır">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input value={newSize} onChange={(e) => setNewSize(e.target.value)} placeholder="Beden (örn. 42.5)" className={clsx(inputCls, "w-40")} />
        <button
          type="button"
          onClick={() => {
            if (newSize.trim() && !value.some((v) => v.size === newSize.trim())) onChange([...value, { size: newSize.trim(), stock: 0 }]);
            setNewSize("");
          }}
          className="inline-flex h-10 items-center gap-1 rounded-lg border border-zinc-300 px-3 text-sm font-semibold"
        >
          <Plus size={15} /> Beden ekle
        </button>
        {value.length > 0 && (
          <>
            <span className="mx-1 text-zinc-300">|</span>
            <button type="button" onClick={() => setAll(5)} className="text-xs font-semibold text-zinc-600 hover:underline">
              Hepsine 5
            </button>
            <button type="button" onClick={() => setAll(0)} className="text-xs font-semibold text-zinc-600 hover:underline">
              Hepsini sıfırla
            </button>
            <span className="ml-auto text-xs text-zinc-500">Toplam stok: {total}</span>
          </>
        )}
      </div>
    </div>
  );
}

export function ProductForm({
  action,
  initial,
  brands,
  categories,
  aiAction,
  submitLabel,
}: {
  action: (s: FormState, f: FormData) => Promise<FormState>;
  initial: ProductFormValues;
  brands: string[];
  categories: { value: string; label: string }[];
  aiAction?: () => Promise<FormState & { description?: string }>;
  submitLabel: string;
}) {
  const [variants, setVariants] = useState<Variant[]>(initial.variants);
  const [description, setDescription] = useState(initial.description);
  const [aiMsg, setAiMsg] = useState<FormState>(null);
  const [pending, start] = useTransition();
  return (
    <ActionForm action={action} submitLabel={submitLabel}>
      <input type="hidden" name="variants" value={JSON.stringify(variants)} />
      <section className="space-y-4">
        <h3 className="font-semibold">Temel bilgiler</h3>
        <Field label="Ürün adı" name="title" defaultValue={initial.title} required placeholder="Nike Air Force 1 '07 Erkek Beyaz Sneaker" />
        <div className="grid gap-4 md:grid-cols-3">
          <label className="block">
            <span className={labelCls}>Marka</span>
            <input name="brand" list="brand-list" defaultValue={initial.brand} required className={inputCls} />
            <datalist id="brand-list">
              {brands.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </label>
          <Field label="Model" name="model" defaultValue={initial.model} required placeholder="Air Force 1 '07" />
          <Field label="Stok kodu (SKU)" name="sku" defaultValue={initial.sku} />
          <Select
            label="Cinsiyet"
            name="gender"
            defaultValue={initial.gender}
            options={[
              { value: "erkek", label: "Erkek" },
              { value: "kadin", label: "Kadın" },
              { value: "cocuk", label: "Çocuk" },
              { value: "unisex", label: "Unisex" },
            ]}
          />
          <Select label="Kategori" name="category" defaultValue={initial.category} options={categories} />
          <Field label="Malzeme" name="material" defaultValue={initial.material} placeholder="Deri, süet…" />
          <Field label="Renk adı" name="colorName" defaultValue={initial.colorName} placeholder="Beyaz/Siyah" />
          <label className="block">
            <span className={labelCls}>Renk kodu</span>
            <input type="color" name="colorHex" defaultValue={initial.colorHex} className="h-10 w-full cursor-pointer rounded-lg border border-zinc-300 bg-white p-1" />
          </label>
          <Field label="Adres (slug)" name="slug" defaultValue={initial.slug} hint="Boş bırakılırsa üründen üretilir." />
        </div>
      </section>

      <section className="space-y-4 border-t border-zinc-100 pt-5">
        <h3 className="font-semibold">Fiyat</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Satış fiyatı (TL)" name="price" inputMode="decimal" defaultValue={initial.price} required placeholder="4799" />
          <Field label="İndirim öncesi fiyat (TL)" name="compareAtPrice" inputMode="decimal" defaultValue={initial.compareAtPrice} hint="Doluysa üstü çizili gösterilir ve indirim oranı hesaplanır." />
        </div>
      </section>

      <section className="space-y-4 border-t border-zinc-100 pt-5">
        <h3 className="font-semibold">Görseller</h3>
        <GalleryField name="images" defaultValue={initial.images} max={12} />
      </section>

      <section className="space-y-4 border-t border-zinc-100 pt-5">
        <h3 className="font-semibold">Bedenler ve stok</h3>
        <VariantEditor value={variants} onChange={setVariants} />
      </section>

      <section className="space-y-3 border-t border-zinc-100 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold">Açıklama</h3>
          {aiAction && (
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const r = await aiAction();
                  setAiMsg(r);
                  if (r?.description) setDescription(r.description);
                })
              }
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              <Sparkles size={15} /> {pending ? "Yazılıyor…" : "AI ile yaz"}
            </button>
          )}
        </div>
        {aiMsg?.error && <p className="text-sm text-rose-600">{aiMsg.error}</p>}
        {aiMsg?.ok && <p className="text-sm text-emerald-700">{aiMsg.message}</p>}
        <TextArea label="Genel ürün açıklaması" name="description" rows={8} value={description} onChange={(e) => setDescription(e.target.value)} hint="Sitelerde bu metin, her siteye özel otomatik SEO metinleriyle birlikte kullanılır. Site bazında farklı metin için sağdaki 'Sitelerde' bölümünü kullanın." />
        <Field label="Etiketler" name="tags" defaultValue={initial.tags} hint="Virgülle ayırın (örn. retro, deri, günlük)." />
      </section>

      <section className="space-y-3 border-t border-zinc-100 pt-5">
        <h3 className="font-semibold">Görünürlük</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Toggle label="Satışta" name="active" defaultChecked={initial.active} hint="Kapalıysa hiçbir sitede görünmez." />
          <Toggle label="Yeni ürün" name="isNew" defaultChecked={initial.isNew} />
          <Toggle label="Çok satan" name="isBestSeller" defaultChecked={initial.isBestSeller} />
          <Toggle label="Öne çıkan" name="isFeatured" defaultChecked={initial.isFeatured} hint="Ana sayfadaki öne çıkanlar bölümünde gösterilir." />
        </div>
        <Field label="Çıkış tarihi (drop)" name="releaseDate" type="datetime-local" defaultValue={initial.releaseDate} hint="Gelecek bir tarih girilirse ürün 'Yakında' olarak listelenir ve 'Gelince haber ver' açılır." />
      </section>
    </ActionForm>
  );
}
