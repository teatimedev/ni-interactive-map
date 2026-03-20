"use client";

interface TrendIndicatorProps {
  current: number;
  previous: number | undefined | null;
  /** If true, a decrease is good (e.g. unemployment dropping) */
  invertColor?: boolean;
  suffix?: string;
}

export default function TrendIndicator({ current, previous, invertColor, suffix = "pp" }: TrendIndicatorProps) {
  if (previous == null) return null;

  const diff = current - previous;
  if (Math.abs(diff) < 0.05) return null; // negligible change

  const isUp = diff > 0;
  const isGood = invertColor ? !isUp : isUp;
  const color = isGood ? "var(--positive)" : "var(--negative)";
  const arrow = isUp ? "\u25B2" : "\u25BC";

  return (
    <span style={{ fontSize: 11, color, marginLeft: 6, fontWeight: 500 }}>
      {arrow} {Math.abs(diff).toFixed(1)}{suffix}
      <span style={{ fontSize: 9, color: "var(--text-muted)", marginLeft: 3 }}>since 2011</span>
    </span>
  );
}
