"use client";

import { useActionState } from "react";
import { panelLogin, type LoginState } from "@/lib/actions/panel-auth";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(panelLogin, null);
  return (
    <form action={action} className="mt-8 space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-zinc-700">E-posta</span>
        <input name="email" type="email" required autoComplete="email" className="h-11 w-full rounded-lg border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-900" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-zinc-700">Şifre</span>
        <input name="password" type="password" required autoComplete="current-password" className="h-11 w-full rounded-lg border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-900" />
      </label>
      {state?.error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{state.error}</p>}
      <button type="submit" disabled={pending} className="h-11 w-full rounded-lg bg-zinc-900 text-sm font-semibold text-white disabled:opacity-60">
        {pending ? "Giriş yapılıyor…" : "Giriş Yap"}
      </button>
    </form>
  );
}
