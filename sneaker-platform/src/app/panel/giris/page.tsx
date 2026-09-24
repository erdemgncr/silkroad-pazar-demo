import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Panel Girişi", robots: { index: false, follow: false } };

export default function PanelLoginPage() {
  return (
    <div className="grid min-h-screen bg-zinc-950 font-sans lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-12 text-white lg:flex">
        <p className="text-xl font-black tracking-tight">SNEAKER<span className="text-orange-500">OS</span></p>
        <div>
          <h1 className="text-4xl font-bold leading-tight">
            Shopier satıcıları için
            <br />
            çok siteli sneaker mağaza platformu
          </h1>
          <ul className="mt-8 space-y-3 text-sm text-zinc-400">
            <li>• Dakikalar içinde site kur, 5 hazır tema</li>
            <li>• Katalog havuzundan görselleriyle hazır ürün ekle</li>
            <li>• Shopier ile ödeme, ürün ve sipariş senkronu</li>
            <li>• Her siteye özgün SEO metinleri ve yapay zeka açıklamaları</li>
          </ul>
        </div>
        <p className="text-xs text-zinc-600">© {new Date().getFullYear()} SneakerOS</p>
      </div>
      <div className="grid place-items-center bg-white p-6">
        <div className="w-full max-w-sm">
          <p className="text-xl font-black tracking-tight lg:hidden">
            SNEAKER<span className="text-orange-500">OS</span>
          </p>
          <h2 className="mt-6 text-2xl font-bold text-zinc-900">Panele giriş yap</h2>
          <p className="mt-1 text-sm text-zinc-500">Satıcı ya da platform hesabınla giriş yapabilirsin.</p>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
