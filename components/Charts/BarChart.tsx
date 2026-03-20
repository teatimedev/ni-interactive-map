"use client";

import { fmtPct } from "@/lib/utils";

interface BarItem {
  label: string;
  value: number;
  color?: string;
  display?: string;
}

interface BarChartProps {
  items: BarItem[];
  maxOverride?: number;
}

export default function BarChart({ items, maxOverride }: BarChartProps) {
  const max = maxOverride ?? Math.max(...items.map((i) => i.value));

  return (
    <div className="bar-chart" role="img" aria-label={items.map((i) => `${i.label}: ${i.display ?? fmtPct(i.value)}`).join(", ")}>
      {items.map((item, i) => {
        const widthPct = max > 0 ? ((item.value / max) * 100).toFixed(1) : "0";
        return (
          <div key={i} className="bar-row">
            <div className="bar-label">{item.label}</div>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{ width: `${widthPct}%`, background: item.color || "#2980b9" }}
              />
            </div>
            <div className="bar-value">{item.display ?? fmtPct(item.value)}</div>
          </div>
        );
      })}
    </div>
  );
}
