import Link from "next/link";
import { getPlatformSetting } from "@/lib/platform-settings";

/** Panel giriş, kayıt ve şifre sayfaları için ortak iki kolonlu düzen. */
export async function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  const general = await getPlatformSetting("general");
  return (
    <div className="grid min-h-screen bg-zinc-950 font-sans lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-12 text-white lg:flex">
        <Link href="/" className="text-xl font-black tracking-tight">
          SNEAKER<span className="text-orange-500">OS</span>
        </Link>
        <div>
          <h1 className="text-4xl font-bold leading-tight">
            Shopier satıcıları için
            <br />
            çok siteli sneaker mağaza platformu
          </h1>
          <ul className="mt-8 space-y-3 text-sm text-zinc-400">
            <li>• Dakikalar içinde site kur, 10 hazır mağaza teması</li>
            <li>• Katalog havuzundan görselleriyle hazır ürün ekle</li>
            <li>• Shopier ile ödeme, ürün ve sipariş senkronu</li>
            <li>• Her siteye özgün SEO metinleri ve yapay zeka açıklamaları</li>
          </ul>
        </div>
        <p className="text-xs text-zinc-600">
          © {new Date().getFullYear()} {general.platformName}
          {general.supportEmail && ` · ${general.supportEmail}`}
        </p>
      </div>
      <div className="grid place-items-center bg-white p-6">
        <div className="w-full max-w-sm py-8">
          <Link href="/" className="text-xl font-black tracking-tight text-zinc-900 lg:hidden">
            SNEAKER<span className="text-orange-500">OS</span>
          </Link>
          <h2 className="mt-6 text-2xl font-bold text-zinc-900">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}
