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
    <div className="fixed top-20 right-4 z-[1000] bg-[rgba(26,26,26,0.92)] border border-[#333] rounded-lg px-3.5 py-2.5 backdrop-blur-sm max-sm:top-auto max-sm:bottom-20 max-sm:right-2 max-sm:left-2">
      <label className="text-[11px] text-[#888] uppercase tracking-wider block mb-1.5">
        Colour by
      </label>
      <select
        value={metric ?? ""}
        onChange={handleChange}
        className="bg-[#2a2a2a] text-[#ccc] border border-[#444] rounded px-2 py-1.5 text-xs w-[180px] cursor-pointer min-h-[44px] max-sm:w-full"
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
