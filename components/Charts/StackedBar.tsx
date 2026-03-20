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
  return (
    <div role="img" aria-label={segments.map((s) => `${s.label}: ${fmtPct(s.pct)}`).join(", ")}>
      <div className="h-bar-container">
        {segments.map((seg, i) => (
          <div
            key={i}
            className="h-bar-segment"
            style={{ width: `${seg.pct}%`, background: seg.color }}
            title={`${seg.label}: ${seg.pct}%`}
          />
        ))}
      </div>
      <div className="h-bar-legend">
        {segments.map((seg, i) => (
          <div key={i} className="h-bar-legend-item">
            <div className="h-bar-legend-dot" style={{ background: seg.color }} />
            {seg.label}: {fmtPct(seg.pct)}
          </div>
        ))}
      </div>
    </div>
  );
}
