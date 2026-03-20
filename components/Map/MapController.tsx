"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import { useMapState } from "@/hooks/useMapState";

const NI_BOUNDS: L.LatLngBoundsExpression = [
  [53.96, -8.18],
  [55.31, -5.43],
];

export default function MapController() {
  const map = useMap();
  const { currentView } = useMapState();
  const prevView = useRef(currentView);

  useEffect(() => {
    // Only fly back to NI bounds when transitioning TO districts view,
    // not on initial mount (map already starts centered on NI)
    if (currentView === "districts" && prevView.current !== "districts") {
      try {
        map.flyToBounds(NI_BOUNDS, { duration: 0.8, padding: [20, 20] });
      } catch {
        // Map not ready yet, ignore
      }
    }
    prevView.current = currentView;
  }, [currentView, map]);

  return null;
}
