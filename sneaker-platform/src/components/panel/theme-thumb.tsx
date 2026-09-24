import type { ThemeKey } from "@/themes/registry";

type Cfg = {
  bg: string;
  fg: string;
  accent: string;
  bar: string;
  card: string;
  radius: number;
  header: "left" | "center" | "double" | "inset" | "pills" | "bold";
  hero: "full" | "grid" | "centered" | "split" | "bordered" | "rounded";
  cards: "square" | "tall" | "dense" | "boxed" | "rounded";
};

const CFG: Record<ThemeKey, Cfg> = {
  urban: { bg: "#ffffff", fg: "#111111", accent: "#ff4d00", bar: "#000000", card: "#f2f2f2", radius: 0, header: "left", hero: "full", cards: "square" },
  arena: { bg: "#ffffff", fg: "#0b1f44", accent: "#ffd400", bar: "#0b1f44", card: "#f1f5f9", radius: 5, header: "double", hero: "grid", cards: "square" },
  neon: { bg: "#0a0a0a", fg: "#f5f5f5", accent: "#c6ff00", bar: "#c6ff00", card: "#171717", radius: 1, header: "center", hero: "centered", cards: "tall" },
  studio: { bg: "#f7f3ec", fg: "#1c1917", accent: "#9a3412", bar: "#1c1917", card: "#ebe3d6", radius: 0, header: "center", hero: "split", cards: "tall" },
  pulse: { bg: "#ffffff", fg: "#0f172a", accent: "#f97316", bar: "#1d4ed8", card: "#eef2ff", radius: 10, header: "pills", hero: "rounded", cards: "rounded" },
  volt: { bg: "#ffffff", fg: "#111111", accent: "#1f1bff", bar: "#111111", card: "#f1f1f1", radius: 0, header: "inset", hero: "full", cards: "square" },
  metro: { bg: "#ffffff", fg: "#111111", accent: "#d0021b", bar: "#161616", card: "#f4f4f4", radius: 4, header: "left", hero: "full", cards: "square" },
  brut: { bg: "#f3f0e8", fg: "#0a0a0a", accent: "#ffe600", bar: "#ffe600", card: "#ffffff", radius: 0, header: "bold", hero: "bordered", cards: "boxed" },
  luxe: { bg: "#0b0b0c", fg: "#f3efe6", accent: "#c9a45c", bar: "#0b0b0c", card: "#171614", radius: 0, header: "center", hero: "centered", cards: "tall" },
  outlet: { bg: "#ffffff", fg: "#1b1b1b", accent: "#ff6000", bar: "#ffb400", card: "#f5f5f7", radius: 6, header: "double", hero: "grid", cards: "dense" },
};

/** Panelde tema kartları için şematik önizleme (header, vitrin ve ürün kartı düzeni). */
export function ThemeThumb({ theme, colors }: { theme: ThemeKey; colors?: { primary: string; accent: string } }) {
  const c = CFG[theme];
  const accent = colors?.accent ?? c.accent;
  const primary = colors?.primary ?? c.fg;
  const line = c.fg;
  const r = c.radius;

  const header = (() => {
    switch (c.header) {
      case "double":
        return (
          <>
            <rect x="8" y="10" width="24" height="8" rx="2" fill={primary} />
            <rect x="40" y="10" width="112" height="8" rx="4" fill="none" stroke={primary} strokeWidth="1.2" />
            <circle cx="170" cy="14" r="3" fill={line} />
            <circle cx="184" cy="14" r="3" fill={line} />
            <rect x="0" y="22" width="200" height="7" fill={theme === "outlet" ? c.bg : primary} />
            {[0, 1, 2, 3, 4].map((i) => (
              <rect key={i} x={10 + i * 26} y="24.5" width="18" height="2" fill={theme === "outlet" ? line : "#ffffff"} opacity="0.7" />
            ))}
            {theme === "outlet" && <rect x="162" y="23.5" width="30" height="4.5" rx="2" fill="#e3001b" />}
          </>
        );
      case "center":
        return (
          <>
            <rect x="80" y="11" width="40" height="7" rx="1" fill={theme === "neon" ? accent : line} />
            {theme === "luxe" && <rect x="92" y="20" width="16" height="1.5" fill={accent} />}
            {[0, 1, 2, 3, 4].map((i) => (
              <rect key={i} x={58 + i * 18} y="25" width="12" height="1.8" fill={line} opacity="0.45" />
            ))}
            <circle cx="186" cy="14" r="2.6" fill={line} />
          </>
        );
      case "inset":
        return (
          <>
            <rect x="4" y="9" width="192" height="13" fill="#8a8a8a" />
            {[0, 1, 2].map((i) => (
              <rect key={i} x={10 + i * 16} y="14" width="11" height="3" fill="#ffffff" />
            ))}
            <rect x="84" y="12.5" width="32" height="6" fill="#ffffff" />
            <circle cx="176" cy="15.5" r="2.4" fill="#ffffff" />
            <circle cx="186" cy="15.5" r="2.4" fill="#ffffff" />
          </>
        );
      case "pills":
        return (
          <>
            <circle cx="14" cy="15" r="5" fill={accent} />
            <rect x="22" y="12" width="22" height="6" rx="3" fill={line} />
            {[0, 1, 2, 3].map((i) => (
              <rect key={i} x={56 + i * 24} y="11" width="20" height="8" rx="4" fill={c.card} />
            ))}
            <circle cx="172" cy="15" r="5" fill={c.card} />
            <circle cx="186" cy="15" r="5" fill={c.card} />
          </>
        );
      case "bold":
        return (
          <>
            <rect x="8" y="10" width="34" height="10" fill={accent} stroke={line} strokeWidth="1.5" />
            {[0, 1, 2, 3, 4].map((i) => (
              <rect key={i} x={54 + i * 20} y="13.5" width="14" height="3" fill={line} />
            ))}
            <rect x="0" y="25" width="200" height="1.8" fill={line} />
            <circle cx="186" cy="15" r="3" fill={line} />
          </>
        );
      default:
        return (
          <>
            <rect x="8" y="11" width="30" height="7" fill={theme === "metro" ? accent : line} />
            {[0, 1, 2, 3, 4].map((i) => (
              <rect key={i} x={62 + i * 17} y="13" width="12" height="3" fill={line} opacity="0.55" />
            ))}
            <circle cx="176" cy="14.5" r="2.6" fill={line} />
            <circle cx="187" cy="14.5" r="2.6" fill={line} />
          </>
        );
    }
  })();

  const hero = (() => {
    const y = 32;
    switch (c.hero) {
      case "grid":
        return (
          <>
            <rect x="8" y={y} width="120" height="46" rx={r} fill={primary} opacity="0.92" />
            <rect x="16" y={y + 28} width="44" height="6" fill="#ffffff" />
            <rect x="132" y={y} width="60" height="22" rx={r} fill={accent} />
            <rect x="132" y={y + 24} width="60" height="22" rx={r} fill={theme === "outlet" ? "#1b1b1b" : "#e30613"} />
          </>
        );
      case "centered":
        return (
          <>
            <rect x="0" y={y} width="200" height="46" fill={c.card} />
            <rect x="60" y={y + 14} width="80" height="8" fill={theme === "luxe" ? line : accent} />
            <rect x="80" y={y + 28} width="40" height="6" fill="none" stroke={accent} strokeWidth="1" />
          </>
        );
      case "split":
        return (
          <>
            <rect x="0" y={y} width="100" height="46" fill={c.card} />
            <rect x="100" y={y} width="100" height="46" fill={accent} opacity="0.35" />
            <rect x="14" y={y + 16} width="60" height="7" fill={line} />
            <rect x="14" y={y + 28} width="30" height="2" fill={line} />
          </>
        );
      case "bordered":
        return (
          <>
            <rect x="10" y={y + 2} width="182" height="44" fill={line} />
            <rect x="8" y={y} width="182" height="44" fill={c.card} stroke={line} strokeWidth="1.5" />
            <rect x="8" y={y} width="96" height="44" fill={accent} stroke={line} strokeWidth="1.5" />
            <rect x="16" y={y + 12} width="70" height="8" fill={line} />
            <rect x="16" y={y + 24} width="50" height="8" fill={line} />
          </>
        );
      case "rounded":
        return (
          <>
            <rect x="8" y={y} width="184" height="46" rx={r} fill={primary} />
            <rect x="20" y={y + 16} width="60" height="8" rx="2" fill="#ffffff" />
            <rect x="20" y={y + 29} width="28" height="7" rx="3.5" fill={accent} />
          </>
        );
      default:
        return (
          <>
            <rect x={theme === "volt" ? 4 : 0} y={y} width={theme === "volt" ? 192 : 200} height="46" fill={line} opacity="0.88" />
            <rect x="16" y={y + 24} width="64" height="8" fill="#ffffff" />
            <rect x="16" y={y + 35} width="26" height="5" fill={theme === "volt" ? "#ffffff" : accent} />
          </>
        );
    }
  })();

  const cards = (() => {
    const y = 86;
    if (c.cards === "dense") {
      return [0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <rect x={8 + i * 37.5} y={y} width="33" height="30" rx={r} fill={c.card} stroke="#e5e5e5" strokeWidth="0.6" />
          <rect x={10 + i * 37.5} y={y + 22} width="11" height="6" rx="1.5" fill="#e3001b" />
          <rect x={8 + i * 37.5} y={y + 34} width="20" height="3" fill={accent} />
        </g>
      ));
    }
    if (c.cards === "tall") {
      return [0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={14 + i * 60} y={y - 2} width="52" height="32" fill={c.card} />
          <rect x={28 + i * 60} y={y + 34} width="24" height="2.5" fill={theme === "luxe" ? accent : line} opacity="0.8" />
        </g>
      ));
    }
    if (c.cards === "boxed") {
      return [0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x={11 + i * 47} y={y + 2} width="40" height="34" fill={line} />
          <rect x={9 + i * 47} y={y} width="40" height="34" fill={c.card} stroke={line} strokeWidth="1.2" />
          <rect x={12 + i * 47} y={y + 26} width="16" height="5" fill={accent} stroke={line} strokeWidth="0.8" />
        </g>
      ));
    }
    return [0, 1, 2, 3].map((i) => (
      <g key={i}>
        <rect x={8 + i * 48} y={y} width="40" height="28" rx={c.cards === "rounded" ? 8 : r} fill={c.card} />
        <rect x={8 + i * 48} y={y + 31} width="26" height="3" fill={line} opacity="0.7" />
        <rect x={8 + i * 48} y={y + 36} width="16" height="3" fill={theme === "metro" ? line : accent} opacity="0.9" />
      </g>
    ));
  })();

  return (
    <svg viewBox="0 0 200 130" className="block w-full" aria-hidden>
      <rect width="200" height="130" fill={c.bg} />
      <rect width="200" height="5" fill={c.header === "inset" ? "#000000" : c.bar} />
      {header}
      {hero}
      {cards}
    </svg>
  );
}
