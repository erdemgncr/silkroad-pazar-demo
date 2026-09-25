"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { ArrowDown, ArrowUp, CircleAlert, CircleCheck, ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react";

export type FormState = { ok?: boolean; error?: string; message?: string } | null;

export const inputCls = "h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none transition-colors focus:border-zinc-900 disabled:bg-zinc-50";
export const labelCls = "mb-1.5 block text-sm font-medium text-zinc-700";

/** Server action'ı çalıştıran, sonucu gösteren form. */
export function ActionForm({
  action,
  children,
  submitLabel = "Kaydet",
  className,
  resetOnSuccess,
  danger,
  footer = true,
}: {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  children: React.ReactNode;
  submitLabel?: string;
  className?: string;
  resetOnSuccess?: boolean;
  danger?: boolean;
  footer?: boolean;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null);
  const ref = useRef<HTMLFormElement>(null);
  const [shown, setShown] = useState<FormState>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShown(state);
    if (state?.ok && resetOnSuccess) ref.current?.reset();
    if (state?.ok) {
      const t = window.setTimeout(() => setShown(null), 4000);
      return () => window.clearTimeout(t);
    }
  }, [state, resetOnSuccess]);
  return (
    <form ref={ref} action={formAction} className={clsx("space-y-5", className)}>
      {children}
      {footer && (
        <div className="flex flex-wrap items-center gap-3 border-t border-black/5 pt-4">
          <button
            type="submit"
            disabled={pending}
            className={clsx(
              "inline-flex h-10 items-center gap-2 rounded-lg px-5 text-sm font-semibold text-white disabled:opacity-60",
              danger ? "bg-rose-600 hover:bg-rose-700" : "bg-zinc-900 hover:bg-zinc-800",
            )}
          >
            {pending && <Loader2 size={15} className="animate-spin" />}
            {submitLabel}
          </button>
          {shown?.ok && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-700">
              <CircleCheck size={16} /> {shown.message ?? "Kaydedildi"}
            </span>
          )}
          {shown?.error && (
            <span className="flex items-center gap-1.5 text-sm text-rose-700">
              <CircleAlert size={16} /> {shown.error}
            </span>
          )}
        </div>
      )}
    </form>
  );
}

export function Field({
  label,
  name,
  hint,
  type = "text",
  className,
  kind,
  ...rest
}: {
  label: string;
  name: string;
  hint?: string;
  type?: string;
  className?: string;
  /** Sunucuya değer tipini bildirir: number | lines | csv | json */
  kind?: "number" | "lines" | "csv" | "json";
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name" | "type">) {
  return (
    <label className={clsx("block", className)}>
      <span className={labelCls}>{label}</span>
      <input name={name} type={type} className={inputCls} {...rest} />
      {kind && <input type="hidden" name={`$type.${name}`} value={kind} />}
      {hint && <span className="mt-1 block text-xs text-zinc-500">{hint}</span>}
    </label>
  );
}

export function TextArea({
  label,
  name,
  hint,
  rows = 4,
  className,
  kind,
  ...rest
}: { label: string; name: string; hint?: string; rows?: number; className?: string; kind?: "lines" | "csv" | "json" } & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "name">) {
  return (
    <label className={clsx("block", className)}>
      <span className={labelCls}>{label}</span>
      <textarea name={name} rows={rows} className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900" {...rest} />
      {kind && <input type="hidden" name={`$type.${name}`} value={kind} />}
      {hint && <span className="mt-1 block text-xs text-zinc-500">{hint}</span>}
    </label>
  );
}

export function Select({
  label,
  name,
  options,
  hint,
  className,
  ...rest
}: { label: string; name: string; options: { value: string; label: string; disabled?: boolean }[]; hint?: string; className?: string } & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "name">) {
  return (
    <label className={clsx("block", className)}>
      <span className={labelCls}>{label}</span>
      <select name={name} className={inputCls} {...rest}>
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && <span className="mt-1 block text-xs text-zinc-500">{hint}</span>}
    </label>
  );
}

/** Ayarlar için onay kutusu (işaretsizken de sunucuya "false" gitmesi için $bool alanı eklenir). */
export function Toggle({ label, name, defaultChecked, hint }: { label: string; name: string; defaultChecked?: boolean; hint?: string }) {
  const [on, setOn] = useState(Boolean(defaultChecked));
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-black/10 p-3">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-zinc-500">{hint}</span>}
      </span>
      <input type="hidden" name={`$bool.${name}`} value="1" />
      <input type="checkbox" name={name} checked={on} onChange={(e) => setOn(e.target.checked)} className="sr-only" />
      <span className={clsx("relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors", on ? "bg-zinc-900" : "bg-zinc-300")}>
        <span className={clsx("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", on ? "left-[22px]" : "left-0.5")} />
      </span>
    </label>
  );
}

export function ColorField({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  const [v, setV] = useState(defaultValue);
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      <div className="flex items-center gap-2">
        <input type="color" value={v} onChange={(e) => setV(e.target.value)} className="h-10 w-12 cursor-pointer rounded-xl border border-black/10 bg-white p-1" aria-label={label} />
        <input name={name} value={v} onChange={(e) => setV(e.target.value)} className={inputCls} />
      </div>
    </label>
  );
}

async function upload(files: FileList): Promise<string[]> {
  const fd = new FormData();
  for (const f of Array.from(files)) fd.append("file", f);
  const r = await fetch("/api/panel/upload", { method: "POST", body: fd });
  const j = (await r.json()) as { urls?: string[]; error?: string };
  if (!r.ok || !j.urls) throw new Error(j.error ?? "Yükleme başarısız");
  return j.urls;
}

/** Tek görsel: URL yaz ya da dosya yükle. */
export function ImageField({ label, name, defaultValue, hint, value: controlled, onChange }: { label: string; name?: string; defaultValue?: string; hint?: string; value?: string; onChange?: (v: string) => void }) {
  const [inner, setInner] = useState(defaultValue ?? "");
  const value = controlled ?? inner;
  const set = (v: string) => (onChange ? onChange(v) : setInner(v));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <div>
      <span className={labelCls}>{label}</span>
      <div className="flex gap-3">
        <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-lg border border-black/10 bg-white/40">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus size={20} className="text-zinc-400" />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <input name={name} value={value} onChange={(e) => set(e.target.value)} placeholder="https://… ya da yükle" className={inputCls} />
          <div className="flex items-center gap-2">
            <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-black/10 bg-white/70 px-4 text-xs font-semibold hover:bg-white">
              {busy ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />} Dosya yükle
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={async (e) => {
                  if (!e.target.files?.length) return;
                  setBusy(true);
                  setErr(null);
                  try {
                    set((await upload(e.target.files))[0]);
                  } catch (x) {
                    setErr((x as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              />
            </label>
            {value && (
              <button type="button" onClick={() => set("")} className="text-xs text-zinc-500 hover:text-rose-600">
                Kaldır
              </button>
            )}
          </div>
          {err && <p className="text-xs text-rose-600">{err}</p>}
          {hint && <p className="text-xs text-zinc-500">{hint}</p>}
        </div>
      </div>
    </div>
  );
}

/** Çoklu görsel (ürün galerisi). Değer JSON olarak gizli alanda gönderilir. */
export function GalleryField({ name, defaultValue, max = 10 }: { name: string; defaultValue: { url: string; alt?: string }[]; max?: number }) {
  const [items, setItems] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const move = (i: number, d: number) => {
    const a = [...items];
    const j = i + d;
    if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]];
    setItems(a);
  };
  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(items)} />
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {items.map((im, i) => (
          <div key={`${im.url}-${i}`} className="group relative aspect-square overflow-hidden rounded-lg border border-black/10 bg-white/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={im.url} alt="" className="h-full w-full object-cover" />
            {i === 0 && <span className="absolute left-1 top-1 rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] font-semibold text-white">Kapak</span>}
            <div className="absolute inset-x-1 bottom-1 flex justify-between opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
              <div className="flex gap-1">
                <button type="button" onClick={() => move(i, -1)} className="grid h-7 w-7 place-items-center rounded bg-white/90 shadow" aria-label="Sola taşı">
                  <ArrowUp size={13} className="-rotate-90" />
                </button>
                <button type="button" onClick={() => move(i, 1)} className="grid h-7 w-7 place-items-center rounded bg-white/90 shadow" aria-label="Sağa taşı">
                  <ArrowDown size={13} className="-rotate-90" />
                </button>
              </div>
              <button type="button" onClick={() => setItems(items.filter((_, k) => k !== i))} className="grid h-7 w-7 place-items-center rounded bg-white/90 text-rose-600 shadow" aria-label="Kaldır">
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
        {items.length < max && (
          <label className="grid aspect-square cursor-pointer place-items-center rounded-full border-2 border-dashed border-zinc-300 text-center text-xs text-zinc-500 hover:border-zinc-900">
            <span className="flex flex-col items-center gap-1">
              {busy ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
              Görsel yükle
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={async (e) => {
                if (!e.target.files?.length) return;
                setBusy(true);
                setErr(null);
                try {
                  const urls = await upload(e.target.files);
                  setItems((cur) => [...cur, ...urls.map((u) => ({ url: u }))].slice(0, max));
                } catch (x) {
                  setErr((x as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            />
          </label>
        )}
      </div>
      <div className="mt-3 flex gap-2">
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Görsel URL'si ekle (https://…)" className={inputCls} />
        <button
          type="button"
          onClick={() => {
            if (/^(https?:\/\/|\/uploads\/)/.test(url)) {
              setItems([...items, { url }].slice(0, max));
              setUrl("");
            }
          }}
          className="inline-flex h-10 shrink-0 items-center gap-1 rounded-full border border-black/10 bg-white/70 px-4 text-sm font-semibold"
        >
          <Plus size={15} /> Ekle
        </button>
      </div>
      {err && <p className="mt-2 text-xs text-rose-600">{err}</p>}
      <p className="mt-2 text-xs text-zinc-500">İlk görsel kapak olarak kullanılır. {"Shopier'e en fazla 5 görsel aktarılır."}</p>
    </div>
  );
}

type RepeaterFieldDef = { key: string; label: string; type?: "text" | "color" | "image" | "textarea"; placeholder?: string; wide?: boolean };

/** Slider/banner gibi tekrarlanan içerikler için düzenleyici. Değer JSON olarak gönderilir. */
export function Repeater({ name, fields, defaultValue, addLabel, max = 8, blank }: { name: string; fields: RepeaterFieldDef[]; defaultValue: Record<string, string>[]; addLabel: string; max?: number; blank: Record<string, string> }) {
  const [items, setItems] = useState(defaultValue);
  const update = (i: number, k: string, v: string) => setItems(items.map((it, j) => (j === i ? { ...it, [k]: v } : it)));
  return (
    <div className="space-y-4">
      <input type="hidden" name={name} value={JSON.stringify(items)} />
      <input type="hidden" name={`$type.${name}`} value="json" />
      {items.map((it, i) => (
        <div key={i} className="rounded-xl border border-black/10 bg-white/40/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold">
              {i + 1}. {it.title || "Yeni öğe"}
            </p>
            <div className="flex gap-1">
              <button type="button" disabled={i === 0} onClick={() => setItems(items.map((x, j) => (j === i - 1 ? items[i] : j === i ? items[i - 1] : x)))} className="grid h-8 w-8 place-items-center rounded-full border border-black/10 bg-white/70 disabled:opacity-30" aria-label="Yukarı">
                <ArrowUp size={14} />
              </button>
              <button type="button" disabled={i === items.length - 1} onClick={() => setItems(items.map((x, j) => (j === i + 1 ? items[i] : j === i ? items[i + 1] : x)))} className="grid h-8 w-8 place-items-center rounded-full border border-black/10 bg-white/70 disabled:opacity-30" aria-label="Aşağı">
                <ArrowDown size={14} />
              </button>
              <button type="button" onClick={() => setItems(items.filter((_, j) => j !== i))} className="grid h-8 w-8 place-items-center rounded-full border border-black/10 bg-white/70 text-rose-600" aria-label="Sil">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {fields.map((f) =>
              f.type === "image" ? (
                <div key={f.key} className="md:col-span-2">
                  <ImageField label={f.label} value={it[f.key] ?? ""} onChange={(v) => update(i, f.key, v)} />
                </div>
              ) : f.type === "color" ? (
                <label key={f.key} className="block">
                  <span className={labelCls}>{f.label}</span>
                  <div className="flex gap-2">
                    <input type="color" value={it[f.key] || "#000000"} onChange={(e) => update(i, f.key, e.target.value)} className="h-10 w-12 rounded-xl border border-black/10 bg-white p-1" />
                    <input value={it[f.key] ?? ""} onChange={(e) => update(i, f.key, e.target.value)} className={inputCls} />
                  </div>
                </label>
              ) : f.type === "textarea" ? (
                <label key={f.key} className="block md:col-span-2">
                  <span className={labelCls}>{f.label}</span>
                  <textarea value={it[f.key] ?? ""} onChange={(e) => update(i, f.key, e.target.value)} rows={2} className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900" />
                </label>
              ) : (
                <label key={f.key} className={clsx("block", f.wide && "md:col-span-2")}>
                  <span className={labelCls}>{f.label}</span>
                  <input value={it[f.key] ?? ""} placeholder={f.placeholder} onChange={(e) => update(i, f.key, e.target.value)} className={inputCls} />
                </label>
              ),
            )}
          </div>
        </div>
      ))}
      {items.length < max && (
        <button type="button" onClick={() => setItems([...items, { ...blank }])} className="inline-flex h-10 items-center gap-2 rounded-lg border border-dashed border-zinc-400 px-4 text-sm font-semibold hover:bg-white/60">
          <Plus size={16} /> {addLabel}
        </button>
      )}
    </div>
  );
}

/** Tek tıklık işlem butonu (server action çağırır, sonucu gösterir). */
export function ActionButton({ action, children, confirm, className, variant = "secondary" }: { action: () => Promise<FormState | void>; children: React.ReactNode; confirm?: string; className?: string; variant?: "primary" | "secondary" | "danger" }) {
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<FormState>(null);
  return (
    <span className="inline-flex flex-col gap-1">
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          if (confirm && !window.confirm(confirm)) return;
          setBusy(true);
          setRes(null);
          try {
            const r = await action();
            setRes(r ?? { ok: true });
          } catch (e) {
            setRes({ error: (e as Error).message });
          } finally {
            setBusy(false);
          }
        }}
        className={clsx(
          "inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3.5 text-sm font-semibold disabled:opacity-60",
          variant === "primary" && "bg-zinc-900 text-white hover:bg-zinc-800",
          variant === "secondary" && "border border-zinc-300 bg-white hover:bg-zinc-50",
          variant === "danger" && "border border-rose-300 bg-white text-rose-700 hover:bg-rose-50",
          className,
        )}
      >
        {busy && <Loader2 size={14} className="animate-spin" />}
        {children}
      </button>
      {res?.error && <span className="text-xs text-rose-600">{res.error}</span>}
      {res?.ok && res.message && <span className="text-xs text-emerald-700">{res.message}</span>}
    </span>
  );
}
