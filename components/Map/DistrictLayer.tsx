"use client";

import { useEffect, useRef } from "react";
import { GeoJSON, useMap } from "react-leaflet";
import type { Layer, LeafletMouseEvent, PathOptions } from "leaflet";
import type { Feature, GeoJsonObject } from "geojson";
import { useMapState } from "@/hooks/useMapState";
import { useChoropleth } from "@/hooks/useChoropleth";
import { useComparison } from "@/hooks/useComparison";
import { choroplethColorFromT, computeRankMap, CHOROPLETH_CONFIGS } from "@/lib/colors";
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
  const { currentView, selectDistrict, selectWard, setView, loadWardData } = useMapState();
  const { metric } = useChoropleth();
  const { isComparing, addSelection } = useComparison();
  const map = useMap();
  const layerRef = useRef<L.GeoJSON | null>(null);

  // Always render — districts stay visible behind wards so users can click another district
  const isDrillView = currentView !== "districts";

  // Precompute rank map for the active metric — guarantees full color spread
  const rankMap = (() => {
    if (!metric) return null;
    const config = CHOROPLETH_CONFIGS[metric];
    const values = districts.map((d) => config.key(d) ?? null);
    return computeRankMap(values);
  })();

  function getDistrictT(feature?: Feature): number | null {
    if (!metric || !feature?.properties?.name || !rankMap) return null;
    const config = CHOROPLETH_CONFIGS[metric];
    const districtName = feature.properties.name as string;
    const district = districts.find(
      (d) => d.name === districtName || slugify(d.name) === slugify(districtName)
    );
    if (!district) return null;
    const val = config.key(district);
    if (val == null) return null;
    return rankMap.get(val) ?? null;
  }

  function getStyle(feature?: Feature): PathOptions {
    // When drilled into a district, show muted boundaries so wards are prominent
    if (isDrillView) {
      return { color: "#333", weight: 0.5, fillColor: "transparent", fillOpacity: 0 };
    }
    const t = getDistrictT(feature);
    if (t === null || !metric) return DEFAULT_STYLE;
    return {
      color: "#555",
      weight: 1.5,
      fillColor: choroplethColorFromT(t, CHOROPLETH_CONFIGS[metric].color),
      fillOpacity: 0.85,
    };
  }

  function getHoverStyle(feature?: Feature): PathOptions {
    // Keep transparent when drilled into a district so wards stay visible
    if (isDrillView) {
      return { color: "#666", weight: 1.5, fillColor: "transparent", fillOpacity: 0 };
    }
    const t = getDistrictT(feature);
    if (t === null || !metric) return HOVER_STYLE;
    // Brighten on hover by adding 0.1 to t
    const tHover = Math.min(1, t + 0.1);
    return {
      color: "#aaa",
      weight: 2.5,
      fillColor: choroplethColorFromT(tHover, CHOROPLETH_CONFIGS[metric].color),
      fillOpacity: 0.95,
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
        : metric === "population_density"
        ? val.toLocaleString()
        : metric === "crime_rate"
        ? val.toFixed(1)
        : `${val.toFixed(1)}%`;

    return `${name}<br/><span style="color:#aaa">${config.label}: ${formatted}</span>`;
  }

  function onEachFeature(feature: Feature, layer: Layer) {
    const path = layer as L.Path;

    // In drill view, don't attach any event handlers so ward layer receives events
    if (isDrillView) return;

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
      selectWard(null);
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
      key={`districts-${metric || "default"}-${isDrillView ? "drill" : "main"}`}
      data={geoDistricts}
      style={getStyle}
      onEachFeature={onEachFeature}
      ref={layerRef}
    />
  );
}
