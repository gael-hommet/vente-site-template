import { MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface MapFallbackProps {
  /** Human-readable address or place name. */
  label: string;
  /** Coordinates, shown and used to build a directions link. */
  lat?: number;
  lng?: number;
  /** Explicit directions URL; if omitted one is derived from coordinates/label. */
  directionsUrl?: string;
  className?: string;
}

/**
 * The always-available map fallback: never hides the address. Shown when WebGL
 * is missing, MapLibre fails to load, or on LITE tier. Provides a real
 * directions link so the conversion path (get directions) is never blocked.
 */
export function MapFallback({ label, lat, lng, directionsUrl, className }: MapFallbackProps) {
  const href =
    directionsUrl ??
    (lat != null && lng != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(label)}`);

  return (
    <div
      className={cn(
        "border-border bg-surface-2 flex h-full w-full flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border p-6 text-center",
        className,
      )}
    >
      <MapPin className="text-brand size-6" aria-hidden />
      <p className="text-foreground font-medium">{label}</p>
      {lat != null && lng != null && (
        <p className="text-muted text-xs tabular-nums">
          {lat.toFixed(5)}, {lng.toFixed(5)}
        </p>
      )}
      <Button asChild variant="brand" size="sm">
        <a href={href} target="_blank" rel="noopener noreferrer">
          <Navigation className="size-4" /> Itinéraire
        </a>
      </Button>
    </div>
  );
}
