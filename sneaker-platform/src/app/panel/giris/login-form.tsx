"use client";

import { useActionState } from "react";
import { panelLogin, type LoginState } from "@/lib/actions/panel-auth";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(panelLogin, null);
  return (
    <form action={action} className="mt-8 space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-zinc-700">E-posta</span>
        <input name="email" type="email" required autoComplete="email" className="h-12 w-full rounded-2xl border border-black/10 bg-white/80 px-4 text-[15px] outline-none focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-zinc-700">Şifre</span>
        <input name="password" type="password" required autoComplete="current-password" className="h-12 w-full rounded-2xl border border-black/10 bg-white/80 px-4 text-[15px] outline-none focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5" />
      </label>
      {state?.error && <p className="rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">{state.error}</p>}
      <button type="submit" disabled={pending} className="h-12 w-full rounded-full bg-zinc-900 text-[15px] font-semibold text-white shadow-[0_10px_24px_-10px_rgba(0,0,0,0.6)] disabled:opacity-60">
        {pending ? "Giriş yapılıyor…" : "Giriş Yap"}
      </button>
    </form>
  );
}
