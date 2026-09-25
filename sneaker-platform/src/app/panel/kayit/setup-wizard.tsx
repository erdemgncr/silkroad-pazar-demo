"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { clsx } from "clsx";
import { ArrowLeft, ArrowRight, Check, CircleAlert, Eye, EyeOff, Loader2 } from "lucide-react";
import { checkWizard, completeWizard } from "@/lib/actions/panel-auth";
import { Wordmark } from "@/components/panel/shell";
import { ThemeThumb } from "@/components/panel/theme-thumb";
import type { ThemeKey } from "@/themes/registry";

type ThemeOpt = { key: ThemeKey; name: string; tagline: string; primary: string; accent: string };
type PlanOpt = { key: string; name: string; price: number; features: string[]; productLimit: number };

type Props = {
  platformName: string;
  trialDays: number;
  rootDomain: string;
  initialStore: string;
  initialPlan: string;
  cities: string[];
  themes: ThemeOpt[];
  plans: PlanOpt[];
  brands: { name: string; count: number }[];
  categories: { key: string; label: string; count: number }[];
  poolTotal: number;
};

const STEPS = ["Hesap", "Mağaza", "Tasarım", "Ürünler", "Paket"] as const;
const SWATCHES = ["#111111", "#1e3a8a", "#1d4ed8", "#e11d2e", "#f97316", "#16a34a", "#7c3aed", "#c9a45c"];
const BUILD_STEPS = ["Hesabın açılıyor", "Mağazan kuruluyor", "Tasarım uygulanıyor", "Ürünler ekleniyor", "Son dokunuşlar"];

const slugify = (s: string) =>
  s
    .toLocaleLowerCase("tr-TR")
    .replace(/[çÇ]/g, "c")
    .replace(/[ğĞ]/g, "g")
    .replace(/[ıİ]/g, "i")
    .replace(/[öÖ]/g, "o")
    .replace(/[şŞ]/g, "s")
    .replace(/[üÜ]/g, "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

const inputCls = "h-12 w-full rounded-2xl border border-black/10 bg-white/80 px-4 text-[15px] outline-none transition focus:border-zinc-900 focus:bg-white focus:ring-4 focus:ring-zinc-900/5";

function Field({ label, hint, children }: { label: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-zinc-700">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-zinc-500">{hint}</span>}
    </label>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on} className={clsx("rounded-full border px-4 py-2 text-sm font-medium transition", on ? "border-zinc-900 bg-zinc-900 text-white" : "border-black/10 bg-white/70 hover:bg-white")}>
      {children}
    </button>
  );
}

export function SetupWizard(p: Props) {
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [checking, startCheck] = useTransition();
  const [building, startBuild] = useTransition();
  const [buildIdx, setBuildIdx] = useState(0);
  const [showPw, setShowPw] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [kvkk, setKvkk] = useState(false);
  const [storeName, setStoreName] = useState(p.initialStore);
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugInput, setSlugInput] = useState(slugify(p.initialStore));
  const [city, setCity] = useState("İstanbul");
  const [theme, setTheme] = useState<ThemeKey>(p.themes[0].key);
  const [primary, setPrimary] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<"top" | "select" | "empty">("top");
  const [brands, setBrands] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [plan, setPlan] = useState(p.initialPlan);

  const slug = slugTouched ? slugify(slugInput) : slugify(storeName);
  const themeOpt = p.themes.find((t) => t.key === theme)!;
  const color = primary ?? themeOpt.primary;
  const planOpt = p.plans.find((x) => x.key === plan) ?? p.plans[0];

  const estimate = useMemo(() => {
    if (catalog === "empty") return 0;
    if (catalog === "top") return Math.min(60, p.poolTotal, planOpt.productLimit);
    const byBrand = brands.length ? p.brands.filter((b) => brands.includes(b.name)).reduce((a, b) => a + b.count, 0) : p.poolTotal;
    const ratio = categories.length ? p.categories.filter((c) => categories.includes(c.key)).reduce((a, c) => a + c.count, 0) / Math.max(1, p.poolTotal) : 1;
    return Math.min(300, planOpt.productLimit, Math.round(byBrand * ratio));
  }, [catalog, brands, categories, p.brands, p.categories, p.poolTotal, planOpt.productLimit]);

  useEffect(() => {
    if (!building) return;
    const t = setInterval(() => setBuildIdx((i) => Math.min(BUILD_STEPS.length - 1, i + 1)), 900);
    return () => clearInterval(t);
  }, [building]);

  const validate = (s: number): string | null => {
    if (s === 0) {
      if (name.trim().length < 2) return "Adını ve soyadını yaz.";
      if (!/^\S+@\S+\.\S+$/.test(email.trim())) return "Geçerli bir e-posta yaz.";
      if (password.length < 8) return "Şifre en az 8 karakter olmalı.";
      if (!kvkk) return "Devam etmek için kullanım koşullarını ve KVKK metnini onayla.";
    }
    if (s === 1) {
      if (storeName.trim().length < 2) return "Mağazanın adını yaz.";
      if (slug.length < 3) return "Site adresi en az 3 karakter olmalı.";
    }
    if (s === 3 && catalog === "select" && !brands.length && !categories.length) return "En az bir marka ya da kategori seç veya başka bir seçenek işaretle.";
    return null;
  };

  const next = () => {
    const v = validate(step);
    if (v) return setError(v);
    setError(null);
    if (step === 0 || step === 1) {
      startCheck(async () => {
        const r = await checkWizard(step === 0 ? email : "", step === 1 ? slug : "");
        if (step === 0 && r.emailTaken) return setError("Bu e-posta ile zaten bir hesap var. Giriş yapmayı dene.");
        if (step === 1 && r.slugTaken) {
          setSlugTouched(true);
          setSlugInput(r.suggestion);
          return setError(`“${slug}” adresi kullanılıyor. Senin için “${r.suggestion}” önerdik; istersen değiştirebilirsin.`);
        }
        setStep(step + 1);
      });
      return;
    }
    setStep(Math.min(STEPS.length, step + 1));
  };

  const finish = () => {
    setError(null);
    setBuildIdx(0);
    startBuild(async () => {
      const r = await completeWizard({
        name,
        email,
        phone,
        password,
        kvkk: kvkk as true,
        storeName,
        slug,
        city,
        theme,
        primary: primary ?? undefined,
        catalog,
        brands,
        categories,
        plan,
        website: "",
      });
      if (r?.error) {
        setError(r.error);
        if (typeof r.step === "number") setStep(r.step);
      }
    });
  };

  const toggle = (list: string[], set: (v: string[]) => void, v: string) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const wide = step === 2;

  return (
    <div className="glass-page min-h-screen">
      <header className="mx-auto flex h-20 max-w-[1200px] items-center justify-between px-4 md:px-8">
        <Link href="/" className="text-[24px]">
          <Wordmark />
        </Link>
        <p className="text-sm text-zinc-600">
          Hesabın var mı?{" "}
          <Link href="/panel/giris" className="font-semibold text-zinc-900 underline underline-offset-4">
            Giriş yap
          </Link>
        </p>
      </header>

      <div className="mx-auto max-w-[1200px] px-4 pb-16 md:px-8">
        {/* İlerleme */}
        <ol className="no-scrollbar mx-auto flex max-w-[900px] items-center gap-2 overflow-x-auto pb-2 md:justify-center" aria-label="Kurulum adımları">
          {[...STEPS, "Kur"].map((label, i) => (
            <li key={label} className="flex shrink-0 items-center gap-2">
              <span
                className={clsx(
                  "grid h-8 w-8 place-items-center rounded-full text-xs font-bold transition",
                  i < step ? "bg-zinc-900 text-white" : i === step ? "bg-white text-zinc-900 ring-2 ring-zinc-900" : "bg-white/60 text-zinc-400 ring-1 ring-black/10",
                )}
              >
                {i < step ? <Check size={14} /> : i + 1}
              </span>
              <span className={clsx("text-sm", i === step ? "font-semibold" : "text-zinc-500")}>{label}</span>
              {i < STEPS.length && <span className="mx-1 h-px w-4 bg-black/10 md:w-8" />}
            </li>
          ))}
        </ol>

        <div className={clsx("glass-strong mx-auto mt-6 rounded-[32px] p-6 md:p-10", wide ? "max-w-[1100px]" : "max-w-[760px]")}>
          {step === 0 && (
            <section>
              <h1 className="text-[28px] font-semibold tracking-[-0.03em] md:text-[34px]">Hesabını oluştur</h1>
              <p className="mt-1 text-zinc-600">{p.trialDays} gün boyunca tüm özellikler ücretsiz. Kart bilgisi istemiyoruz.</p>
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <Field label="Ad soyad">
                  <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={inputCls} autoFocus />
                </Field>
                <Field label="Telefon (isteğe bağlı)">
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" autoComplete="tel" placeholder="05xx xxx xx xx" className={inputCls} />
                </Field>
                <Field label="E-posta">
                  <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" className={inputCls} />
                </Field>
                <Field label="Şifre" hint="En az 8 karakter">
                  <span className="relative block">
                    <input value={password} onChange={(e) => setPassword(e.target.value)} type={showPw ? "text" : "password"} autoComplete="new-password" className={`${inputCls} pr-12`} />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" aria-label={showPw ? "Şifreyi gizle" : "Şifreyi göster"}>
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </span>
                </Field>
              </div>
              <label className="mt-5 flex items-start gap-3 text-sm text-zinc-600">
                <input type="checkbox" checked={kvkk} onChange={(e) => setKvkk(e.target.checked)} className="mt-0.5 h-4 w-4" />
                <span>Kullanım koşullarını ve KVKK aydınlatma metnini okudum, kabul ediyorum.</span>
              </label>
            </section>
          )}

          {step === 1 && (
            <section>
              <h1 className="text-[28px] font-semibold tracking-[-0.03em] md:text-[34px]">Mağazanı tanıyalım</h1>
              <p className="mt-1 text-zinc-600">Bu bilgileri daha sonra panelden değiştirebilirsin.</p>
              <div className="mt-8 space-y-4">
                <Field label="Mağaza adı">
                  <input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Örn. Adım Sneakers" className={inputCls} autoFocus />
                </Field>
                <Field
                  label="Site adresi"
                  hint={
                    <>
                      Mağazan <b className="text-zinc-800">{slug || "magazan"}.{p.rootDomain}</b> adresinde açılır. Kendi alan adını sonra bağlayabilirsin.
                    </>
                  }
                >
                  <span className="flex items-center rounded-2xl border border-black/10 bg-white/80 pr-4 focus-within:border-zinc-900 focus-within:ring-4 focus-within:ring-zinc-900/5">
                    <input
                      value={slugTouched ? slugInput : slug}
                      onChange={(e) => {
                        setSlugTouched(true);
                        setSlugInput(e.target.value);
                      }}
                      className="h-12 min-w-0 flex-1 rounded-2xl bg-transparent px-4 text-[15px] outline-none"
                      style={{ backgroundColor: "transparent" }}
                    />
                    <span className="shrink-0 text-sm text-zinc-500">.{p.rootDomain}</span>
                  </span>
                </Field>
                <Field label="Şehir">
                  <select value={city} onChange={(e) => setCity(e.target.value)} className={inputCls}>
                    {p.cities.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </section>
          )}

          {step === 2 && (
            <section>
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <h1 className="text-[28px] font-semibold tracking-[-0.03em] md:text-[34px]">Tasarımını seç</h1>
                  <p className="mt-1 text-zinc-600">10 hazır mağaza tasarımı. İstediğin zaman değiştirebilirsin.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mr-1 text-sm text-zinc-600">Ana renk</span>
                  {[themeOpt.primary, ...SWATCHES.filter((s) => s !== themeOpt.primary)].slice(0, 8).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setPrimary(c === themeOpt.primary ? null : c)}
                      aria-label={`Renk ${c}`}
                      className={clsx("h-8 w-8 rounded-full ring-offset-2 transition", color === c ? "ring-2 ring-zinc-900" : "ring-1 ring-black/10")}
                      style={{ background: c }}
                    />
                  ))}
                  <label className="relative h-8 w-8 cursor-pointer overflow-hidden rounded-full ring-1 ring-black/10" title="Özel renk">
                    <span className="absolute inset-0 bg-[conic-gradient(red,yellow,lime,cyan,blue,magenta,red)]" />
                    <input type="color" value={color} onChange={(e) => setPrimary(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Özel renk" />
                  </label>
                </div>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
                {p.themes.map((t) => {
                  const on = t.key === theme;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => {
                        setTheme(t.key);
                        setPrimary(null);
                      }}
                      aria-pressed={on}
                      className={clsx("group overflow-hidden rounded-3xl border-2 bg-white/70 text-left transition", on ? "border-zinc-900 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.45)]" : "border-transparent ring-1 ring-black/5 hover:ring-black/20")}
                    >
                      <div className="relative">
                        <ThemeThumb theme={t.key} colors={on ? { primary: color, accent: t.accent } : undefined} />
                        {on && (
                          <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-zinc-900 text-white">
                            <Check size={15} />
                          </span>
                        )}
                      </div>
                      <div className="px-4 py-3">
                        <p className="font-semibold">{t.name}</p>
                        <p className="line-clamp-1 text-xs text-zinc-500">{t.tagline}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {step === 3 && (
            <section>
              <h1 className="text-[28px] font-semibold tracking-[-0.03em] md:text-[34px]">Ürünlerle başla</h1>
              <p className="mt-1 text-zinc-600">Hazır katalogda {p.poolTotal.toLocaleString("tr-TR")} ürün var; görselleri, bedenleri ve açıklamalarıyla eklenir.</p>
              <div className="mt-8 grid gap-3 md:grid-cols-3">
                {(
                  [
                    ["top", "Çok satanlarla başla", "En popüler ürünler hazır gelsin"],
                    ["select", "Kendim seçeyim", "Marka ve kategori seç"],
                    ["empty", "Boş başla", "Ürünlerimi sonra eklerim"],
                  ] as const
                ).map(([k, t, d]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setCatalog(k)}
                    aria-pressed={catalog === k}
                    className={clsx("rounded-3xl border-2 p-5 text-left transition", catalog === k ? "border-zinc-900 bg-white" : "border-transparent bg-white/60 ring-1 ring-black/5 hover:bg-white")}
                  >
                    <span className="flex items-center justify-between font-semibold">
                      {t}
                      <span className={clsx("grid h-5 w-5 place-items-center rounded-full border-2", catalog === k ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300")}>{catalog === k && <Check size={11} />}</span>
                    </span>
                    <span className="mt-1 block text-sm text-zinc-500">{d}</span>
                  </button>
                ))}
              </div>
              {catalog === "select" && (
                <div className="mt-6 space-y-5">
                  <div>
                    <p className="mb-2 text-sm font-medium text-zinc-700">Markalar</p>
                    <div className="flex flex-wrap gap-2">
                      {p.brands.map((b) => (
                        <Chip key={b.name} on={brands.includes(b.name)} onClick={() => toggle(brands, setBrands, b.name)}>
                          {b.name} <span className="opacity-60">· {b.count}</span>
                        </Chip>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium text-zinc-700">Kategoriler</p>
                    <div className="flex flex-wrap gap-2">
                      {p.categories.map((c) => (
                        <Chip key={c.key} on={categories.includes(c.key)} onClick={() => toggle(categories, setCategories, c.key)}>
                          {c.label} <span className="opacity-60">· {c.count}</span>
                        </Chip>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <p className="mt-6 rounded-2xl bg-white/70 px-4 py-3 text-sm text-zinc-600">
                {catalog === "empty" ? "Mağazan ürünsüz kurulacak. Panelden Katalog sayfasıyla dilediğin zaman ekleyebilirsin." : <>Yaklaşık <b className="text-zinc-900">{estimate}</b> ürün eklenecek. Fiyat ve stokları sonra kendin belirlersin.</>}
              </p>
            </section>
          )}

          {step === 4 && (
            <section>
              <h1 className="text-[28px] font-semibold tracking-[-0.03em] md:text-[34px]">Paketini seç</h1>
              <p className="mt-1 text-zinc-600">{p.trialDays} gün ücretsiz dene; süre bitmeden ödeme istemiyoruz.</p>
              <div className="mt-8 grid gap-3 md:grid-cols-3">
                {p.plans.map((x) => (
                  <button
                    key={x.key}
                    type="button"
                    onClick={() => setPlan(x.key)}
                    aria-pressed={plan === x.key}
                    className={clsx("flex flex-col rounded-3xl border-2 p-5 text-left transition", plan === x.key ? "border-zinc-900 bg-white" : "border-transparent bg-white/60 ring-1 ring-black/5 hover:bg-white")}
                  >
                    <span className="flex items-center justify-between font-semibold">
                      {x.name}
                      <span className={clsx("grid h-5 w-5 place-items-center rounded-full border-2", plan === x.key ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300")}>{plan === x.key && <Check size={11} />}</span>
                    </span>
                    <span className="mt-3 text-2xl font-[800] tracking-tight">
                      {x.price.toLocaleString("tr-TR")} ₺<span className="text-sm font-medium text-zinc-500"> /ay</span>
                    </span>
                    <ul className="mt-3 space-y-1.5 text-sm text-zinc-600">
                      {x.features.map((f) => (
                        <li key={f} className="flex gap-1.5">
                          <Check size={14} className="mt-0.5 shrink-0" /> {f}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>
            </section>
          )}

          {step === 5 && (
            <section>
              <h1 className="text-[28px] font-semibold tracking-[-0.03em] md:text-[34px]">Her şey hazır</h1>
              <p className="mt-1 text-zinc-600">Kontrol et ve mağazanı kur. Siten önce taslak olarak açılır, sen hazır olunca yayına alırsın.</p>
              <div className="mt-8 grid gap-6 md:grid-cols-[1fr_280px]">
                <dl className="divide-y divide-black/5 rounded-3xl bg-white/70 px-5">
                  {(
                    [
                      ["Hesap", `${name} · ${email}`, 0],
                      ["Mağaza", `${storeName} · ${city}`, 1],
                      ["Adres", `${slug}.${p.rootDomain}`, 1],
                      ["Tasarım", `${themeOpt.name} · ${color}`, 2],
                      ["Ürünler", catalog === "empty" ? "Boş başla" : `Yaklaşık ${estimate} ürün`, 3],
                      ["Paket", `${planOpt.name} · ${p.trialDays} gün ücretsiz`, 4],
                    ] as const
                  ).map(([k, v, s]) => (
                    <div key={k} className="flex items-center gap-3 py-3.5 text-sm">
                      <dt className="w-20 shrink-0 text-zinc-500">{k}</dt>
                      <dd className="min-w-0 flex-1 truncate font-medium">{v}</dd>
                      <button type="button" onClick={() => setStep(s)} className="text-xs text-zinc-500 underline underline-offset-4">
                        Değiştir
                      </button>
                    </div>
                  ))}
                </dl>
                <div className="overflow-hidden rounded-3xl bg-white/70 ring-1 ring-black/5">
                  <ThemeThumb theme={theme} colors={{ primary: color, accent: themeOpt.accent }} />
                  <p className="px-4 py-3 text-sm font-semibold">{storeName}</p>
                </div>
              </div>
            </section>
          )}

          {error && (
            <p className="mt-6 flex items-start gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
              <CircleAlert size={17} className="mt-0.5 shrink-0" /> {error}
            </p>
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            {step > 0 ? (
              <button type="button" onClick={() => (setError(null), setStep(step - 1))} disabled={building} className="inline-flex h-12 items-center gap-2 rounded-full border-[1.5px] border-zinc-900 px-5 text-[15px] font-semibold hover:bg-white">
                <ArrowLeft size={17} /> Geri
              </button>
            ) : (
              <span />
            )}
            {step < STEPS.length ? (
              <button type="button" onClick={next} disabled={checking} className="inline-flex h-12 items-center gap-2 rounded-full bg-zinc-900 px-6 text-[15px] font-semibold text-white shadow-[0_10px_24px_-10px_rgba(0,0,0,0.6)] disabled:opacity-60">
                {checking ? <Loader2 size={17} className="animate-spin" /> : null} Devam <ArrowRight size={17} />
              </button>
            ) : (
              <button type="button" onClick={finish} disabled={building} className="inline-flex h-12 items-center gap-2 rounded-full bg-zinc-900 px-7 text-[15px] font-semibold text-white shadow-[0_10px_24px_-10px_rgba(0,0,0,0.6)] disabled:opacity-60">
                Mağazamı kur <ArrowRight size={17} />
              </button>
            )}
          </div>
        </div>
      </div>

      {building && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-white/40 p-6 backdrop-blur-xl" role="status" aria-live="polite">
          <div className="text-center">
            <div className="orb-halo relative mx-auto grid place-items-center">
              <span className="orb block h-28 w-28 animate-pulse" />
            </div>
            <p className="mt-8 text-2xl font-semibold tracking-tight">{storeName} kuruluyor</p>
            <ul className="mx-auto mt-5 w-64 space-y-2 text-left text-sm">
              {BUILD_STEPS.map((s, i) => (
                <li key={s} className={clsx("flex items-center gap-2 transition", i <= buildIdx ? "text-zinc-900" : "text-zinc-400")}>
                  {i < buildIdx ? <Check size={15} /> : i === buildIdx ? <Loader2 size={15} className="animate-spin" /> : <span className="h-[15px] w-[15px] rounded-full border border-zinc-300" />}
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
