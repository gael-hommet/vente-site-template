"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Central GSAP setup. ScrollTrigger is the ONLY GSAP plugin we depend on (it is
 * free). Register once, client-side. Premium plugins (SplitText, etc.) are NOT
 * used — see SplitTextFallback for a dependency-free alternative.
 */
let registered = false;

export function registerGsap(): typeof gsap {
  if (typeof window !== "undefined" && !registered) {
    gsap.registerPlugin(ScrollTrigger);
    registered = true;
  }
  return gsap;
}

export { gsap, ScrollTrigger };
