"use client";

import { GeoJSON } from "react-leaflet";
import type { Layer, LeafletMouseEvent, PathOptions } from "leaflet";
import type { Feature } from "geojson";
import { useRouter } from "next/navigation";
import { useMapState } from "@/hooks/useMapState";
import { useChoropleth } from "@/hooks/useChoropleth";
import { getChoroplethColor, CHOROPLETH_CONFIGS } from "@/lib/colors";

const DEFAULT_STYLE: PathOptions = {
  color: "#555",
  weight: 1,
  fillColor: "#383838",
  fillOpacity: 0.5,
};

const HOVER_STYLE: PathOptions = {
  color: "#999",
  weight: 2,
  fillColor: "#4a4a4a",
  fillOpacity: 0.65,
};

export default function WardLayer() {
  const { currentView, selectedDistrict, wardCache, selectWard, setView } =
    useMapState();
  const { metric } = useChoropleth();
  const router = useRouter();

  // Only render when drilling into a district and ward data is available
  if (currentView !== "district-detail" && currentView !== "ward-detail") {
    return null;
  }
  if (!selectedDistrict) return null;

  const cached = wardCache.get(selectedDistrict);
  if (!cached) return null;

  const { geoJSON, wards } = cached;

  function getWardValue(feature: Feature): number | null {
    if (!metric) return null;
    const config = CHOROPLETH_CONFIGS[metric];
    if (!config.wardKey) return null;

    const name = feature.properties?.name as string | undefined;
    if (!name) return null;

    const ward = wards.find((w) => w.name === name);
    if (!ward) return null;

    const val = config.wardKey(ward);
    return val ?? null;
  }

  function getStyle(feature?: Feature): PathOptions {
    if (!feature || !metric) return DEFAULT_STYLE;

    const config = CHOROPLETH_CONFIGS[metric];
    if (!config.wardKey) return DEFAULT_STYLE;

    const val = getWardValue(feature);
    if (val === null) return DEFAULT_STYLE;

    const wardMin = config.wardMin ?? config.min;
    const wardMax = config.wardMax ?? config.max;

    return {
      color: "#555",
      weight: 1,
      fillColor: getChoroplethColor(val, config.color, wardMin, wardMax),
      fillOpacity: 0.65,
    };
  }

  function getHoverStyle(feature?: Feature): PathOptions {
    if (!feature || !metric) return HOVER_STYLE;

    const config = CHOROPLETH_CONFIGS[metric];
    if (!config.wardKey) return HOVER_STYLE;

    const val = getWardValue(feature);
    if (val === null) return HOVER_STYLE;

    const wardMin = config.wardMin ?? config.min;
    const wardMax = config.wardMax ?? config.max;

    return {
      color: "#999",
      weight: 2,
      fillColor: getChoroplethColor(val, config.color, wardMin, wardMax),
      fillOpacity: 0.85,
    };
  }

  function getTooltipContent(feature: Feature): string {
    const name = feature.properties?.name as string | undefined;
    if (!name) return "";
    if (!metric) return name;

    const config = CHOROPLETH_CONFIGS[metric];
    if (!config.wardKey) return name;

    const val = getWardValue(feature);
    if (val === null) return name;

    const formatted =
      metric === "population_density"
        ? val.toLocaleString()
        : `${val.toFixed(1)}%`;

    return `${name}<br/><span style="color:#aaa">${config.label}: ${formatted}</span>`;
  }

  function onEachFeature(feature: Feature, layer: Layer) {
    const path = layer as L.Path;

    const tooltipContent = getTooltipContent(feature);
    if (tooltipContent) {
      (layer as L.Layer).bindTooltip(tooltipContent, {
        sticky: true,
        direction: "top",
        offset: [0, -10],
        className: "map-tooltip",
      });
    }

    path.on("mouseover", (_e: LeafletMouseEvent) => {
      path.setStyle(getHoverStyle(feature));
      path.bringToFront();
    });

    path.on("mouseout", () => {
      path.setStyle(getStyle(feature));
    });

    path.on("click", (_e: LeafletMouseEvent) => {
      const name = feature.properties?.name as string | undefined;
      if (!name) return;

      const ward = wards.find((w) => w.name === name);
      if (!ward) return;

      router.push(`/ward/${selectedDistrict}/${ward.slug}`);
    });
  }

  return (
    <GeoJSON
      key={`wards-${selectedDistrict}-${metric || "default"}`}
      data={geoJSON}
      style={getStyle}
      onEachFeature={onEachFeature}
    />
  );
}
