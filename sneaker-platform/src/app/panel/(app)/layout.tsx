import type { Metadata } from "next";
import { requirePanel } from "@/lib/panel";
import { PanelNav } from "@/components/panel/nav";
import { panelLogout } from "@/lib/actions/panel-auth";
import { PLANS } from "@/lib/plans";

export const metadata: Metadata = { title: { default: "Panel", template: "%s | SneakerOS Panel" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: LayoutProps<"/panel">) {
  const { user, merchant, isPlatform } = await requirePanel();
  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 lg:grid lg:grid-cols-[256px_1fr]">
      <PanelNav
        isPlatform={isPlatform}
        userName={user.name}
        accountName={isPlatform ? "Platform Yönetimi" : (merchant?.name ?? "")}
        planName={merchant ? PLANS[merchant.plan].name : "Süper Admin"}
        logout={panelLogout}
      />
      <div className="min-w-0">
        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
