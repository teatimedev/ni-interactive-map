"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import { useMapState } from "@/hooks/useMapState";

const NI_BOUNDS: L.LatLngBoundsExpression = [
  [53.96, -8.18],
  [55.31, -5.43],
];

export default function MapController({ onMapClick }: { onMapClick?: () => void }) {
  const map = useMap();
  const { currentView } = useMapState();
  const prevView = useRef(currentView);

  useEffect(() => {
    if (currentView === "districts" && prevView.current !== "districts") {
      try {
        map.flyToBounds(NI_BOUNDS, { duration: 0.8, padding: [20, 20] });
      } catch {
        // Map not ready yet
      }
    }
    prevView.current = currentView;
  }, [currentView, map]);

  // Click on empty map area closes the panel
  useEffect(() => {
    if (!onMapClick) return;
    const handler = () => onMapClick();
    map.on("click", handler);
    return () => { map.off("click", handler); };
  }, [map, onMapClick]);

  return null;
}
