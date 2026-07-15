"use client";

import * as React from "react";
import { useMapInstance } from "./BusinessMap";

export interface RouteRevealProps {
  /** Ordered [lng, lat] coordinates of the route to draw. */
  coordinates: [number, number][];
  color?: string;
  width?: number;
}

/**
 * Draws a route line on the parent <BusinessMap> as a GeoJSON source/layer.
 * Useful for "how to reach us" reveals. Coordinates come from the brief — this
 * does not compute or invent a route.
 */
export function RouteReveal({ coordinates, color = "#6d5cff", width = 4 }: RouteRevealProps) {
  const map = useMapInstance();
  const id = React.useId();
  const sourceId = `route-${id}`;
  const layerId = `route-line-${id}`;

  React.useEffect(() => {
    if (!map || coordinates.length < 2) return;

    const add = () => {
      if (map.getSource(sourceId)) return;
      map.addSource(sourceId, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates },
        },
      });
      map.addLayer({
        id: layerId,
        type: "line",
        source: sourceId,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": color, "line-width": width, "line-opacity": 0.9 },
      });
    };

    if (map.isStyleLoaded()) add();
    else map.once("load", add);

    return () => {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };
  }, [map, coordinates, color, width, sourceId, layerId]);

  return null;
}
