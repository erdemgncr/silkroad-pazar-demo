"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { ArrowUp, Check, CircleAlert, Loader2, Sparkles, X } from "lucide-react";
import { applyCommand, planCommand, type PlanResult } from "@/lib/actions/panel-ai";

type Done = { text: string; messages: string[] };

export function AiCommand({ siteId, suggestions, aiEnabled }: { siteId: number; suggestions: string[]; aiEnabled: boolean }) {
  const [text, setText] = useState("");
  const [plan, setPlan] = useState<(PlanResult & { text: string }) | null>(null);
  const [done, setDone] = useState<Done[]>([]);
  const [pending, start] = useTransition();
  const [applying, startApply] = useTransition();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const ask = (value: string) => {
    const v = value.trim();
    if (!v) return;
    setText(v);
    start(async () => {
      const r = await planCommand(siteId, v);
      setPlan({ ...r, text: v });
    });
  };

  const apply = () => {
    if (!plan?.actions.length) return;
    startApply(async () => {
      const r = await applyCommand(
        siteId,
        plan.actions.map((a) => a.action),
      );
      if (r.ok) {
        setDone((d) => [{ text: plan.text, messages: r.messages ?? [] }, ...d].slice(0, 5));
        setPlan(null);
        setText("");
        router.refresh();
      } else setPlan({ ...plan, error: r.error, actions: [] });
    });
  };

  return (
    <div className="mx-auto mt-12 max-w-[760px]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(text);
        }}
        className="glass-strong flex items-center gap-3 rounded-full py-2 pl-3 pr-2"
      >
        <span className="orb h-9 w-9 shrink-0" />
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Örn. Tüm fiyatlara %5 zam yap"
          aria-label="Yapay zekaya ne yapmak istediğini yaz"
          className="h-11 min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-zinc-400"
          style={{ backgroundColor: "transparent" }}
          maxLength={500}
        />
        <button type="submit" disabled={pending || !text.trim()} aria-label="Gönder" className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-zinc-900 text-white transition disabled:bg-zinc-300">
          {pending ? <Loader2 size={18} className="animate-spin" /> : <ArrowUp size={19} />}
        </button>
      </form>
      <p className="mt-3 text-center text-sm text-zinc-500">
        Yaz ya da bir örneğe dokun. Değişikliği hazırlarım; sen kontrol edip uygularsın.
        {!aiEnabled && <span className="block text-xs text-zinc-400">Serbest cümleler için Platform Ayarları &gt; Yapay zeka bölümüne Gemini anahtarı ekleyebilirsin.</span>}
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {suggestions.map((s) => (
          <button key={s} type="button" onClick={() => ask(s)} className="rounded-full border border-black/10 bg-white/60 px-3.5 py-1.5 text-[13px] text-zinc-700 backdrop-blur hover:bg-white">
            {s}
          </button>
        ))}
      </div>

      {plan && (
        <div ref={(el) => el?.scrollIntoView({ behavior: "smooth", block: "nearest" })} className="glass-strong mt-8 scroll-mb-28 overflow-hidden rounded-3xl" role="status">
          <div className="flex items-start gap-3 border-b border-black/5 px-6 py-4">
            <Sparkles size={18} className="mt-0.5 shrink-0 text-zinc-500" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">{plan.source === "gemini" ? "Yapay zeka önerisi" : "Hazırlanan değişiklik"}</p>
              <p className="truncate font-medium">“{plan.text}”</p>
            </div>
            <button type="button" onClick={() => setPlan(null)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-black/5" aria-label="Kapat">
              <X size={16} />
            </button>
          </div>
          {plan.error ? (
            <p className="flex items-start gap-2 px-6 py-5 text-sm text-rose-700">
              <CircleAlert size={17} className="mt-0.5 shrink-0" /> {plan.error}
            </p>
          ) : (
            <>
              <ul className="divide-y divide-black/5">
                {plan.actions.map((a, i) => (
                  <li key={i} className="flex items-center gap-3 px-6 py-4">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-zinc-900 text-xs font-bold text-white">{i + 1}</span>
                    <span className="min-w-0 flex-1 text-[15px]">{a.summary}</span>
                    {a.impact && <span className="shrink-0 rounded-full bg-black/5 px-2.5 py-1 text-xs text-zinc-600">{a.impact}</span>}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-black/5 px-6 py-4">
                <button type="button" onClick={() => setPlan(null)} className="h-11 rounded-full border-[1.5px] border-zinc-900 px-5 text-sm font-semibold hover:bg-white">
                  Vazgeç
                </button>
                <button type="button" onClick={apply} disabled={applying} className="inline-flex h-11 items-center gap-2 rounded-full bg-zinc-900 px-6 text-sm font-semibold text-white disabled:opacity-60">
                  {applying ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Uygula
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {done.length > 0 && (
        <div className="mt-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Bu oturumda yapılanlar</p>
          <ul className="space-y-2">
            {done.map((d, i) => (
              <li key={i} className={clsx("glass rounded-2xl px-5 py-3 text-sm", i === 0 && "ring-1 ring-emerald-300")}>
                <p className="font-medium">“{d.text}”</p>
                {d.messages.map((m) => (
                  <p key={m} className="mt-0.5 flex items-center gap-1.5 text-emerald-700">
                    <Check size={14} /> {m}
                  </p>
                ))}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
