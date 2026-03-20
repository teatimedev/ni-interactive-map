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

  const ariaLabel = items
    .map((item) => `${item.label}: ${item.display ?? fmtPct(item.value)}`)
    .join(", ");

  return (
    <div className="flex flex-col gap-1" role="img" aria-label={ariaLabel}>
      {items.map((item, i) => {
        const widthPct = max > 0 ? (item.value / max) * 100 : 0;
        const barColor = item.color ?? "#6366f1";

        return (
          <div key={i} className="flex items-center gap-2">
            <span
              className="text-[11px] text-right truncate flex-shrink-0"
              style={{ width: 90, color: "var(--color-text-secondary, #6b7280)" }}
            >
              {item.label}
            </span>
            <div
              className="flex-1 rounded overflow-hidden"
              style={{ height: 18, backgroundColor: "var(--color-border-light, #e5e7eb)" }}
            >
              <div
                className="h-full rounded transition-all duration-300"
                style={{ width: `${widthPct}%`, backgroundColor: barColor }}
              />
            </div>
            <span
              className="text-[11px] text-right flex-shrink-0"
              style={{ width: 42 }}
            >
              {item.display ?? fmtPct(item.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
