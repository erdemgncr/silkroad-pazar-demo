import Link from "next/link";
import { getPlatformSetting } from "@/lib/platform-settings";
import { Wordmark } from "@/components/panel/shell";

/** Panel giriş ve şifre sayfaları için aydınlık cam düzen. */
export async function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  const general = await getPlatformSetting("general");
  return (
    <div className="glass-page flex min-h-screen flex-col">
      <header className="mx-auto flex h-20 w-full max-w-[1200px] items-center justify-between px-4 md:px-8">
        <Link href="/" className="text-[24px]">
          <Wordmark />
        </Link>
        {general.signupOpen && (
          <Link href="/panel/kayit" className="inline-flex h-10 items-center rounded-full bg-zinc-900 px-5 text-sm font-semibold text-white">
            Ücretsiz üye ol
          </Link>
        )}
      </header>
      <main className="mx-auto grid w-full max-w-[1200px] flex-1 items-center gap-10 px-4 pb-16 md:px-8 lg:grid-cols-[1fr_440px]">
        <div className="hidden lg:block">
          <div className="orb-halo relative mb-10 inline-grid place-items-center">
            <span className="orb block h-24 w-24" />
          </div>
          <h1 className="max-w-[520px] text-[52px] font-[800] leading-[1.03] tracking-[-0.045em]">Mağazan seni bekliyor.</h1>
          <p className="mt-4 max-w-[460px] text-lg text-zinc-600">Siparişler, ürünler ve kampanyalar tek yerde. Ne istediğini yaz, gerisini {general.platformName} hazırlasın.</p>
        </div>
        <div className="glass-strong w-full rounded-[32px] p-7 md:p-9">
          <h2 className="text-[26px] font-semibold tracking-[-0.03em]">{title}</h2>
          {subtitle && <p className="mt-1 text-[15px] text-zinc-600">{subtitle}</p>}
          {children}
        </div>
      </main>
      <footer className="pb-6 text-center text-xs text-zinc-500">
        © {new Date().getFullYear()} {general.platformName}
        {general.supportEmail && ` · ${general.supportEmail}`}
      </footer>
    </div>
  );
}
