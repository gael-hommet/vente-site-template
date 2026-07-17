/**
 * Pure color math for the Design Language: oklch() → sRGB → WCAG contrast.
 * Used by the preset unit tests (AA by construction) and available to future
 * tooling (ACE Score). No dependency; matrices from the OKLab reference.
 */

export type Rgb = [number, number, number]; // gamma-encoded sRGB, 0..1

export function parseOklch(value: string): { l: number; c: number; h: number; alpha: number } {
  const m = value.match(/^oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)$/);
  if (!m) throw new Error(`not an oklch() color: "${value}"`);
  const num = (s: string, scale = 1) =>
    s.endsWith("%") ? Number.parseFloat(s) / 100 : Number.parseFloat(s) / scale;
  return {
    l: num(m[1]),
    c: Number.parseFloat(m[2]),
    h: Number.parseFloat(m[3]),
    alpha: m[4] ? num(m[4]) : 1,
  };
}

export function oklchToSrgb(value: string): Rgb {
  const { l: L, c: C, h } = parseOklch(value);
  const hr = (h * Math.PI) / 180;
  const a = C * Math.cos(hr);
  const b = C * Math.sin(hr);

  const l_ = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;

  const lin: Rgb = [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];

  const encode = (c: number) => {
    const clamped = Math.min(1, Math.max(0, c));
    return clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
  };
  return [encode(lin[0]), encode(lin[1]), encode(lin[2])];
}

export function relativeLuminance([r, g, b]: Rgb): number {
  const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG contrast ratio between two colors (order-independent). */
export function contrastRatio(fg: Rgb, bg: Rgb): number {
  const [hi, lo] = [relativeLuminance(fg), relativeLuminance(bg)].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
}

/** Contrast between two oklch() strings. */
export function contrastOklch(fg: string, bg: string): number {
  return contrastRatio(oklchToSrgb(fg), oklchToSrgb(bg));
}

/** Composite `fg` at `alpha` over `bg` the way browsers do (gamma space). */
export function compositeOver(fg: Rgb, alpha: number, bg: Rgb): Rgb {
  return [0, 1, 2].map((i) => alpha * fg[i] + (1 - alpha) * bg[i]) as unknown as Rgb;
}
