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
  const min = isWardView && config.wardMin !== undefined ? config.wardMin : config.min;
  const max = isWardView && config.wardMax !== undefined ? config.wardMax : config.max;

  const [r, g, b] = config.color;
  const base = 0.15;
  const colorLow = `rgb(${Math.round(r * base)}, ${Math.round(g * base)}, ${Math.round(b * base)})`;
  const colorHigh = `rgb(${r}, ${g}, ${b})`;
  const gradient = `linear-gradient(to right, ${colorLow}, ${colorHigh})`;

  return (
    <div style={{
      position: "fixed", bottom: 30, right: 16, zIndex: 1000,
      background: "rgba(26,26,26,0.92)", border: "1px solid #333", borderRadius: 8,
      padding: "10px 14px", backdropFilter: "blur(8px)", minWidth: 160,
    }}>
      <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
        {config.label}
      </div>
      <div style={{ width: "100%", height: 12, borderRadius: 3, marginBottom: 4, background: gradient }} />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#777" }}>
        <span>{formatLabel(min, metric)}</span>
        <span>{formatLabel(max, metric)}</span>
      </div>
    </div>
  );
}
