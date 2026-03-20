"use client";

import { fmtPct } from "@/lib/utils";

interface Segment {
  label: string;
  pct: number;
  color: string;
}

interface StackedBarProps {
  segments: Segment[];
}

export default function StackedBar({ segments }: StackedBarProps) {
  const ariaLabel = segments
    .map((s) => `${s.label}: ${fmtPct(s.pct)}`)
    .join(", ");

  return (
    <div role="img" aria-label={ariaLabel}>
      <div className="flex flex-row rounded overflow-hidden" style={{ height: 14 }}>
        {segments.map((seg, i) => (
          <div
            key={i}
            style={{ width: `${seg.pct}%`, backgroundColor: seg.color }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-1">
            <span
              className="inline-block w-2 h-2 rounded-sm flex-shrink-0"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-[11px]">
              {seg.label}: {fmtPct(seg.pct)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
