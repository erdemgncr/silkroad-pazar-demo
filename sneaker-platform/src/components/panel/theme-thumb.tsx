import type { ThemeKey } from "@/themes/registry";

/** Panelde tema kartları için küçük şematik önizleme. */
export function ThemeThumb({ theme }: { theme: ThemeKey }) {
  const cfg: Record<ThemeKey, { bg: string; fg: string; accent: string; bar: string; card: string; radius: number }> = {
    urban: { bg: "#ffffff", fg: "#111111", accent: "#ff4d00", bar: "#000000", card: "#f5f5f5", radius: 0 },
    arena: { bg: "#ffffff", fg: "#0b1f44", accent: "#ffd400", bar: "#0b1f44", card: "#f1f5f9", radius: 6 },
    neon: { bg: "#0a0a0a", fg: "#f5f5f5", accent: "#c6ff00", bar: "#c6ff00", card: "#151515", radius: 1 },
    studio: { bg: "#f7f3ec", fg: "#1c1917", accent: "#9a3412", bar: "#1c1917", card: "#efe9df", radius: 0 },
    pulse: { bg: "#ffffff", fg: "#0f172a", accent: "#f97316", bar: "#1d4ed8", card: "#eef2ff", radius: 10 },
  };
  const c = cfg[theme];
  return (
    <svg viewBox="0 0 200 130" className="block w-full" aria-hidden>
      <rect width="200" height="130" fill={c.bg} />
      <rect width="200" height="6" fill={c.bar} />
      {theme === "arena" ? (
        <>
          <rect x="8" y="10" width="26" height="8" rx="2" fill={c.fg} />
          <rect x="44" y="10" width="110" height="8" rx="4" fill="none" stroke={c.fg} strokeWidth="1.2" />
          <rect x="0" y="22" width="200" height="8" fill={c.fg} />
        </>
      ) : theme === "studio" || theme === "neon" ? (
        <>
          <rect x="80" y="10" width="40" height="8" rx="1" fill={theme === "neon" ? c.accent : c.fg} />
          <rect x="60" y="22" width="80" height="3" fill={c.fg} opacity="0.4" />
        </>
      ) : (
        <>
          <rect x="8" y="11" width="30" height="7" fill={c.fg} />
          <rect x="60" y="13" width="80" height="3" fill={c.fg} opacity="0.5" />
          <circle cx="186" cy="14" r="3" fill={c.fg} />
        </>
      )}
      <rect x={theme === "pulse" || theme === "arena" ? 8 : 0} y="34" width={theme === "pulse" || theme === "arena" ? (theme === "arena" ? 120 : 184) : 200} height="46" rx={c.radius} fill={theme === "studio" ? c.card : c.fg} opacity={theme === "studio" ? 1 : 0.9} />
      {theme === "arena" && (
        <>
          <rect x="132" y="34" width="60" height="22" rx={c.radius} fill={c.accent} />
          <rect x="132" y="58" width="60" height="22" rx={c.radius} fill="#e30613" />
        </>
      )}
      {theme === "studio" && <rect x="100" y="34" width="100" height="46" fill={c.accent} opacity="0.35" />}
      <rect x={theme === "neon" ? 70 : 16} y={theme === "neon" ? 50 : 60} width="60" height="7" fill={theme === "studio" ? c.fg : theme === "neon" ? c.accent : "#ffffff"} />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x={8 + i * 48} y="88" width="40" height="28" rx={c.radius} fill={c.card} />
          <rect x={8 + i * 48} y="119" width="26" height="3" fill={c.fg} opacity="0.6" />
        </g>
      ))}
    </svg>
  );
}
