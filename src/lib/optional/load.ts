"use client";

import * as React from "react";

/**
 * Loads an OPTIONAL npm package at runtime, client-side only, WITHOUT letting
 * the bundler hard-require it. This is how ADAPTER-ONLY integrations (Rive,
 * Spline, ShaderGradient) work: the package is not installed by default, so the
 * import must be non-analyzable and failure-tolerant. If the package is absent,
 * the promise resolves to null and the component renders its fallback.
 *
 * The magic comments keep both webpack and Turbopack from trying to resolve the
 * specifier at build time.
 */
export async function loadOptional<T = unknown>(name: string): Promise<T | null> {
  if (typeof window === "undefined") return null;
  try {
    const mod = await import(
      /* webpackIgnore: true */
      /* turbopackIgnore: true */
      /* @vite-ignore */
      name
    );
    return (mod?.default ?? mod) as T;
  } catch {
    return null;
  }
}

type OptionalState<T> = { status: "loading" | "ready" | "missing"; mod: T | null };

/** React hook wrapper around loadOptional. */
export function useOptionalModule<T = unknown>(name: string): OptionalState<T> {
  const [state, setState] = React.useState<OptionalState<T>>({ status: "loading", mod: null });

  React.useEffect(() => {
    let active = true;
    loadOptional<T>(name).then((mod) => {
      if (!active) return;
      setState(mod ? { status: "ready", mod } : { status: "missing", mod: null });
    });
    return () => {
      active = false;
    };
  }, [name]);

  return state;
}
