"use client";

import * as React from "react";

/**
 * Live token inspector: reads the CSS custom properties as the browser
 * resolves them (preset + theme included) and computes real WCAG contrast
 * ratios for the foreground/background pairs the design system actually uses.
 */

const PAIRS: { fg: string; bg: string; usage: string; large?: boolean }[] = [
  { fg: "--foreground", bg: "--background", usage: "Texte courant / fond de page" },
  { fg: "--foreground", bg: "--surface", usage: "Texte / carte" },
  { fg: "--muted", bg: "--background", usage: "Texte secondaire / fond" },
  { fg: "--muted", bg: "--surface-2", usage: "Texte secondaire / surface 2" },
  { fg: "--brand-foreground", bg: "--brand", usage: "Texte des boutons brand" },
  { fg: "--brand-strong", bg: "--surface", usage: "Accent en texte / carte" },
  { fg: "--danger", bg: "--surface", usage: "Messages d'erreur" },
  { fg: "--success", bg: "--surface", usage: "Messages de succès" },
  { fg: "--warning", bg: "--surface", usage: "Avertissements" },
];

/** Resolve any CSS color to sRGB via a 2D canvas (handles oklch). */
function resolveColor(cssValue: string): [number, number, number] | null {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.fillStyle = "#000";
  ctx.fillStyle = cssValue;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}

function luminance([r, g, b]: [number, number, number]): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function ratio(fg: [number, number, number], bg: [number, number, number]): number {
  const [l1, l2] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
}

interface Row {
  fg: string;
  bg: string;
  usage: string;
  value: number;
  pass: boolean;
}

export function TokensContrast() {
  const [rows, setRows] = React.useState<Row[] | null>(null);

  const measure = React.useCallback(() => {
    const styles = getComputedStyle(document.documentElement);
    const next: Row[] = [];
    for (const pair of PAIRS) {
      const fgRaw = styles.getPropertyValue(pair.fg).trim();
      const bgRaw = styles.getPropertyValue(pair.bg).trim();
      const fg = fgRaw ? resolveColor(fgRaw) : null;
      const bg = bgRaw ? resolveColor(bgRaw) : null;
      if (!fg || !bg) continue;
      const value = ratio(fg, bg);
      next.push({ ...pair, value, pass: value >= 4.5 });
    }
    setRows(next);
  }, []);

  React.useEffect(() => {
    // Defer the first measure a frame so styles are fully applied (and to
    // avoid a synchronous setState inside the effect).
    const raf = requestAnimationFrame(measure);
    // Re-measure when the theme toggles (data-theme flips on <html>).
    const observer = new MutationObserver(measure);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [measure]);

  if (!rows) return <p className="text-muted text-sm">Mesure des contrastes…</p>;

  return (
    <div className="border-border overflow-x-auto rounded-[var(--radius-md)] border">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface-2">
          <tr>
            <th className="px-3 py-2 font-medium">Paire</th>
            <th className="px-3 py-2 font-medium">Usage</th>
            <th className="px-3 py-2 font-medium">Ratio</th>
            <th className="px-3 py-2 font-medium">AA (4.5:1)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.fg}/${row.bg}`} className="border-border border-t">
              <td className="px-3 py-2">
                <span className="inline-flex items-center gap-1.5 font-mono text-xs">
                  <span
                    aria-hidden
                    className="border-border inline-block size-3.5 rounded-full border"
                    style={{ background: `var(${row.fg})` }}
                  />
                  {row.fg} / {row.bg}
                </span>
              </td>
              <td className="text-muted px-3 py-2">{row.usage}</td>
              <td className="px-3 py-2 font-mono tabular-nums">{row.value.toFixed(2)}</td>
              <td className="px-3 py-2">
                {row.pass ? (
                  <span className="text-success font-medium">✓ conforme</span>
                ) : (
                  <span className="text-danger font-medium">✗ insuffisant</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
