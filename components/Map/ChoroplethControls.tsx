"use client";

import { useChoropleth } from "@/hooks/useChoropleth";
import type { ChoroplethMetric } from "@/lib/types";

export default function ChoroplethControls() {
  const { metric, setMetric } = useChoropleth();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    setMetric(val ? (val as ChoroplethMetric) : null);
  }

  return (
    <div style={{
      position: "fixed", top: 80, right: 16, zIndex: 1000,
      background: "rgba(26,26,26,0.92)", border: "1px solid #333", borderRadius: 8,
      padding: "10px 14px", backdropFilter: "blur(8px)",
    }}>
      <label style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 0.8, display: "block", marginBottom: 6 }}>
        Colour by
      </label>
      <select
        value={metric ?? ""}
        onChange={handleChange}
        style={{
          background: "#2a2a2a", color: "#ccc", border: "1px solid #444", borderRadius: 4,
          padding: "5px 8px", fontSize: 12, fontFamily: "inherit", width: 180, cursor: "pointer",
        }}
      >
        <option value="">Default</option>
        <option value="population_density">Population Density</option>
        <option value="deprivation">Deprivation Rank</option>
        <option value="median_income">Median Income</option>
        <option value="house_price">House Prices</option>
        <option value="crime_rate">Crime Rate</option>
        <option value="degree_pct">% Degree-Educated</option>
        <option value="no_car_pct">% No Car</option>
        <option value="catholic_pct">% Catholic</option>
        <option value="protestant_pct">% Protestant</option>
      </select>
    </div>
  );
}
