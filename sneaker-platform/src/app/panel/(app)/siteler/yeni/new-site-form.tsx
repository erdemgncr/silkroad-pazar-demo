"use client";

import { useActionState, useState } from "react";
import { clsx } from "clsx";
import { Check } from "lucide-react";
import { createSiteAction, type FormState } from "@/lib/actions/panel-sites";
import type { ThemeMeta } from "@/themes/registry";
import { btnCls, inputCls, labelCls } from "@/components/panel/ui";
import { ThemeThumb } from "@/components/panel/theme-thumb";
import { TR_CITIES } from "@/lib/tr-cities";

function toSlug(s: string) {
  return s
    .toLocaleLowerCase("tr-TR")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function NewSiteForm({ themes }: { themes: ThemeMeta[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createSiteAction, null);
  const [theme, setTheme] = useState(themes[0].key);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  return (
    <form action={action} className="space-y-8">
      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="font-semibold">1. Tema seç</h2>
        <p className="mt-1 text-sm text-zinc-500">Temayı daha sonra tek tıkla değiştirebilirsin.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {themes.map((t) => (
            <label key={t.key} className={clsx("cursor-pointer overflow-hidden rounded-xl border-2 bg-white transition-all", theme === t.key ? "border-zinc-900 shadow-lg" : "border-zinc-200 hover:border-zinc-400")}>
              <input type="radio" name="theme" value={t.key} checked={theme === t.key} onChange={() => setTheme(t.key)} className="sr-only" />
              <ThemeThumb theme={t.key} />
              <div className="p-3">
                <p className="flex items-center justify-between font-semibold">
                  {t.name} {theme === t.key && <Check size={16} />}
                </p>
                <p className="mt-1 line-clamp-3 text-xs text-zinc-500">{t.description}</p>
              </div>
            </label>
          ))}
        </div>
      </section>
      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="font-semibold">2. Site bilgileri</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label>
            <span className={labelCls}>Site adı (marka)</span>
            <input
              name="name"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugTouched) setSlug(toSlug(e.target.value));
              }}
              placeholder="Örn. Adım Sneakers"
              className={inputCls}
            />
          </label>
          <label>
            <span className={labelCls}>Site adresi</span>
            <div className="flex items-center rounded-lg border border-zinc-300 bg-white focus-within:border-zinc-900">
              <input
                name="slug"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(toSlug(e.target.value));
                }}
                className="h-10 min-w-0 flex-1 rounded-l-lg px-3 text-sm outline-none"
              />
              <span className="px-3 text-sm text-zinc-500">.platform alan adı</span>
            </div>
          </label>
          <label>
            <span className={labelCls}>Kendi alan adın (isteğe bağlı)</span>
            <input name="domain" placeholder="adimsneakers.com" className={inputCls} />
            <span className="mt-1 block text-xs text-zinc-500">Alan adının A kaydını sunucu IP adresine yönlendirmen yeterli; SSL otomatik oluşturulur.</span>
          </label>
          <label>
            <span className={labelCls}>Hedef şehir (yerel SEO)</span>
            <select name="city" className={inputCls} defaultValue="">
              <option value="">Tüm Türkiye</option>
              {[...TR_CITIES].sort((a, b) => a.localeCompare(b, "tr")).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
      </section>
      {state?.error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{state.error}</p>}
      <button type="submit" disabled={pending} className={btnCls}>
        {pending ? "Site oluşturuluyor…" : "Siteyi Oluştur"}
      </button>
    </form>
  );
}
