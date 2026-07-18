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
    // Cache POSITIVES only. A negative can be transient — the GPU process may
    // not be ready at first paint (cold start, backgrounded tab) — so caching a
    // `false` would strand the whole session in LITE even once WebGL is live.
    // Re-detection (DeviceQualityProvider re-runs detect()) then recovers the
    // real capability; scenes reserve their aspect ratio, so a later
    // fallback→canvas swap is CLS-neutral.
    if (gl) {
      cached = true;
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/** Force a value (used by tests / the WebGL-fallback E2E scenario). */
export function __setWebGLForTesting(value: boolean | null): void {
  cached = value;
}
