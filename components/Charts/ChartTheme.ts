/** Shared Recharts theme configuration for dark UI */

export const CHART_COLORS = {
  grid: "rgba(255,255,255,0.04)",
  axis: "#5a5854",
  text: "#b0ada6",
  textBright: "#e2e0dd",
  tooltipBg: "#25262a",
  tooltipBorder: "#3a3b41",
  defaultBar: "#3b82c4",
} as const;

export const CHART_FONT = {
  family: "var(--font-body), 'DM Sans', system-ui, sans-serif",
  mono: "var(--font-mono), 'JetBrains Mono', monospace",
  size: 12,
  sizeSmall: 11,
} as const;

export const CHART_ANIMATION = {
  duration: 800,
  easing: "ease-out" as const,
  staggerMs: 50,
} as const;
