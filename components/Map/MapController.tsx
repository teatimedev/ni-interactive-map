"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { useMapState } from "@/hooks/useMapState";
import geoDistrictsData from "@/data/geo-districts.json";
import { slugify } from "@/lib/utils";
import type { Feature, FeatureCollection } from "geojson";

const geoDistricts = geoDistrictsData as FeatureCollection;

const NI_BOUNDS: L.LatLngBoundsExpression = [
  [53.96, -8.18],
  [55.31, -5.43],
];

export default function MapController({ onMapClick }: { onMapClick?: () => void }) {
  const map = useMap();
  const { currentView, pendingFlyTo, clearPendingFlyTo, isPinMode, setPendingPin } = useMapState();
  const prevView = useRef(currentView);

  // Zoom out when returning to overview
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

  // Fly to district when requested via pendingFlyTo
  useEffect(() => {
    if (!pendingFlyTo) return;

    const feature = geoDistricts.features.find(
      (f: Feature) =>
        f.properties?.name &&
        slugify(f.properties.name as string) === pendingFlyTo
    );

    if (feature) {
      try {
        const layer = L.geoJSON(feature as GeoJSON.Feature);
        map.flyToBounds(layer.getBounds(), { padding: [40, 40], duration: 0.8 });
      } catch {
        // Map not ready
      }
    }

    clearPendingFlyTo();
  }, [pendingFlyTo, map, clearPendingFlyTo]);

  // Click on empty map area — either drop pin or close panel
  useEffect(() => {
    const handler = (e: L.LeafletMouseEvent) => {
      if (isPinMode) {
        setPendingPin({ lat: e.latlng.lat, lng: e.latlng.lng });
      } else if (onMapClick) {
        onMapClick();
      }
    };
    map.on("click", handler);
    return () => { map.off("click", handler); };
  }, [map, onMapClick, isPinMode, setPendingPin]);

  return null;
}
