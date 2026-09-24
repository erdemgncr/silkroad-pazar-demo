import { ImageResponse } from "next/og";
import { resolveSite } from "@/lib/site";
import { readableOn } from "@/lib/color";

const size = { width: 64, height: 64 };

/**
 * Siteye özel favicon: logo harfi, tema rengiyle.
 * Dosya tabanlı icon.tsx yerine route kullanılır; böylece bağlantı iç yolu (/s/...) değil,
 * sitenin kendi adresindeki /site-icon olur ve panel önizlemesinde de çalışır.
 */
export async function GET(_: Request, { params }: RouteContext<"/s/[site]/site-icon">) {
  const { site: key } = await params;
  const site = await resolveSite(key);
  const bg = site?.settings.colors.primary ?? "#111111";
  const letter = (site?.settings.logoText || site?.name || "S").trim().charAt(0).toLocaleUpperCase("tr-TR");
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: bg,
          color: readableOn(bg),
          fontSize: 44,
          fontWeight: 800,
          borderRadius: site?.theme === "pulse" ? 32 : site?.theme === "arena" || site?.theme === "outlet" ? 14 : site?.theme === "metro" ? 8 : 0,
        }}
      >
        {letter}
      </div>
    ),
    { ...size, headers: { "Cache-Control": "public, max-age=3600" } },
  );
}
