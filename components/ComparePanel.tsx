"use client";

import { useComparison } from "@/hooks/useComparison";
import type { District } from "@/lib/types";

interface ComparePanelProps {
  district1: District | null;
  district2: District | null;
}

// Formatters
function fmt(n: number | null): string {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString();
}

function fmtMoney(n: number | null): string {
  if (n === null || n === undefined) return "—";
  return "£" + n.toLocaleString();
}

function fmtPct(n: number | null): string {
  if (n === null || n === undefined) return "—";
  return n.toFixed(1) + "%";
}

function compRow(
  label: string,
  v1: number | null,
  v2: number | null,
  higherBetter?: boolean,
  formatter: (n: number | null) => string = fmt
) {
  let class1 = "text-[#e0e0e0]";
  let class2 = "text-[#e0e0e0]";

  if (higherBetter !== undefined && v1 !== null && v2 !== null && v1 !== v2) {
    if (higherBetter) {
      class1 = v1 > v2 ? "text-[#27ae60]" : "text-[#c0392b]";
      class2 = v2 > v1 ? "text-[#27ae60]" : "text-[#c0392b]";
    } else {
      // lower is better
      class1 = v1 < v2 ? "text-[#27ae60]" : "text-[#c0392b]";
      class2 = v2 < v1 ? "text-[#27ae60]" : "text-[#c0392b]";
    }
  }

  return { label, v1: formatter(v1), v2: formatter(v2), class1, class2 };
}

export function ComparisonContent({
  district1,
  district2,
}: {
  district1: District;
  district2: District;
}) {
  const rows = [
    compRow("Population", district1.population, district2.population, undefined, fmt),
    compRow("Density per km²", district1.population_density_per_sq_km, district2.population_density_per_sq_km, undefined, fmt),
    compRow("Median Earnings", district1.median_annual_earnings_residence, district2.median_annual_earnings_residence, true, fmtMoney),
    compRow("Employment %", district1.employment_rate_pct, district2.employment_rate_pct, true, fmtPct),
    compRow("Unemployment %", district1.unemployment_rate_census_pct, district2.unemployment_rate_census_pct, false, fmtPct),
    compRow("Life Exp. Male", district1.life_expectancy_male, district2.life_expectancy_male, true, fmt),
    compRow("Life Exp. Female", district1.life_expectancy_female, district2.life_expectancy_female, true, fmt),
    compRow("% Deprived SOAs", district1.nimdm_pct_in_top100, district2.nimdm_pct_in_top100, false, fmtPct),
    compRow("Median House Price", district1.housing.median_house_price, district2.housing.median_house_price, undefined, fmtMoney),
    compRow("Owner-Occupied %", district1.housing.owner_occupied_pct, district2.housing.owner_occupied_pct, undefined, fmtPct),
    compRow("Degree+ %", district1.education.degree_plus_pct, district2.education.degree_plus_pct, true, fmtPct),
    compRow("No Qualifications %", district1.education.no_qualifications_pct, district2.education.no_qualifications_pct, false, fmtPct),
    compRow("Crime Rate", district1.crime.rate_per_1000, district2.crime.rate_per_1000, false, fmt),
    compRow("Catholic %", district1.demographics.catholic_pct, district2.demographics.catholic_pct, undefined, fmtPct),
    compRow("Protestant %", district1.demographics.protestant_other_christian_pct, district2.demographics.protestant_other_christian_pct, undefined, fmtPct),
  ];

  return (
    <div className="px-4 py-4">
      {/* Column headers */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-x-2 mb-3 pb-2 border-b border-[#2a2a2a]">
        <div className="text-[12px] font-semibold text-[#7fb3d3] truncate">{district1.name}</div>
        <div className="text-[10px] text-[#555] text-center min-w-[90px]" />
        <div className="text-[12px] font-semibold text-[#7fb3d3] truncate text-right">{district2.name}</div>
      </div>

      {/* Comparison rows */}
      <div className="flex flex-col gap-1.5">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-2">
            <div className={`text-[13px] font-medium ${row.class1}`}>{row.v1}</div>
            <div className="text-[10px] text-[#666] text-center min-w-[90px] px-1">{row.label}</div>
            <div className={`text-[13px] font-medium text-right ${row.class2}`}>{row.v2}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-[#2a2a2a]">
        <p className="text-[10px] text-[#555]">
          Green = higher/better, Red = lower/worse (where applicable).
        </p>
      </div>
    </div>
  );
}

// Selection UI — bottom bar shown when isComparing is true
export default function ComparePanel() {
  const { isComparing, selections, clearSelections } = useComparison();

  if (!isComparing) return null;

  const count = selections.length;

  let statusText: string;
  if (count === 0) {
    statusText = "Click two districts to compare";
  } else if (count === 1) {
    statusText = "Now click a second district";
  } else {
    statusText = `${selections[0]} vs ${selections[1]}`;
  }

  // When 2 districts are selected the bottom bar is still shown
  // but the comparison content opens in the StatsPanel (handled in page.tsx)
  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-[1002] bg-[rgba(26,26,26,0.95)] border border-[#333] border-b-0 rounded-t-lg px-5 py-3 backdrop-blur-sm min-w-[300px] text-center">
      <div className="text-xs text-[#aaa]">{statusText}</div>
      {count > 0 && (
        <div className="text-[13px] text-white mt-1">
          {selections.join(" vs ")}
        </div>
      )}
      <button
        className="mt-1.5 bg-none border border-[#555] text-[#888] rounded px-2.5 py-1 text-[11px] cursor-pointer hover:border-[#888] hover:text-[#ccc]"
        onClick={clearSelections}
      >
        Clear
      </button>
    </div>
  );
}
