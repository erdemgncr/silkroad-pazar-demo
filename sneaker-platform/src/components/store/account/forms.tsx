"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { clsx } from "clsx";
import { CircleCheck, MapPin, Pencil, Trash2 } from "lucide-react";
import {
  changePassword,
  deleteAddress,
  deleteMyAccount,
  loginCustomer,
  registerCustomer,
  requestPasswordReset,
  resetPassword,
  saveAddress,
  updateProfile,
  type AccountState,
} from "@/lib/actions/account";
import { TR_CITIES } from "@/lib/tr-cities";
import { useRouter } from "next/navigation";

const input = (err?: string) => clsx("h-12 w-full rounded-theme border bg-bg px-4 text-sm outline-none focus:border-fg", err ? "border-sale" : "border-line");
const btn = "h-12 w-full rounded-theme bg-primary text-sm font-semibold text-primary-fg disabled:opacity-60";

function F({ label, name, error, ...rest }: { label: string; name: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-semibold">{label}</span>
      <input name={name} className={input(error)} {...rest} />
      {error && <span className="mt-1 block text-xs text-sale">{error}</span>}
    </label>
  );
}

function Msg({ state }: { state: AccountState }) {
  if (!state?.message) return null;
  return <p className={clsx("rounded-theme p-3 text-sm", state.ok ? "bg-emerald-50 text-emerald-800" : "bg-sale/10 text-sale")}>{state.message}</p>;
}

export function AuthTabs({ next }: { next: string }) {
  const [tab, setTab] = useState<"giris" | "kayit">("giris");
  const [login, loginAction, loginPending] = useActionState<AccountState, FormData>(loginCustomer, null);
  const [reg, regAction, regPending] = useActionState<AccountState, FormData>(registerCustomer, null);
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-6 grid grid-cols-2 rounded-theme bg-soft p-1">
        {(["giris", "kayit"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={clsx("h-11 rounded-theme text-sm font-semibold", tab === t ? "bg-bg shadow-sm" : "text-muted")}>
            {t === "giris" ? "Giriş Yap" : "Üye Ol"}
          </button>
        ))}
      </div>
      {tab === "giris" ? (
        <form action={loginAction} className="space-y-4">
          <input type="hidden" name="devam" value={next} />
          <F label="E-posta" name="email" type="email" autoComplete="email" required />
          <F label="Şifre" name="password" type="password" autoComplete="current-password" required />
          <Msg state={login} />
          <div className="text-right">
            <Link href="/hesabim/sifremi-unuttum" className="text-sm underline">
              Şifremi unuttum
            </Link>
          </div>
          <button type="submit" disabled={loginPending} className={btn}>
            {loginPending ? "Giriş yapılıyor…" : "Giriş Yap"}
          </button>
        </form>
      ) : (
        <form action={regAction} className="space-y-4">
          <input type="hidden" name="devam" value={next} />
          <div className="grid grid-cols-2 gap-3">
            <F label="Ad" name="firstName" autoComplete="given-name" error={reg?.errors?.firstName} />
            <F label="Soyad" name="lastName" autoComplete="family-name" error={reg?.errors?.lastName} />
          </div>
          <F label="E-posta" name="email" type="email" autoComplete="email" error={reg?.errors?.email} />
          <F label="Cep telefonu (isteğe bağlı)" name="phone" type="tel" autoComplete="tel" />
          <F label="Şifre" name="password" type="password" autoComplete="new-password" error={reg?.errors?.password} />
          <label className="flex items-start gap-2 text-xs text-muted">
            <input type="checkbox" name="terms" className="mt-0.5" />
            <span>
              <Link href="/uyelik-sozlesmesi" target="_blank" className="underline">
                Üyelik Sözleşmesi
              </Link>{" "}
              ve{" "}
              <Link href="/kvkk-aydinlatma-metni" target="_blank" className="underline">
                KVKK Aydınlatma Metni
              </Link>
              &apos;ni okudum, kabul ediyorum.
              {reg?.errors?.terms && <span className="block text-sale">{reg.errors.terms}</span>}
            </span>
          </label>
          <label className="flex items-start gap-2 text-xs text-muted">
            <input type="checkbox" name="marketing" className="mt-0.5" />
            <span>Kampanya ve yeniliklerden e-posta/SMS ile haberdar olmak istiyorum.</span>
          </label>
          <Msg state={reg?.errors ? { message: reg.message } : reg} />
          <button type="submit" disabled={regPending} className={btn}>
            {regPending ? "Hesap oluşturuluyor…" : "Üye Ol"}
          </button>
        </form>
      )}
    </div>
  );
}

export function ForgotForm() {
  const [state, action, pending] = useActionState<AccountState, FormData>(requestPasswordReset, null);
  return (
    <form action={action} className="mx-auto w-full max-w-md space-y-4">
      <F label="E-posta" name="email" type="email" required />
      <Msg state={state} />
      <button type="submit" disabled={pending} className={btn}>
        Sıfırlama Bağlantısı Gönder
      </button>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<AccountState, FormData>(resetPassword, null);
  return (
    <form action={action} className="mx-auto w-full max-w-md space-y-4">
      <input type="hidden" name="token" value={token} />
      <F label="Yeni şifre" name="password" type="password" autoComplete="new-password" error={state?.errors?.password} />
      <Msg state={state} />
      <button type="submit" disabled={pending} className={btn}>
        Şifremi Güncelle
      </button>
    </form>
  );
}

export function ProfileForm({ c }: { c: { firstName: string; lastName: string; email: string; phone: string; marketing: boolean } }) {
  const [state, action, pending] = useActionState<AccountState, FormData>(updateProfile, null);
  const [pw, pwAction, pwPending] = useActionState<AccountState, FormData>(changePassword, null);
  const [del, delAction, delPending] = useActionState<AccountState, FormData>(deleteMyAccount, null);
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form action={action} className="space-y-4">
        <h2 className="font-heading text-lg font-bold">Kişisel Bilgiler</h2>
        <div className="grid grid-cols-2 gap-3">
          <F label="Ad" name="firstName" defaultValue={c.firstName} />
          <F label="Soyad" name="lastName" defaultValue={c.lastName} />
        </div>
        <F label="E-posta" name="email" defaultValue={c.email} disabled />
        <F label="Cep telefonu" name="phone" defaultValue={c.phone} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="marketing" defaultChecked={c.marketing} /> Kampanya e-postaları almak istiyorum
        </label>
        <Msg state={state} />
        <button type="submit" disabled={pending} className={clsx(btn, "md:w-auto md:px-8")}>
          Kaydet
        </button>
      </form>
      <form action={pwAction} className="space-y-4">
        <h2 className="font-heading text-lg font-bold">Şifre Değiştir</h2>
        <F label="Mevcut şifre" name="current" type="password" error={pw?.errors?.current} />
        <F label="Yeni şifre" name="next" type="password" error={pw?.errors?.next} />
        <Msg state={pw} />
        <button type="submit" disabled={pwPending} className={clsx(btn, "md:w-auto md:px-8")}>
          Şifreyi Değiştir
        </button>
      </form>
      <details className="rounded-theme-lg border border-line p-4 lg:col-span-2">
        <summary className="cursor-pointer text-sm font-semibold">Hesabımı sil</summary>
        <form action={delAction} className="mt-4 max-w-md space-y-4">
          <p className="text-sm text-muted">
            Hesabın, kayıtlı adreslerin ve bülten aboneliğin kalıcı olarak silinir. Mevzuat gereği fatura ve sipariş kayıtların yasal süre boyunca saklanır. Bu işlem geri alınamaz.
          </p>
          <F label="Şifren" name="password" type="password" error={del?.errors?.password} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="confirm" /> Hesabımın silinmesini onaylıyorum
          </label>
          {del?.errors?.confirm && <p className="text-xs text-sale">{del.errors.confirm}</p>}
          <button type="submit" disabled={delPending} className="h-12 rounded-theme border border-sale px-6 text-sm font-semibold text-sale disabled:opacity-60">
            Hesabımı kalıcı olarak sil
          </button>
        </form>
      </details>
    </div>
  );
}

type Addr = { id: number; title: string; fullName: string; phone: string; city: string; district: string; line: string; postcode: string | null };

export function AddressBook({ items }: { items: Addr[] }) {
  const [editing, setEditing] = useState<Addr | "new" | null>(items.length ? null : "new");
  const [state, action, pending] = useActionState<AccountState, FormData>(async (s: AccountState, f: FormData) => {
    const r = await saveAddress(s, f);
    if (r?.ok) setEditing(null);
    return r;
  }, null);
  const [, start] = useTransition();
  const router = useRouter();
  const e = state?.errors ?? {};
  const cur = editing && editing !== "new" ? editing : null;
  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((a) => (
          <div key={a.id} className="rounded-theme-lg border border-line p-4">
            <p className="flex items-center gap-2 font-semibold">
              <MapPin size={16} /> {a.title}
            </p>
            <p className="mt-2 text-sm">{a.fullName}</p>
            <p className="text-sm text-muted">
              {a.line}, {a.district} / {a.city} {a.postcode}
            </p>
            <p className="text-sm text-muted">{a.phone}</p>
            <div className="mt-3 flex gap-3 text-sm">
              <button type="button" onClick={() => setEditing(a)} className="flex items-center gap-1 underline">
                <Pencil size={14} /> Düzenle
              </button>
              <button
                type="button"
                onClick={() =>
                  start(async () => {
                    await deleteAddress(a.id);
                    router.refresh();
                  })
                }
                className="flex items-center gap-1 text-sale underline"
              >
                <Trash2 size={14} /> Sil
              </button>
            </div>
          </div>
        ))}
        {editing === null && (
          <button type="button" onClick={() => setEditing("new")} className="grid min-h-40 place-items-center rounded-theme-lg border-2 border-dashed border-line text-sm font-semibold hover:border-fg">
            + Yeni Adres Ekle
          </button>
        )}
      </div>
      {state?.ok && !editing && (
        <p className="mt-4 flex items-center gap-2 text-sm text-emerald-700">
          <CircleCheck size={16} /> {state.message}
        </p>
      )}
      {editing && (
        <form key={cur?.id ?? "new"} action={action} className="mt-6 grid gap-4 rounded-theme-lg border border-line p-5 sm:grid-cols-2">
          <input type="hidden" name="id" value={cur?.id ?? ""} />
          <F label="Adres başlığı" name="title" defaultValue={cur?.title ?? "Ev"} error={e.title} />
          <F label="Ad Soyad" name="fullName" defaultValue={cur?.fullName} error={e.fullName} />
          <F label="Telefon" name="phone" defaultValue={cur?.phone} error={e.phone} />
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-semibold">İl</span>
            <select name="city" defaultValue={cur?.city ?? ""} className={input(e.city)}>
              <option value="">İl seçin</option>
              {[...TR_CITIES].sort((a, b) => a.localeCompare(b, "tr")).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <F label="İlçe" name="district" defaultValue={cur?.district} error={e.district} />
          <F label="Posta kodu" name="postcode" defaultValue={cur?.postcode ?? ""} />
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-[13px] font-semibold">Açık adres</span>
            <textarea name="line" defaultValue={cur?.line} rows={3} className={clsx(input(e.line), "h-auto py-3")} />
            {e.line && <span className="mt-1 block text-xs text-sale">{e.line}</span>}
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" disabled={pending} className="h-11 rounded-theme bg-primary px-6 text-sm font-semibold text-primary-fg">
              Kaydet
            </button>
            <button type="button" onClick={() => setEditing(null)} className="h-11 rounded-theme border border-line px-6 text-sm font-semibold">
              Vazgeç
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
