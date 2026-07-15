"use client";

import * as React from "react";
import type { Marker } from "maplibre-gl";
import { useMapInstance } from "./BusinessMap";

export interface LocationMarkerProps {
  position: [number, number]; // [lng, lat]
  color?: string;
  title?: string;
}

/** Adds a MapLibre marker to the parent <BusinessMap>. */
export function LocationMarker({ position, color = "#6d5cff", title }: LocationMarkerProps) {
  const map = useMapInstance();

  React.useEffect(() => {
    if (!map) return;
    let marker: Marker | null = null;
    let cancelled = false;
    (async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      if (cancelled) return;
      marker = new maplibregl.Marker({ color }).setLngLat(position);
      if (title) marker.setPopup(new maplibregl.Popup({ offset: 24 }).setText(title));
      marker.addTo(map);
    })();
    return () => {
      cancelled = true;
      marker?.remove();
    };
  }, [map, position, color, title]);

  return null;
}
