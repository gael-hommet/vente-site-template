"use client";

import * as React from "react";
import type { Map as MLMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { detectWebGL } from "@/lib/three/webgl";
import { MapFallback, type MapFallbackProps } from "./MapFallback";
import { cn } from "@/lib/utils";

const DEFAULT_STYLE =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL || "https://demotiles.maplibre.org/style.json";

const MapContext = React.createContext<MLMap | null>(null);
/** Access the live MapLibre instance from child components. */
export function useMapInstance(): MLMap | null {
  return React.useContext(MapContext);
}

export interface BusinessMapProps {
  center: [number, number]; // [lng, lat]
  zoom?: number;
  styleUrl?: string;
  interactive?: boolean;
  className?: string;
  /** Fallback content (address + directions) if WebGL/MapLibre is unavailable. */
  fallback: MapFallbackProps;
  children?: React.ReactNode;
}

/**
 * BusinessMap — MapLibre GL, loaded dynamically (heavy, client-only), keyless by
 * default (open demo style; override via NEXT_PUBLIC_MAP_STYLE_URL). No API key
 * is ever committed. Falls back to <MapFallback> (which always exposes the
 * address + a directions link) when WebGL is missing or the map fails to load.
 */
export function BusinessMap({
  center,
  zoom = 14,
  styleUrl,
  interactive = true,
  className,
  fallback,
  children,
}: BusinessMapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [map, setMap] = React.useState<MLMap | null>(null);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    let instance: MLMap | null = null;
    let cancelled = false;

    (async () => {
      if (!detectWebGL()) {
        if (!cancelled) setFailed(true);
        return;
      }
      try {
        const maplibregl = (await import("maplibre-gl")).default;
        if (cancelled || !containerRef.current) return;
        instance = new maplibregl.Map({
          container: containerRef.current,
          style: styleUrl || DEFAULT_STYLE,
          center,
          zoom,
          interactive,
          attributionControl: { compact: true },
        });
        instance.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
        instance.on("load", () => {
          if (!cancelled) setMap(instance);
        });
        instance.on("error", () => {
          if (!cancelled) setFailed(true);
        });
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      instance?.remove();
    };
    // Re-init only if the map identity inputs change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styleUrl]);

  if (failed) {
    return <MapFallback {...fallback} className={className} />;
  }

  return (
    <div className={cn("relative overflow-hidden rounded-[var(--radius-lg)]", className)}>
      <div
        ref={containerRef}
        className="absolute inset-0"
        aria-label={fallback.label}
        role="application"
      />
      <MapContext.Provider value={map}>{children}</MapContext.Provider>
    </div>
  );
}
