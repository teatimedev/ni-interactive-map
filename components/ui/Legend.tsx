"use client";

import { useChoropleth } from "@/hooks/useChoropleth";
import { useMapState } from "@/hooks/useMapState";
import { CHOROPLETH_CONFIGS } from "@/lib/colors";

function formatLabel(value: number, metric: string): string {
  const formatted = value.toLocaleString();
  if (metric === "median_income" || metric === "house_price") {
    return `£${formatted}`;
  }
  return formatted;
}

export default function Legend() {
  const { metric } = useChoropleth();
  const { currentView } = useMapState();

  if (!metric) return null;

  const config = CHOROPLETH_CONFIGS[metric];

  const isWardView = currentView !== "districts";
  const min =
    isWardView && config.wardMin !== undefined ? config.wardMin : config.min;
  const max =
    isWardView && config.wardMax !== undefined ? config.wardMax : config.max;

  const [r, g, b] = config.color;
  const base = 0.15;

  const colorLow = `rgb(${Math.round(r * base)}, ${Math.round(g * base)}, ${Math.round(b * base)})`;
  const colorHigh = `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;

  const gradient = `linear-gradient(to right, ${colorLow}, ${colorHigh})`;

  const minLabel = formatLabel(min, metric);
  const maxLabel = formatLabel(max, metric);

  return (
    <div className="fixed bottom-8 right-4 z-[1000] bg-[rgba(26,26,26,0.92)] border border-[#333] rounded-lg px-3.5 py-2.5 backdrop-blur-sm min-w-[160px]">
      <div className="text-[11px] text-[#888] uppercase tracking-wider mb-2">
        {config.label}
      </div>
      <div
        className="w-full h-3 rounded-sm mb-1"
        style={{ background: gradient }}
      ></div>
      <div className="flex justify-between text-[10px] text-[#777]">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}
