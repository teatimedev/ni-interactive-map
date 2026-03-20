"use client";

import { PieChart, Pie, Cell } from "recharts";
import { fmtPct } from "@/lib/utils";

interface Segment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: Segment[];
  size?: number;
}

export default function DonutChart({ segments, size = 90 }: DonutChartProps) {
  const ariaLabel = segments
    .map((s) => `${s.label}: ${fmtPct(s.value)}`)
    .join(", ");

  return (
    <div className="flex flex-row items-center gap-4" role="img" aria-label={ariaLabel}>
      <PieChart width={size} height={size}>
        <Pie
          data={segments}
          dataKey="value"
          innerRadius="55%"
          outerRadius="90%"
          startAngle={90}
          endAngle={-270}
          isAnimationActive={true}
          animationDuration={600}
          animationEasing="ease-out"
        >
          {segments.map((seg, i) => (
            <Cell key={i} fill={seg.color} />
          ))}
        </Pie>
      </PieChart>
      <div className="flex flex-col gap-1">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-[12px]">
              {seg.label}: {fmtPct(seg.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
