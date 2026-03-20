"use client";

import { useEffect, useRef } from "react";
import { GeoJSON, useMap } from "react-leaflet";
import type { Layer, LeafletMouseEvent, PathOptions } from "leaflet";
import type { Feature, GeoJsonObject } from "geojson";
import { useMapState } from "@/hooks/useMapState";
import { useChoropleth } from "@/hooks/useChoropleth";
import { useComparison } from "@/hooks/useComparison";
import { getChoroplethColor, CHOROPLETH_CONFIGS } from "@/lib/colors";
import { slugify } from "@/lib/utils";
import districts from "@/data/districts";
import geoDistrictsData from "@/data/geo-districts.json";

const geoDistricts = geoDistrictsData as GeoJsonObject;

const DEFAULT_STYLE: PathOptions = {
  color: "#555",
  weight: 1.5,
  fillColor: "#333",
  fillOpacity: 0.6,
};

const HOVER_STYLE: PathOptions = {
  color: "#888",
  weight: 2.5,
  fillColor: "#444",
  fillOpacity: 0.7,
};

export default function DistrictLayer() {
  const { currentView, selectDistrict, setView, loadWardData } = useMapState();
  const { metric } = useChoropleth();
  const { isComparing, addSelection } = useComparison();
  const map = useMap();
  const layerRef = useRef<L.GeoJSON | null>(null);

  // Only render when on district view
  if (currentView !== "districts") return null;

  function getStyle(feature?: Feature): PathOptions {
    if (!metric || !feature?.properties?.name) return DEFAULT_STYLE;

    const config = CHOROPLETH_CONFIGS[metric];
    const districtName = feature.properties.name as string;
    const district = districts.find(
      (d) => d.name === districtName || slugify(d.name) === slugify(districtName)
    );

    if (!district) return DEFAULT_STYLE;

    const val = config.key(district);
    const fillColor = getChoroplethColor(
      val ?? null,
      config.color,
      config.min,
      config.max
    );

    return {
      color: "#555",
      weight: 1.5,
      fillColor,
      fillOpacity: 0.85,
    };
  }

  function getHoverStyle(feature?: Feature): PathOptions {
    if (!metric || !feature?.properties?.name) return HOVER_STYLE;

    const config = CHOROPLETH_CONFIGS[metric];
    const districtName = feature.properties.name as string;
    const district = districts.find(
      (d) => d.name === districtName || slugify(d.name) === slugify(districtName)
    );

    if (!district) return HOVER_STYLE;

    const val = config.key(district);
    const fillColor = getChoroplethColor(
      val ?? null,
      config.color,
      config.min,
      config.max
    );

    return {
      color: "#aaa",
      weight: 2.5,
      fillColor,
      fillOpacity: 0.9,
    };
  }

  function getTooltipContent(feature: Feature): string {
    const name = feature.properties?.name as string | undefined;
    if (!name) return "";
    if (!metric) return name;

    const config = CHOROPLETH_CONFIGS[metric];
    const district = districts.find(
      (d) => d.name === name || slugify(d.name) === slugify(name)
    );
    if (!district) return name;

    const val = config.key(district);
    if (val == null) return name;

    const formatted =
      metric === "median_income" || metric === "house_price"
        ? `£${val.toLocaleString()}`
        : metric === "crime_rate"
        ? val.toFixed(1)
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

    path.on("mouseover", (e: LeafletMouseEvent) => {
      path.setStyle(getHoverStyle(feature));
      path.bringToFront();
    });

    path.on("mouseout", () => {
      path.setStyle(getStyle(feature));
    });

    path.on("click", (e: LeafletMouseEvent) => {
      const name = feature.properties?.name as string | undefined;
      if (!name) return;

      const slug = slugify(name);

      if (isComparing) {
        addSelection(slug);
        return;
      }

      const bounds = (layer as L.GeoJSON).getBounds
        ? (layer as unknown as L.Polygon).getBounds()
        : null;

      // Direct state update — no router.push to avoid remounting the map
      selectDistrict(slug);
      setView("district-detail");
      loadWardData(slug);
      window.history.replaceState(null, "", `/district/${slug}`);

      if (bounds) {
        map.flyToBounds(bounds, { padding: [40, 40], duration: 0.8 });
      }
    });
  }

  return (
    <GeoJSON
      key={`districts-${metric || "default"}`}
      data={geoDistricts}
      style={getStyle}
      onEachFeature={onEachFeature}
      ref={layerRef}
    />
  );
}
