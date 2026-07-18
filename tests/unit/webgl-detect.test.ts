import { describe, it, expect, beforeEach, vi } from "vitest";
import { detectWebGL, __setWebGLForTesting } from "@/lib/three/webgl";

/**
 * detectWebGL ne met en cache QUE les positifs : un `false` transitoire (GPU pas
 * prêt au premier paint) ne doit pas figer toute la session en LITE.
 */
describe("detectWebGL — cache des positifs seulement", () => {
  beforeEach(() => __setWebGLForTesting(null));

  it("ne met pas en cache un négatif : re-détecte quand le contexte devient dispo", () => {
    const spy = vi.spyOn(HTMLCanvasElement.prototype, "getContext");
    spy.mockReturnValue(null); // 1er probe : pas de contexte
    expect(detectWebGL()).toBe(false);
    // Le contexte devient disponible → négatif non caché ⇒ nouvelle détection.
    spy.mockReturnValue({} as unknown as RenderingContext);
    expect(detectWebGL()).toBe(true);
    spy.mockRestore();
  });

  it("met en cache un positif : reste vrai même si le contexte est ensuite perdu", () => {
    const spy = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue({} as unknown as RenderingContext);
    expect(detectWebGL()).toBe(true);
    spy.mockReturnValue(null); // contexte perdu ensuite
    expect(detectWebGL()).toBe(true); // toujours vrai (caché)
    spy.mockRestore();
  });
});
