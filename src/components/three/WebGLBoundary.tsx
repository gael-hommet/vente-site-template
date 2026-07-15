"use client";

import * as React from "react";
import { detectWebGL } from "@/lib/three/webgl";
import { WebGLFallback, type WebGLFallbackProps } from "./WebGLFallback";

interface ErrorBoundaryState {
  hasError: boolean;
}

/** Catches runtime errors thrown inside a WebGL scene and shows the fallback. */
class SceneErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[WebGLBoundary] scene error, showing fallback:", error);
    }
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

export interface WebGLBoundaryProps {
  fallback?: WebGLFallbackProps;
  /** If true, skip WebGL entirely and always show the fallback (e.g. LITE tier). */
  forceFallback?: boolean;
  children: React.ReactNode;
}

/**
 * The single gate every WebGL scene passes through:
 * 1. Renders the fallback during SSR and until mounted (no SSR WebGL).
 * 2. Renders the fallback if WebGL is unavailable or `forceFallback` is set.
 * 3. Otherwise renders the scene wrapped in an error boundary.
 */
export function WebGLBoundary({ fallback, forceFallback = false, children }: WebGLBoundaryProps) {
  // Hydration-safe client detection without a setState-in-effect: false on the
  // server and first render, true once mounted on the client.
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const fallbackEl = <WebGLFallback alt={fallback?.alt ?? "Aperçu visuel"} {...fallback} />;

  if (!mounted || forceFallback || !detectWebGL()) {
    return fallbackEl;
  }

  return <SceneErrorBoundary fallback={fallbackEl}>{children}</SceneErrorBoundary>;
}
