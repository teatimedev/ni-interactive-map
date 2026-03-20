"use client";

import { GeoJSON } from "react-leaflet";
import type { Layer, LeafletMouseEvent, PathOptions } from "leaflet";
import type { Feature } from "geojson";
import { useMapState } from "@/hooks/useMapState";
import { useChoropleth } from "@/hooks/useChoropleth";
import { choroplethColorFromT, computeRankMap, CHOROPLETH_CONFIGS } from "@/lib/colors";

const DEFAULT_STYLE: PathOptions = {
  color: "#444",
  weight: 0.5,
  fillColor: "transparent",
  fillOpacity: 0,
};

const HOVER_STYLE: PathOptions = {
  color: "#aaa",
  weight: 1.5,
  fillColor: "#ffffff",
  fillOpacity: 0.08,
};

export default function WardLayer() {
  const { currentView, selectedDistrict, wardCache, selectWard, setView } =
    useMapState();
  const { metric } = useChoropleth();

  // Only render when drilling into a district and ward data is available
  if (currentView !== "district-detail" && currentView !== "ward-detail") {
    return null;
  }
  if (!selectedDistrict) return null;

  const cached = wardCache.get(selectedDistrict);
  if (!cached) return null;

  const { geoJSON, wards } = cached;

  // Precompute rank map for all wards in this district
  const wardRankMap = (() => {
    if (!metric) return null;
    const config = CHOROPLETH_CONFIGS[metric];
    if (!config.wardKey) return null;
    const values = wards.map((w) => config.wardKey!(w) ?? null);
    return computeRankMap(values);
  })();

  function getWardT(feature?: Feature): number | null {
    if (!metric || !feature?.properties?.name || !wardRankMap) return null;
    const config = CHOROPLETH_CONFIGS[metric];
    if (!config.wardKey) return null;
    const name = feature.properties.name as string;
    const ward = wards.find((w) => w.name === name);
    if (!ward) return null;
    const val = config.wardKey(ward);
    if (val == null) return null;
    return wardRankMap.get(val) ?? null;
  }

  function getStyle(feature?: Feature): PathOptions {
    const t = getWardT(feature);
    if (t === null || !metric) return DEFAULT_STYLE;
    return {
      color: "#555",
      weight: 1,
      fillColor: choroplethColorFromT(t, CHOROPLETH_CONFIGS[metric].color),
      fillOpacity: 0.85,
    };
  }

  function getHoverStyle(feature?: Feature): PathOptions {
    const t = getWardT(feature);
    if (t === null || !metric) return HOVER_STYLE;
    const tHover = Math.min(1, t + 0.1);
    return {
      color: "#999",
      weight: 2,
      fillColor: choroplethColorFromT(tHover, CHOROPLETH_CONFIGS[metric].color),
      fillOpacity: 0.95,
    };
  }

  function getTooltipContent(feature: Feature): string {
    const name = feature.properties?.name as string | undefined;
    if (!name) return "";
    if (!metric) return name;

    const config = CHOROPLETH_CONFIGS[metric];
    if (!config.wardKey) return name;

    const ward = wards.find((w) => w.name === name);
    if (!ward) return name;
    const val = config.wardKey(ward);
    if (val == null) return name;

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

      selectWard(ward.slug);
      setView("ward-detail");
      window.history.replaceState(null, "", `/ward/${selectedDistrict}/${ward.slug}`);
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
