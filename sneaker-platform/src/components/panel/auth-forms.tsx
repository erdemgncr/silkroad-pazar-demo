"use client";

import Link from "next/link";
import { useActionState } from "react";
import { panelSignup, requestAdminReset, resetAdminPassword, type SimpleState } from "@/lib/actions/panel-auth";

const input = "h-11 w-full rounded-lg border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-900";
const label = "mb-1.5 block text-sm font-medium text-zinc-700";
const button = "h-11 w-full rounded-lg bg-zinc-900 text-sm font-semibold text-white disabled:opacity-60";

function Msg({ state }: { state: SimpleState }) {
  if (state?.error) return <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{state.error}</p>;
  if (state?.ok) return <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{state.message}</p>;
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

export function SignupForm({ plans, defaultPlan, trialDays }: { plans: { key: string; name: string; price: number }[]; defaultPlan: string; trialDays: number }) {
  const [state, action, pending] = useActionState<SimpleState, FormData>(panelSignup, null);
  return (
    <form action={action} className="mt-8 space-y-4">
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <label className="block">
        <span className={label}>Mağaza / marka adı</span>
        <input name="storeName" required className={input} placeholder="Örn. Adım Sneakers" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className={label}>Ad soyad</span>
          <input name="name" required autoComplete="name" className={input} />
        </label>
        <label className="block">
          <span className={label}>Telefon</span>
          <input name="phone" type="tel" autoComplete="tel" className={input} placeholder="05xx" />
        </label>
      </div>
      <label className="block">
        <span className={label}>E-posta</span>
        <input name="email" type="email" required autoComplete="email" className={input} />
      </label>
      <label className="block">
        <span className={label}>Şifre</span>
        <input name="password" type="password" minLength={8} required autoComplete="new-password" className={input} />
      </label>
      <label className="block">
        <span className={label}>Paket ({trialDays} gün ücretsiz deneme)</span>
        <select name="plan" defaultValue={defaultPlan} className={input}>
          {plans.map((p) => (
            <option key={p.key} value={p.key}>
              {p.name} · {p.price.toLocaleString("tr-TR")} ₺/ay
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-start gap-2 text-xs leading-relaxed text-zinc-600">
        <input type="checkbox" name="kvkk" className="mt-0.5" required />
        <span>Kullanım koşullarını ve KVKK aydınlatma metnini okudum, kabul ediyorum.</span>
      </label>
      <Msg state={state} />
      <button type="submit" disabled={pending} className={button}>
        {pending ? "Hesap oluşturuluyor…" : "Ücretsiz denemeyi başlat"}
      </button>
      <p className="text-center text-sm text-zinc-600">
        Zaten hesabın var mı?{" "}
        <Link href="/panel/giris" className="font-semibold underline">
          Giriş yap
        </Link>
      </p>
    </form>
  );
}
