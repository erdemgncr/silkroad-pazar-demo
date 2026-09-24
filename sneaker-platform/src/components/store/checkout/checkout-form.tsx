"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { clsx } from "clsx";
import { CircleAlert, Lock, X } from "lucide-react";
import { styleOf, type StyleKey, type ThemeKey } from "@/themes/registry";
import { TR_CITIES } from "@/lib/tr-cities";
import { formatPrice } from "@/lib/format";
import { placeOrderAction, type CheckoutInput } from "@/lib/actions/checkout";
import { useStore } from "../providers";
import { usePricing } from "./use-pricing";
import { CouponBox, Summary, useCoupon } from "./cart-page";

type Addr = { fullName: string; phone: string; city: string; district: string; line: string; postcode: string };
const emptyAddr: Addr = { fullName: "", phone: "", city: "", district: "", line: "", postcode: "" };

export type SavedAddress = Addr & { id: number; title: string };

function Input({ label, error, className, ...rest }: { label: string; error?: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={clsx("block", className)}>
      <span className="mb-1.5 block text-[13px] font-semibold">{label}</span>
      <input {...rest} className={clsx("h-12 w-full rounded-theme border bg-bg px-4 text-sm outline-none focus:border-fg", error ? "border-sale" : "border-line")} />
      {error && <span className="mt-1 block text-xs text-sale">{error}</span>}
    </label>
  );
}

function AddressFields({ value, onChange, errors, prefix }: { value: Addr; onChange: (a: Addr) => void; errors: Record<string, string>; prefix: string }) {
  const set = (k: keyof Addr) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => onChange({ ...value, [k]: e.target.value });
  const err = (k: string) => errors[`${prefix}.${k}`];
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Input label="Ad Soyad *" autoComplete="name" value={value.fullName} onChange={set("fullName")} error={err("fullName")} />
      <Input label="Cep Telefonu *" type="tel" autoComplete="tel" placeholder="05xx xxx xx xx" value={value.phone} onChange={set("phone")} error={err("phone")} />
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-semibold">İl *</span>
        <select value={value.city} onChange={set("city")} className={clsx("h-12 w-full rounded-theme border bg-bg px-4 text-sm outline-none focus:border-fg", err("city") ? "border-sale" : "border-line")}>
          <option value="">İl seçin</option>
          {[...TR_CITIES].sort((a, b) => a.localeCompare(b, "tr")).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {err("city") && <span className="mt-1 block text-xs text-sale">{err("city")}</span>}
      </label>
      <Input label="İlçe *" value={value.district} onChange={set("district")} error={err("district")} />
      <label className="block sm:col-span-2">
        <span className="mb-1.5 block text-[13px] font-semibold">Açık Adres *</span>
        <textarea
          value={value.line}
          onChange={set("line")}
          rows={3}
          placeholder="Mahalle, cadde/sokak, bina ve daire no"
          className={clsx("w-full rounded-theme border bg-bg px-4 py-3 text-sm outline-none focus:border-fg", err("line") ? "border-sale" : "border-line")}
        />
        {err("line") && <span className="mt-1 block text-xs text-sale">{err("line")}</span>}
      </label>
      <Input label="Posta Kodu" inputMode="numeric" value={value.postcode} onChange={set("postcode")} error={err("postcode")} />
    </div>
  );
}

function AgreementModal({ slug, title, onClose }: { slug: string; title: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="flex h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-theme-lg bg-bg text-fg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <p className="font-semibold">{title}</p>
          <button type="button" onClick={onClose} aria-label="Kapat">
            <X size={22} />
          </button>
        </div>
        <iframe src={`/${slug}`} title={title} className="flex-1 border-0" />
      </div>
    </div>
  );
}

export function CheckoutForm({ variant: theme, customer, addresses }: { variant: ThemeKey; customer: { email: string; name: string; phone: string } | null; addresses: SavedAddress[] }) {
  const variant = styleOf(theme);
  const { cart, hydrated } = useStore();
  const router = useRouter();
  const [coupon, setCoupon] = useCoupon();
  const { pricing, loading } = usePricing(coupon);
  const [pending, start] = useTransition();
  const [email, setEmail] = useState(customer?.email ?? "");
  const [shipping, setShipping] = useState<Addr>(addresses[0] ? { ...addresses[0] } : { ...emptyAddr, fullName: customer?.name ?? "", phone: customer?.phone ?? "" });
  const [sameBilling, setSameBilling] = useState(true);
  const [billing, setBilling] = useState<Addr>(emptyAddr);
  const [invoiceType, setInvoiceType] = useState<"bireysel" | "kurumsal">("bireysel");
  const [corp, setCorp] = useState({ nationalId: "", company: "", taxOffice: "", taxNumber: "" });
  const [note, setNote] = useState("");
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [modal, setModal] = useState<{ slug: string; title: string } | null>(null);

  useEffect(() => {
    if (hydrated && cart.length === 0 && !pending) router.replace("/sepet");
  }, [hydrated, cart.length, pending, router]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const payload: CheckoutInput = {
      cart: cart.map((l) => ({ productId: l.productId, size: l.size, quantity: l.quantity })),
      couponCode: pricing?.coupon?.code ?? null,
      email,
      shipping,
      sameBilling,
      billing: sameBilling ? undefined : billing,
      invoiceType,
      ...corp,
      note,
      agreements: agree as true,
    };
    start(async () => {
      const r = await placeOrderAction(payload);
      if (r.ok) {
        window.location.href = r.redirect;
        return;
      }
      setErrors(r.errors ?? {});
      setMessage(r.message);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  const rounded = variant === "pulse" ? "rounded-full" : "rounded-theme";
  const section = (n: number, title: string, children: React.ReactNode) => (
    <section className="rounded-theme-lg border border-line p-5 md:p-6">
      <h2 className="mb-5 flex items-center gap-3 font-heading text-lg font-bold">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-fg text-sm text-bg">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );

  return (
    <form onSubmit={submit} className="grid gap-8 py-8 lg:grid-cols-[1fr_400px] lg:gap-12" noValidate>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-3xl font-bold">Ödeme</h1>
          <span className="flex items-center gap-1.5 text-xs text-muted">
            <Lock size={14} /> Güvenli ödeme
          </span>
        </div>
        {message && (
          <div className="flex items-start gap-2 rounded-theme bg-sale/10 p-4 text-sm text-sale">
            <CircleAlert size={18} className="mt-0.5 shrink-0" /> {message}
          </div>
        )}
        {!customer && (
          <p className="rounded-theme bg-soft p-4 text-sm">
            Üye misin?{" "}
            <Link href="/hesabim/giris?devam=/odeme" className="font-semibold underline">
              Giriş yap
            </Link>{" "}
            ya da üye olmadan devam et.
          </p>
        )}
        {section(
          1,
          "İletişim Bilgileri",
          <Input label="E-posta *" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} placeholder="Sipariş bilgileri bu adrese gönderilir" />,
        )}
        {section(
          2,
          "Teslimat Adresi",
          <>
            {addresses.length > 0 && (
              <div className="mb-5 grid gap-2 sm:grid-cols-2">
                {addresses.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setShipping({ ...a })}
                    className={clsx("rounded-theme border p-3 text-left text-sm", shipping.line === a.line && shipping.fullName === a.fullName ? "border-fg" : "border-line")}
                  >
                    <b>{a.title}</b>
                    <p className="text-muted">
                      {a.line}, {a.district} / {a.city}
                    </p>
                  </button>
                ))}
              </div>
            )}
            <AddressFields value={shipping} onChange={setShipping} errors={errors} prefix="shipping" />
          </>,
        )}
        {section(
          3,
          "Fatura Bilgileri",
          <div className="space-y-4">
            <div className="flex gap-2">
              {(["bireysel", "kurumsal"] as const).map((t) => (
                <button key={t} type="button" onClick={() => setInvoiceType(t)} className={clsx("h-10 px-4 text-sm font-semibold", rounded, invoiceType === t ? "bg-fg text-bg" : "border border-line")}>
                  {t === "bireysel" ? "Bireysel" : "Kurumsal"}
                </button>
              ))}
            </div>
            {invoiceType === "bireysel" ? (
              <Input label="T.C. Kimlik No (isteğe bağlı)" inputMode="numeric" maxLength={11} value={corp.nationalId} onChange={(e) => setCorp({ ...corp, nationalId: e.target.value.replace(/\D/g, "") })} error={errors.nationalId} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-3">
                <Input label="Firma Ünvanı *" value={corp.company} onChange={(e) => setCorp({ ...corp, company: e.target.value })} error={errors.company} className="sm:col-span-3" />
                <Input label="Vergi Dairesi *" value={corp.taxOffice} onChange={(e) => setCorp({ ...corp, taxOffice: e.target.value })} error={errors.taxOffice} />
                <Input label="Vergi No *" inputMode="numeric" value={corp.taxNumber} onChange={(e) => setCorp({ ...corp, taxNumber: e.target.value.replace(/\D/g, "") })} error={errors.taxNumber} className="sm:col-span-2" />
              </div>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={sameBilling} onChange={(e) => setSameBilling(e.target.checked)} /> Fatura adresim teslimat adresimle aynı
            </label>
            {!sameBilling && <AddressFields value={billing} onChange={setBilling} errors={errors} prefix="billing" />}
          </div>,
        )}
        {section(
          4,
          "Sipariş Notu",
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={500} placeholder="Kargo firmasına ya da bize iletmek istediğin bir not varsa yazabilirsin (isteğe bağlı)" className="w-full rounded-theme border border-line bg-bg px-4 py-3 text-sm outline-none focus:border-fg" />,
        )}
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <Summary pricing={pricing} loading={loading} variant={theme}>
          <ul className="mt-4 max-h-64 space-y-3 overflow-y-auto border-t border-line pt-4">
            {cart.map((l) => (
              <li key={l.key} className="flex gap-3">
                <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-theme bg-bg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={l.image} alt={l.title} className="h-full w-full object-cover" />
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-fg px-1 text-[10px] font-bold text-bg">{l.quantity}</span>
                </span>
                <div className="min-w-0 flex-1 text-xs">
                  <p className="truncate font-semibold">{l.title}</p>
                  <p className="text-muted">
                    {l.colorName} · {l.size}
                  </p>
                </div>
                <span className="text-xs font-semibold">{formatPrice(l.price * l.quantity)}</span>
              </li>
            ))}
          </ul>
          <CouponBox coupon={coupon} setCoupon={setCoupon} error={pricing?.couponError ?? null} applied={pricing?.coupon?.code ?? null} />
          <label className="mt-5 flex items-start gap-2 text-xs leading-relaxed">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5" />
            <span>
              <button type="button" className="font-semibold underline" onClick={() => setModal({ slug: "on-bilgilendirme-formu", title: "Ön Bilgilendirme Formu" })}>
                Ön Bilgilendirme Formu
              </button>
              &apos;nu ve{" "}
              <button type="button" className="font-semibold underline" onClick={() => setModal({ slug: "mesafeli-satis-sozlesmesi", title: "Mesafeli Satış Sözleşmesi" })}>
                Mesafeli Satış Sözleşmesi
              </button>
              &apos;ni okudum, onaylıyorum.
            </span>
          </label>
          {errors.agreements && <p className="mt-1 text-xs text-sale">{errors.agreements}</p>}
          <button
            type="submit"
            disabled={pending || !pricing || pricing.hasProblems || cart.length === 0}
            className={clsx("mt-4 flex h-14 w-full items-center justify-center gap-2 bg-primary text-[15px] font-bold text-primary-fg disabled:opacity-50", rounded)}
          >
            <Lock size={17} /> {pending ? "Sipariş oluşturuluyor…" : pricing ? `${formatPrice(pricing.total)} Öde` : "Siparişi Onayla"}
          </button>
          <p className="mt-2 text-center text-[11px] text-muted">Ödeme Shopier güvenli ödeme sayfasında tamamlanır.</p>
        </Summary>
      </aside>
      {modal && <AgreementModal slug={modal.slug} title={modal.title} onClose={() => setModal(null)} />}
    </form>
  );
}
