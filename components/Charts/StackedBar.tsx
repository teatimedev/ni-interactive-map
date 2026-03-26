"use client";

import { fmtPct } from "@/lib/utils";
import { CHART_COLORS, CHART_FONT, CHART_ANIMATION } from "./ChartTheme";

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
      {/* Bar */}
      <div
        style={{
          display: "flex",
          height: 28,
          borderRadius: 6,
          overflow: "hidden",
          background: CHART_COLORS.grid,
        }}
      >
        {segments.map((seg, i) => (
          <div
            key={i}
            style={{
              width: `${seg.pct}%`,
              background: seg.color,
              transition: `width ${CHART_ANIMATION.duration}ms ${CHART_ANIMATION.easing}`,
              position: "relative",
              cursor: "default",
            }}
            title={`${seg.label}: ${fmtPct(seg.pct)}`}
          >
            {/* Show percentage inside segment if wide enough */}
            {seg.pct >= 12 && (
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: CHART_FONT.mono,
                  fontSize: 10,
                  fontWeight: 600,
                  color: "rgba(0,0,0,0.7)",
                  letterSpacing: "-0.02em",
                }}
              >
                {Math.round(seg.pct)}%
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "6px 14px",
          marginTop: 10,
          fontSize: CHART_FONT.sizeSmall,
          fontFamily: CHART_FONT.family,
          color: CHART_COLORS.text,
        }}
      >
        {segments.map((seg, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: seg.color,
                flexShrink: 0,
              }}
            />
            <span>{seg.label}</span>
            <span
              style={{
                fontFamily: CHART_FONT.mono,
                fontWeight: 600,
                color: CHART_COLORS.textBright,
              }}
            >
              {fmtPct(seg.pct)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
