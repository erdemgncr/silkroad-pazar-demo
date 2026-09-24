"use client";

import { useActionState } from "react";
import { clsx } from "clsx";
import { ArrowRight } from "lucide-react";
import { subscribeNewsletter, type ActionState } from "@/lib/actions/store";

export function NewsletterForm({ variant = "light", rounded }: { variant?: "light" | "dark"; rounded?: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(subscribeNewsletter, null);
  if (state?.ok) {
    return <p className={clsx("text-sm font-medium", variant === "dark" ? "text-white" : "text-fg")}>{state.message}</p>;
  }
  return (
    <form action={action} className="w-full">
      <div className={clsx("flex overflow-hidden border", variant === "dark" ? "border-white/30" : "border-line bg-bg", rounded)}>
        <input
          type="email"
          name="email"
          required
          placeholder="E-posta adresin"
          aria-label="E-posta adresin"
          className={clsx("h-12 min-w-0 flex-1 bg-transparent px-4 text-sm outline-none", variant === "dark" ? "text-white placeholder:text-white/50" : "placeholder:text-muted")}
        />
        <button type="submit" disabled={pending} className="flex items-center gap-2 bg-primary px-5 text-sm font-semibold text-primary-fg disabled:opacity-60">
          {pending ? "Gönderiliyor" : "Kaydol"} <ArrowRight size={16} />
        </button>
      </div>
      <label className={clsx("mt-2 flex items-start gap-2 text-[11px] leading-snug", variant === "dark" ? "text-white/60" : "text-muted")}>
        <input type="checkbox" name="consent" className="mt-0.5" required />
        <span>Kampanya ve yeniliklerden haberdar olmak için ticari elektronik ileti almayı kabul ediyorum.</span>
      </label>
      {state && !state.ok && <p className="mt-1 text-xs text-sale">{state.message}</p>}
    </form>
  );
}
