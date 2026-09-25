"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestAdminReset, resetAdminPassword, type SimpleState } from "@/lib/actions/panel-auth";

const input = "h-12 w-full rounded-2xl border border-black/10 bg-white/80 px-4 text-[15px] outline-none focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5";
const label = "mb-1.5 block text-sm font-medium text-zinc-700";
const button = "h-12 w-full rounded-full bg-zinc-900 text-[15px] font-semibold text-white shadow-[0_10px_24px_-10px_rgba(0,0,0,0.6)] disabled:opacity-60";

function Msg({ state }: { state: SimpleState }) {
  if (state?.error) return <p className="rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">{state.error}</p>;
  if (state?.ok) return <p className="rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-800">{state.message}</p>;
  return null;
}

export function ForgotForm() {
  const [state, action, pending] = useActionState<SimpleState, FormData>(requestAdminReset, null);
  return (
    <form action={action} className="mt-8 space-y-4">
      <label className="block">
        <span className={label}>E-posta</span>
        <input name="email" type="email" required autoComplete="email" className={input} />
      </label>
      <Msg state={state} />
      <button type="submit" disabled={pending} className={button}>
        {pending ? "Gönderiliyor…" : "Sıfırlama bağlantısı gönder"}
      </button>
      <p className="text-center text-sm">
        <Link href="/panel/giris" className="font-medium underline">
          Girişe dön
        </Link>
      </p>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<SimpleState, FormData>(resetAdminPassword, null);
  return (
    <form action={action} className="mt-8 space-y-4">
      <input type="hidden" name="token" value={token} />
      <label className="block">
        <span className={label}>Yeni şifre</span>
        <input name="password" type="password" minLength={8} required autoComplete="new-password" className={input} />
      </label>
      <label className="block">
        <span className={label}>Yeni şifre (tekrar)</span>
        <input name="confirm" type="password" minLength={8} required autoComplete="new-password" className={input} />
      </label>
      <Msg state={state} />
      <button type="submit" disabled={pending} className={button}>
        {pending ? "Kaydediliyor…" : "Şifremi değiştir"}
      </button>
    </form>
  );
}
