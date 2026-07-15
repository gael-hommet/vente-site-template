/**
 * WebGL capability detection. Runs client-side only; returns a conservative
 * `false` on the server so nothing WebGL renders during SSR.
 */

let cached: boolean | null = null;

export function detectWebGL(): boolean {
  if (typeof window === "undefined") return false;
  if (cached !== null) return cached;

  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
    cached = Boolean(gl);
  } catch {
    cached = false;
  }
  return cached;
}

/** Force a value (used by tests / the WebGL-fallback E2E scenario). */
export function __setWebGLForTesting(value: boolean | null): void {
  cached = value;
}
