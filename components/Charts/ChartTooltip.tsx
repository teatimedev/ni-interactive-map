"use client";

import { CHART_COLORS, CHART_FONT } from "./ChartTheme";

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string; payload?: Record<string, unknown> }>;
  label?: string;
  formatter?: (value: number) => string;
}

export default function ChartTooltip({ active, payload, label, formatter }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        background: CHART_COLORS.tooltipBg,
        border: `1px solid ${CHART_COLORS.tooltipBorder}`,
        borderRadius: 8,
        padding: "8px 12px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
        fontFamily: CHART_FONT.family,
        fontSize: CHART_FONT.sizeSmall,
      }}
    >
      {label && (
        <div style={{ color: CHART_COLORS.textBright, fontWeight: 600, marginBottom: 4 }}>
          {label}
        </div>
      )}
      {payload.map((entry, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, color: CHART_COLORS.text }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: entry.color, flexShrink: 0 }} />
          <span>{entry.name ?? ""}</span>
          <span style={{ fontFamily: CHART_FONT.mono, fontWeight: 600, color: CHART_COLORS.textBright, marginLeft: "auto" }}>
            {formatter ? formatter(entry.value ?? 0) : `${entry.value}%`}
          </span>
        </div>
      ))}
    </div>
  );
}
