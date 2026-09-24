import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-zinc-50 px-6 text-center font-sans">
      <div>
        <p className="text-7xl font-black text-zinc-200">404</p>
        <h1 className="mt-4 text-2xl font-bold text-zinc-900">Sayfa bulunamadı</h1>
        <p className="mt-2 text-zinc-500">Bu adreste bir sayfa ya da tanımlı bir site yok.</p>
        <Link href="/panel" className="mt-6 inline-block rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white">
          Panele git
        </Link>
      </div>
    </div>
  );
}
