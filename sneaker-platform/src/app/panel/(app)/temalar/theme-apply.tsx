"use client";

import { useState, useTransition } from "react";
import { Eye, Loader2 } from "lucide-react";
import { applyTheme } from "@/lib/actions/panel-sites";

export function ThemeApply({ theme, sites }: { theme: string; sites: { id: number; slug: string; name: string; theme: string }[] }) {
  const [siteId, setSiteId] = useState(sites[0]?.id ?? 0);
  const [colors, setColors] = useState(true);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const site = sites.find((s) => s.id === siteId);
  if (!sites.length) return <p className="text-xs text-zinc-500">Temayı denemek için önce bir site oluştur.</p>;
  return (
    <div className="space-y-2">
      <select value={siteId} onChange={(e) => setSiteId(Number(e.target.value))} className="h-9 w-full rounded-xl border border-black/10 bg-white px-2 text-sm">
        {sites.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
            {s.theme === theme ? " (kullanıyor)" : ""}
          </option>
        ))}
      </select>
      <label className="flex items-center gap-2 text-xs text-zinc-600">
        <input type="checkbox" checked={colors} onChange={(e) => setColors(e.target.checked)} /> Temanın önerilen renklerini de uygula
      </label>
      <div className="grid grid-cols-2 gap-2">
        <a href={site ? `/panel/onizle/${site.slug}?tema=${theme}` : "#"} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-black/10 bg-white/70 text-sm font-semibold hover:bg-white">
          <Eye size={14} /> Sitemde önizle
        </a>
        <button
          type="button"
          disabled={pending || site?.theme === theme}
          onClick={() =>
            window.confirm(`${site?.name} sitesinin teması değiştirilsin mi?`) &&
            start(async () => {
              const r = await applyTheme(siteId, theme, colors);
              setMsg(r.message);
            })
          }
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-zinc-900 text-sm font-semibold text-white disabled:opacity-40"
        >
          {pending && <Loader2 size={14} className="animate-spin" />} {site?.theme === theme ? "Kullanılıyor" : "Uygula"}
        </button>
      </div>
      {msg && <p className="text-xs text-emerald-700">{msg}</p>}
    </div>
  );
}
