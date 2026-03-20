"use client";

import { useState } from "react";
import { useComparison } from "@/hooks/useComparison";
import type { District } from "@/lib/types";

function fmt(n: number | null): string {
  if (n === null || n === undefined) return "\u2014";
  return n.toLocaleString();
}

function fmtMoney(n: number | null): string {
  if (n === null || n === undefined) return "\u2014";
  return "\u00A3" + n.toLocaleString();
}

function fmtPct(n: number | null): string {
  if (n === null || n === undefined) return "\u2014";
  return n.toFixed(1) + "%";
}

interface CompRow {
  label: string;
  v1: string;
  v2: string;
  raw1: number | null;
  raw2: number | null;
  class1: string;
  class2: string;
  borderColor: string;
}

function compRow(
  label: string,
  v1: number | null,
  v2: number | null,
  higherBetter?: boolean,
  formatter: (n: number | null) => string = fmt
): CompRow {
  let class1 = "text-[#e0e0e0]";
  let class2 = "text-[#e0e0e0]";
  let borderColor = "transparent";

  if (higherBetter !== undefined && v1 !== null && v2 !== null && v1 !== v2) {
    if (higherBetter) {
      class1 = v1 > v2 ? "text-[#27ae60]" : "text-[#c0392b]";
      class2 = v2 > v1 ? "text-[#27ae60]" : "text-[#c0392b]";
      borderColor = v1 > v2 ? "#27ae60" : "#c0392b";
    } else {
      class1 = v1 < v2 ? "text-[#27ae60]" : "text-[#c0392b]";
      class2 = v2 < v1 ? "text-[#27ae60]" : "text-[#c0392b]";
      borderColor = v1 < v2 ? "#27ae60" : "#c0392b";
    }
  }

  return { label, v1: formatter(v1), v2: formatter(v2), raw1: v1, raw2: v2, class1, class2, borderColor };
}

function ValueWithBar({ value, raw, maxRaw, className, align }: {
  value: string;
  raw: number | null;
  maxRaw: number;
  className: string;
  align: "left" | "right";
}) {
  const barPct = raw !== null && maxRaw > 0 ? (Math.abs(raw) / maxRaw) * 100 : 0;
  const barColor = className.includes("27ae60") ? "#27ae60" : className.includes("c0392b") ? "#c0392b" : "#555";

  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 3, padding: "2px 4px" }}>
      <div
        className="compare-bar"
        style={{
          width: `${barPct}%`,
          background: barColor,
          [align === "left" ? "left" : "right"]: 0,
        }}
      />
      <span className={`${className} relative font-medium text-[13px]`} style={{ position: "relative" }}>
        {value}
      </span>
    </div>
  );
}

export function ComparisonContent({
  district1,
  district2,
}: {
  district1: District;
  district2: District;
}) {
  const [swapped, setSwapped] = useState(false);
  const d1 = swapped ? district2 : district1;
  const d2 = swapped ? district1 : district2;

  const rows = [
    compRow("Population", d1.population, d2.population, undefined, fmt),
    compRow("Density per km\u00B2", d1.population_density_per_sq_km, d2.population_density_per_sq_km, undefined, fmt),
    compRow("Median Earnings", d1.median_annual_earnings_residence, d2.median_annual_earnings_residence, true, fmtMoney),
    compRow("Employment %", d1.employment_rate_pct, d2.employment_rate_pct, true, fmtPct),
    compRow("Unemployment %", d1.unemployment_rate_census_pct, d2.unemployment_rate_census_pct, false, fmtPct),
    compRow("Life Exp. Male", d1.life_expectancy_male, d2.life_expectancy_male, true, fmt),
    compRow("Life Exp. Female", d1.life_expectancy_female, d2.life_expectancy_female, true, fmt),
    compRow("% Deprived SOAs", d1.nimdm_pct_in_top100, d2.nimdm_pct_in_top100, false, fmtPct),
    compRow("Median House Price", d1.housing.median_house_price, d2.housing.median_house_price, undefined, fmtMoney),
    compRow("Owner-Occupied %", d1.housing.owner_occupied_pct, d2.housing.owner_occupied_pct, undefined, fmtPct),
    compRow("Degree+ %", d1.education.degree_plus_pct, d2.education.degree_plus_pct, true, fmtPct),
    compRow("No Qualifications %", d1.education.no_qualifications_pct, d2.education.no_qualifications_pct, false, fmtPct),
    compRow("Crime Rate", d1.crime.rate_per_1000, d2.crime.rate_per_1000, false, fmt),
    compRow("Catholic %", d1.demographics.catholic_pct, d2.demographics.catholic_pct, undefined, fmtPct),
    compRow("Protestant %", d1.demographics.protestant_other_christian_pct, d2.demographics.protestant_other_christian_pct, undefined, fmtPct),
  ];

  return (
    <div className="px-4 py-4">
      {/* Column headers with swap button */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-x-2 mb-3 pb-2 border-b border-[#2a2a2a] items-center">
        <div className="text-[12px] font-semibold text-[#7fb3d3] truncate">{d1.name}</div>
        <button
          className="compare-swap"
          onClick={() => setSwapped(!swapped)}
          aria-label="Swap columns"
          title="Swap columns"
        >
          \u21C4
        </button>
        <div className="text-[12px] font-semibold text-[#7fb3d3] truncate text-right">{d2.name}</div>
      </div>

      {/* Comparison rows */}
      <div className="flex flex-col gap-0.5">
        {rows.map((row) => {
          const maxRaw = Math.max(Math.abs(row.raw1 ?? 0), Math.abs(row.raw2 ?? 0));
          return (
            <div
              key={row.label}
              className="compare-row grid grid-cols-[1fr_auto_1fr] items-center gap-x-2"
              style={{ borderLeft: `3px solid ${row.borderColor}` }}
            >
              <ValueWithBar value={row.v1} raw={row.raw1} maxRaw={maxRaw} className={row.class1} align="left" />
              <div className="text-[10px] text-[#666] text-center min-w-[90px] px-1">{row.label}</div>
              <ValueWithBar value={row.v2} raw={row.raw2} maxRaw={maxRaw} className={row.class2} align="right" />
            </div>
          );
        })}
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

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-[1002] bg-[rgba(26,26,26,0.95)] border border-[#333] border-b-0 rounded-t-lg px-5 py-3 backdrop-blur-sm min-w-[300px] text-center">
      {count === 0 && (
        <div className="text-xs text-[#aaa]">Click two districts to compare</div>
      )}
      {count === 1 && (
        <div className="text-xs text-[#aaa] compare-pulse">
          Now click a second district
        </div>
      )}
      {count === 2 && (
        <div className="text-[13px] text-white">
          {selections.join(" vs ")}
        </div>
      )}
      <button
        className="mt-1.5 bg-none border border-[#555] text-[#888] rounded px-2.5 py-1 text-[11px] cursor-pointer hover:border-[#888] hover:text-[#ccc] transition-colors"
        onClick={clearSelections}
      >
        Clear
      </button>
    </div>
  );
}
