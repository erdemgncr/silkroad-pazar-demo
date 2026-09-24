import Link from "next/link";
import { Fragment } from "react";

/**
 * Basit ve güvenli işaretleme dili (HTML çalıştırılmaz):
 *   ## Başlık, ### Alt başlık, - madde, 1. numaralı madde, | tablo | satırı |,
 *   **kalın**, [bağlantı metni](/yol)
 * Paragraflar boş satırla ayrılır.
 */
function inline(text: string, keyPrefix: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /(\*\*([^*]+)\*\*)|(\[([^\]]+)\]\(([^)\s]+)\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) out.push(<strong key={`${keyPrefix}-b${i++}`}>{m[2]}</strong>);
    else if (m[3]) {
      const href = m[5];
      const safe = href.startsWith("/") || href.startsWith("https://") || href.startsWith("mailto:") || href.startsWith("tel:");
      out.push(
        safe ? (
          href.startsWith("/") ? (
            <Link key={`${keyPrefix}-l${i++}`} href={href}>
              {m[4]}
            </Link>
          ) : (
            <a key={`${keyPrefix}-l${i++}`} href={href} target={href.startsWith("https://") ? "_blank" : undefined} rel="noopener noreferrer">
              {m[4]}
            </a>
          )
        ) : (
          m[4]
        ),
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function RichText({ source, className = "prose-store" }: { source: string; className?: string }) {
  const blocks = source.replace(/\r\n/g, "\n").split(/\n{2,}/);
  return (
    <div className={className}>
      {blocks.map((raw, bi) => {
        const block = raw.trim();
        if (!block) return null;
        const lines = block.split("\n");
        const k = `blk${bi}`;
        if (block.startsWith("### ")) return <h3 key={k}>{inline(block.slice(4), k)}</h3>;
        if (block.startsWith("## ")) {
          const [head, ...rest] = lines;
          return (
            <Fragment key={k}>
              <h2>{inline(head.slice(3), k)}</h2>
              {rest.length > 0 && <RichText source={rest.join("\n")} className="" />}
            </Fragment>
          );
        }
        if (lines.every((l) => l.trim().startsWith("|"))) {
          const rows = lines.map((l) =>
            l
              .trim()
              .replace(/^\||\|$/g, "")
              .split("|")
              .map((c) => c.trim()),
          );
          const [head, ...body] = rows.filter((r) => !r.every((c) => /^-+$/.test(c)));
          return (
            <div key={k} className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    {head.map((c, ci) => (
                      <th key={ci}>{inline(c, `${k}h${ci}`)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {body.map((r, ri) => (
                    <tr key={ri}>
                      {r.map((c, ci) => (
                        <td key={ci}>{inline(c, `${k}r${ri}c${ci}`)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        if (lines.every((l) => /^\s*-\s+/.test(l))) {
          return (
            <ul key={k}>
              {lines.map((l, li) => (
                <li key={li}>{inline(l.replace(/^\s*-\s+/, ""), `${k}${li}`)}</li>
              ))}
            </ul>
          );
        }
        if (lines.every((l) => /^\s*\d+\.\s+/.test(l))) {
          return (
            <ol key={k}>
              {lines.map((l, li) => (
                <li key={li}>{inline(l.replace(/^\s*\d+\.\s+/, ""), `${k}${li}`)}</li>
              ))}
            </ol>
          );
        }
        return <p key={k}>{inline(lines.join(" "), k)}</p>;
      })}
    </div>
  );
}
