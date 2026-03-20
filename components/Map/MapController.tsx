"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { useMapState } from "@/hooks/useMapState";

const NI_BOUNDS: [[number, number], [number, number]] = [
  [53.96, -8.18],
  [55.31, -5.43],
];

export default function MapController() {
  const map = useMap();
  const { currentView } = useMapState();

  useEffect(() => {
    if (currentView === "districts") {
      map.flyToBounds(NI_BOUNDS, { duration: 0.8, padding: [20, 20] });
    }
  }, [currentView, map]);

  return null;
}
