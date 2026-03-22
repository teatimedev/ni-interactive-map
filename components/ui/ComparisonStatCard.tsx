"use client";

interface ComparisonStatCardProps {
  value: number;
  label: string;
  format: (n: number) => string;
  niAvg: number;
  higherBetter?: boolean;
  suffix?: string;
}

export default function ComparisonStatCard({
  value,
  label,
  format,
  niAvg,
  higherBetter = true,
  suffix,
}: ComparisonStatCardProps) {
  const ratio = niAvg > 0 ? value / niAvg : 1;
  const diff = value - niAvg;
  const pctDiff = niAvg > 0 ? Math.abs(diff / niAvg) * 100 : 0;

  // Determine color
  let color: string;
  if (pctDiff < 5) {
    color = "#e8a838"; // amber — similar to avg
  } else if ((diff > 0 && higherBetter) || (diff < 0 && !higherBetter)) {
    color = "#27ae60"; // green — better
  } else {
    color = "#c0392b"; // red — worse
  }

  // Gauge: value position on 0-to-2x scale (avg at center)
  const clampedRatio = Math.max(0.1, Math.min(2, ratio));
  const fillPct = (clampedRatio / 2) * 100;

  return (
    <div className="comparison-stat-card">
      <div className="comparison-value" style={{ color }}>
        {format(value)}
        {suffix && <span className="comparison-suffix">{suffix}</span>}
      </div>
      <div className="comparison-label">{label}</div>
      <div className="comparison-gauge">
        <div className="comparison-gauge-track">
          <div
            className="comparison-gauge-fill"
            style={{ width: `${fillPct}%`, background: color }}
          />
          <div className="comparison-gauge-marker" title="NI Average" />
        </div>
      </div>
      <div className="comparison-avg-label">
        NI avg: {format(niAvg)}
      </div>
    </div>
  );
}
