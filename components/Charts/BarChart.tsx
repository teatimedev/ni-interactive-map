"use client";

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { fmtPct } from "@/lib/utils";
import ChartTooltip from "./ChartTooltip";
import { CHART_COLORS, CHART_FONT, CHART_ANIMATION } from "./ChartTheme";

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
  const data = items.map((item) => ({
    name: item.label,
    value: item.value,
    color: item.color || CHART_COLORS.defaultBar,
    display: item.display ?? fmtPct(item.value),
  }));

  const chartHeight = Math.max(items.length * 36, 120);

  return (
    <div
      role="img"
      aria-label={items.map((i) => `${i.label}: ${i.display ?? fmtPct(i.value)}`).join(", ")}
    >
      <ResponsiveContainer width="100%" height={chartHeight}>
        <RechartsBarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 48, left: 0, bottom: 0 }}
          barSize={14}
          barGap={4}
        >
          <XAxis
            type="number"
            domain={[0, max > 0 ? max : 1]}
            hide
          />
          <YAxis
            type="category"
            dataKey="name"
            width={100}
            tick={{
              fill: CHART_COLORS.text,
              fontSize: CHART_FONT.sizeSmall,
              fontFamily: CHART_FONT.family,
            }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<ChartTooltip formatter={(v) => data.find((d) => d.value === v)?.display ?? fmtPct(v)} />}
            cursor={{ fill: "rgba(255,255,255,0.02)" }}
          />
          <Bar
            dataKey="value"
            radius={[0, 4, 4, 0]}
            animationDuration={CHART_ANIMATION.duration}
            animationEasing={CHART_ANIMATION.easing}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
