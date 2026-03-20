"use client";

import { useChoropleth } from "@/hooks/useChoropleth";
import { useMapState } from "@/hooks/useMapState";
import { CHOROPLETH_CONFIGS } from "@/lib/colors";
import type { ChoroplethMetric } from "@/lib/types";

interface ChoroplethControlsProps {
  panelOpen?: boolean;
  inline?: boolean;
}

// Metrics that have ward-level data
const WARD_METRICS: Set<ChoroplethMetric> = new Set(
  (Object.entries(CHOROPLETH_CONFIGS) as [ChoroplethMetric, (typeof CHOROPLETH_CONFIGS)[ChoroplethMetric]][])
    .filter(([, config]) => config.wardKey !== null)
    .map(([key]) => key)
);

export default function ChoroplethControls({ panelOpen, inline }: ChoroplethControlsProps) {
  const { metric, setMetric } = useChoropleth();
  const { currentView } = useMapState();

  const isDrillView = currentView === "district-detail" || currentView === "ward-detail";
  const noWardData = isDrillView && metric !== null && !WARD_METRICS.has(metric);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    setMetric(val ? (val as ChoroplethMetric) : null);
  }

  if (inline) {
    return (
      <div className="capsule capsule-colour">
        <span className="capsule-colour-label">Shade by</span>
        <select value={metric ?? ""} onChange={handleChange}>
          <option value="">Default</option>
          {isDrillView && (
            <optgroup label="Ward level">
              <option value="population_density">Population Density</option>
              <option value="deprivation">Deprivation Rank</option>
              <option value="degree_pct">% Degree-Educated</option>
              <option value="no_car_pct">% No Car</option>
              <option value="catholic_pct">% Catholic</option>
              <option value="protestant_pct">% Protestant</option>
              <option value="livability">Livability Score</option>
            </optgroup>
          )}
          {isDrillView && (
            <optgroup label="District only">
              <option value="median_income">Median Income</option>
              <option value="house_price">House Prices</option>
              <option value="crime_rate">Crime Rate</option>
            </optgroup>
          )}
          {!isDrillView && (
            <>
              <option value="population_density">Population Density</option>
              <option value="deprivation">Deprivation Rank</option>
              <option value="median_income">Median Income</option>
              <option value="house_price">House Prices</option>
              <option value="crime_rate">Crime Rate</option>
              <option value="degree_pct">% Degree-Educated</option>
              <option value="no_car_pct">% No Car</option>
              <option value="catholic_pct">% Catholic</option>
              <option value="protestant_pct">% Protestant</option>
              <option value="livability">Livability Score</option>
            </>
          )}
        </select>
        {noWardData && (
          <span style={{ fontSize: 11, color: "#e8a838", whiteSpace: "nowrap" }}>
            District only
          </span>
        )}
      </div>
    );
  }

  const positionStyle = panelOpen
    ? { left: 16, top: 100, right: "auto" as const }
    : { right: 16, top: 80, left: "auto" as const };

  return (
    <div className="capsule capsule-colour" style={{
      position: "fixed", zIndex: 1000,
      transition: "left 0.3s, right 0.3s, top 0.3s",
      ...positionStyle,
    }}>
      <span className="capsule-colour-label">Shade by</span>
      <select value={metric ?? ""} onChange={handleChange}>
        <option value="">Default</option>
        {isDrillView && (
          <optgroup label="Ward level">
            <option value="population_density">Population Density</option>
            <option value="deprivation">Deprivation Rank</option>
            <option value="degree_pct">% Degree-Educated</option>
            <option value="no_car_pct">% No Car</option>
            <option value="catholic_pct">% Catholic</option>
            <option value="protestant_pct">% Protestant</option>
            <option value="livability">Livability Score</option>
          </optgroup>
        )}
        {isDrillView && (
          <optgroup label="District only">
            <option value="median_income">Median Income</option>
            <option value="house_price">House Prices</option>
            <option value="crime_rate">Crime Rate</option>
          </optgroup>
        )}
        {!isDrillView && (
          <>
            <option value="population_density">Population Density</option>
            <option value="deprivation">Deprivation Rank</option>
            <option value="median_income">Median Income</option>
            <option value="house_price">House Prices</option>
            <option value="crime_rate">Crime Rate</option>
            <option value="degree_pct">% Degree-Educated</option>
            <option value="no_car_pct">% No Car</option>
            <option value="catholic_pct">% Catholic</option>
            <option value="protestant_pct">% Protestant</option>
            <option value="livability">Livability Score</option>
          </>
        )}
      </select>
      {noWardData && (
        <span style={{ fontSize: 11, color: "#e8a838", whiteSpace: "nowrap" }}>
          District only
        </span>
      )}
    </div>
  );
}
