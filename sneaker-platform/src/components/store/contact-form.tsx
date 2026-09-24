"use client";

import Link from "next/link";
import { useActionState } from "react";
import { clsx } from "clsx";
import { CircleCheck } from "lucide-react";
import { sendContactMessage, type ActionState } from "@/lib/actions/store";

export function Field({
  label,
  name,
  error,
  className,
  as = "input",
  ...rest
}: {
  label: string;
  name: string;
  error?: string;
  className?: string;
  as?: "input" | "textarea" | "select";
} & React.InputHTMLAttributes<HTMLInputElement> &
  React.TextareaHTMLAttributes<HTMLTextAreaElement> &
  React.SelectHTMLAttributes<HTMLSelectElement>) {
  const cls = clsx("w-full rounded-theme border bg-bg px-4 text-sm outline-none transition-colors focus:border-fg", error ? "border-sale" : "border-line");
  return (
    <label className={clsx("block", className)}>
      <span className="mb-1.5 block text-[13px] font-semibold">{label}</span>
      {as === "textarea" ? (
        <textarea name={name} className={clsx(cls, "min-h-36 py-3")} {...(rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>)} />
      ) : as === "select" ? (
        <select name={name} className={clsx(cls, "h-12")} {...(rest as React.SelectHTMLAttributes<HTMLSelectElement>)} />
      ) : (
        <input name={name} className={clsx(cls, "h-12")} {...(rest as React.InputHTMLAttributes<HTMLInputElement>)} />
      )}
      {error && <span className="mt-1 block text-xs text-sale">{error}</span>}
    </label>
  );
}

export function ContactForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(sendContactMessage, null);
  if (state?.ok) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-theme-lg bg-soft p-10 text-center">
        <CircleCheck size={44} className="text-primary" />
        <p className="text-lg font-semibold">Teşekkürler!</p>
        <p className="text-sm text-muted">{state.message}</p>
      </div>
    );
  }
  const e = state?.errors ?? {};
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2" noValidate>
      <Field label="Ad Soyad *" name="name" autoComplete="name" error={e.name} required />
      <Field label="E-posta *" name="email" type="email" autoComplete="email" error={e.email} required />
      <Field label="Telefon" name="phone" type="tel" autoComplete="tel" placeholder="05xx xxx xx xx" error={e.phone} />
      <Field label="Konu *" name="subject" as="select" error={e.subject} defaultValue="">
        <option value="" disabled>
          Konu seçin
        </option>
        <option>Sipariş durumu</option>
        <option>İade ve değişim</option>
        <option>Ürün bilgisi</option>
        <option>Ödeme</option>
        <option>Öneri ve şikâyet</option>
        <option>Diğer</option>
      </Field>
      <Field label="Sipariş numarası (varsa)" name="orderNo" className="sm:col-span-2" error={e.orderNo} />
      <Field label="Mesajınız *" name="message" as="textarea" className="sm:col-span-2" error={e.message} required />
      <label className="flex items-start gap-2 text-xs text-muted sm:col-span-2">
        <input type="checkbox" name="kvkk" className="mt-0.5" />
        <span>
          Kişisel verilerimin{" "}
          <Link href="/kvkk-aydinlatma-metni" className="underline">
            KVKK Aydınlatma Metni
          </Link>{" "}
          kapsamında işlenmesini kabul ediyorum.
          {e.kvkk && <span className="block text-sale">{e.kvkk}</span>}
        </span>
      </label>
      {state && !state.ok && !Object.keys(e).length && <p className="text-sm text-sale sm:col-span-2">{state.message}</p>}
      <button type="submit" disabled={pending} className="h-12 rounded-theme bg-primary px-8 text-sm font-semibold text-primary-fg disabled:opacity-60 sm:col-span-2 sm:w-fit">
        {pending ? "Gönderiliyor…" : "Mesajı Gönder"}
      </button>
    </form>
  );
}
