import Link from "next/link";

export default function StoreNotFound() {
  return (
    <div className="container-x flex flex-col items-center justify-center py-24 text-center">
      <p className="font-heading text-8xl font-black text-line">404</p>
      <h1 className="mt-4 font-heading text-2xl font-bold md:text-3xl">Aradığın sayfa bulunamadı</h1>
      <p className="mt-2 max-w-md text-muted">Sayfa kaldırılmış, adı değişmiş ya da geçici olarak kullanılamıyor olabilir.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="rounded-theme bg-primary px-6 py-3 text-sm font-semibold text-primary-fg">
          Ana Sayfaya Dön
        </Link>
        <Link href="/yeni-gelenler" className="rounded-theme border border-line px-6 py-3 text-sm font-semibold">
          Yeni Gelenler
        </Link>
      </div>
    </div>
  );
}
