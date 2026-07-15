import { create } from "zustand";

/**
 * Bridges DOM-driven scroll progress (Lenis + GSAP ScrollTrigger, outside the
 * canvas) into R3F components (inside the canvas). A PinnedSequence or
 * useScrubProgress writes `progress`; ScrollCamera and scene objects read it.
 *
 * Keyed by scene id so multiple scenes can coexist.
 */
interface SceneState {
  progress: Record<string, number>;
  setProgress: (id: string, value: number) => void;
  getProgress: (id: string) => number;
}

export const useSceneStore = create<SceneState>((set, get) => ({
  progress: {},
  setProgress: (id, value) =>
    set((state) => ({ progress: { ...state.progress, [id]: value } })),
  getProgress: (id) => get().progress[id] ?? 0,
}));

/** Non-reactive read for use inside useFrame (avoids re-render churn). */
export function readSceneProgress(id: string): number {
  return useSceneStore.getState().progress[id] ?? 0;
}
