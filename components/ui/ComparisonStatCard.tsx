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

  let color: string;
  let comparisonText: string;
  if (pctDiff < 5) {
    color = "var(--warning)";
    comparisonText = "Near NI average";
  } else if ((diff > 0 && higherBetter) || (diff < 0 && !higherBetter)) {
    color = "var(--positive)";
    comparisonText = `${Math.round(pctDiff)}% ${diff > 0 ? "above" : "below"} NI avg`;
  } else {
    color = "var(--negative)";
    comparisonText = `${Math.round(pctDiff)}% ${diff > 0 ? "above" : "below"} NI avg`;
  }

  const clampedRatio = Math.max(0.1, Math.min(2, ratio));
  const fillPct = (clampedRatio / 2) * 100;

  return (
    <div className="comparison-stat-card">
      <div className="comparison-value" style={{ color }}>
        {format(value)}
        {suffix && <span className="comparison-suffix">{suffix}</span>}
      </div>
      <div className="comparison-label">{label}</div>

      {/* Textual comparison */}
      <div style={{ fontSize: 11, color, fontWeight: 500, marginTop: 4, marginBottom: 8 }}>
        {comparisonText}
      </div>

      {/* Gauge */}
      <div className="comparison-gauge">
        <div className="comparison-gauge-track">
          <div
            className="comparison-gauge-fill"
            style={{ width: `${fillPct}%`, background: color }}
          />
          {/* NI Average marker */}
          <div className="comparison-gauge-marker" title="NI Average">
            <span className="comparison-gauge-marker-label">NI</span>
          </div>
        </div>
      </div>
      <div className="comparison-avg-label">
        NI avg: {format(niAvg)}
      </div>
    </div>
  );
}
