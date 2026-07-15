"use client";

import * as React from "react";
import Lenis from "lenis";
import { registerGsap, ScrollTrigger } from "@/lib/animation/gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface SmoothScrollContextValue {
  lenis: Lenis | null;
  scrollTo: (target: string | number | HTMLElement, opts?: { offset?: number }) => void;
}

const SmoothScrollContext = React.createContext<SmoothScrollContextValue>({
  lenis: null,
  scrollTo: () => {},
});

/**
 * Lenis smooth scroll, correctly wired to GSAP ScrollTrigger.
 *
 * - Disabled entirely under prefers-reduced-motion (native scroll, no hijack).
 * - Driven by the GSAP ticker so ScrollTrigger and Lenis never desync.
 * - Cleans up fully on unmount.
 * - Keyboard scrolling and anchor links keep working (Lenis proxies them).
 */
export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const reducedMotion = useReducedMotion();
  const lenisRef = React.useRef<Lenis | null>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    // Respect reduced motion: no smooth scroll at all.
    if (reducedMotion) return;

    const gsap = registerGsap();
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
    });
    lenisRef.current = lenis;
    setReady(true);

    lenis.on("scroll", ScrollTrigger.update);

    const onTick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(onTick);
      lenis.destroy();
      lenisRef.current = null;
      setReady(false);
    };
  }, [reducedMotion]);

  const scrollTo = React.useCallback<SmoothScrollContextValue["scrollTo"]>((target, opts) => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, { offset: opts?.offset ?? 0 });
      return;
    }
    // Reduced-motion / not-ready fallback: native, instant, accessible.
    if (typeof target === "string") {
      document.querySelector(target)?.scrollIntoView({ behavior: "auto" });
    } else if (target instanceof HTMLElement) {
      target.scrollIntoView({ behavior: "auto" });
    } else if (typeof target === "number") {
      window.scrollTo(0, target);
    }
  }, []);

  const value = React.useMemo(
    () => ({ lenis: ready ? lenisRef.current : null, scrollTo }),
    [ready, scrollTo],
  );

  return <SmoothScrollContext.Provider value={value}>{children}</SmoothScrollContext.Provider>;
}

export function useSmoothScroll(): SmoothScrollContextValue {
  return React.useContext(SmoothScrollContext);
}
