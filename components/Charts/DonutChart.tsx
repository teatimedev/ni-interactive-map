"use client";

import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { fmtPct } from "@/lib/utils";
import ChartTooltip from "./ChartTooltip";
import { CHART_FONT, CHART_ANIMATION } from "./ChartTheme";

interface Segment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: Segment[];
  size?: number;
}

export default function DonutChart({ segments, size = 130 }: DonutChartProps) {
  const ariaLabel = segments
    .map((s) => `${s.label}: ${fmtPct(s.value)}`)
    .join(", ");

  const data = segments.map((s) => ({ name: s.label, value: s.value, color: s.color }));

  return (
    <div className="flex flex-row items-center gap-5" role="img" aria-label={ariaLabel}>
      <PieChart width={size} height={size}>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius="50%"
          outerRadius="88%"
          startAngle={90}
          endAngle={-270}
          isAnimationActive={true}
          animationDuration={CHART_ANIMATION.duration}
          animationEasing={CHART_ANIMATION.easing}
          strokeWidth={1}
          stroke="rgba(25,26,28,0.6)"
        >
          {segments.map((seg, i) => (
            <Cell key={i} fill={seg.color} />
          ))}
        </Pie>
        <Tooltip
          content={<ChartTooltip formatter={(v) => fmtPct(v)} />}
        />
      </PieChart>
      <div className="flex flex-col" style={{ gap: 6 }}>
        {segments.map((seg, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: seg.color,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: CHART_FONT.sizeSmall, color: "#b0ada6", fontFamily: CHART_FONT.family }}>
              {seg.label}
            </span>
            <span style={{
              fontSize: CHART_FONT.sizeSmall,
              fontFamily: CHART_FONT.mono,
              fontWeight: 600,
              color: "#e2e0dd",
              marginLeft: "auto",
            }}>
              {fmtPct(seg.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
