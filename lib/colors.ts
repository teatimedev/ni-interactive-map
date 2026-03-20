import type { District, Ward, ChoroplethMetric } from "./types";

// ===== PARTY COLORS =====
export const PARTY_COLORS: Record<string, string> = {
  "sinn féin": "#326732",
  sf: "#326732",
  dup: "#c41a1a",
  alliance: "#e6b800",
  uup: "#003399",
  sdlp: "#2e8b57",
  tuv: "#0c2d5e",
  pbp: "#e10000",
  "people before profit": "#e10000",
  green: "#4caf50",
  default: "#777",
};

export function getPartyColor(party: string): string {
  const key = party.toLowerCase();
  return PARTY_COLORS[key] ?? PARTY_COLORS["default"];
}

// ===== CHOROPLETH =====
export interface ChoroplethConfigFull {
  label: string;
  key: (d: District) => number | null | undefined;
  wardKey: ((w: Ward | null) => number | null | undefined) | null;
  min: number;
  max: number;
  wardMin?: number;
  wardMax?: number;
  color: [number, number, number];
}

export const CHOROPLETH_CONFIGS: Record<ChoroplethMetric, ChoroplethConfigFull> = {
  population_density: {
    label: "Population Density (per km²)",
    key: (d) => d.population_density_per_sq_km,
    wardKey: (w) => (w ? w.population : null),
    min: 40,
    max: 2600,
    wardMin: 500,
    wardMax: 12000,
    color: [20, 100, 160],
  },
  deprivation: {
    label: "% SOAs in Top 100 Deprived",
    key: (d) => d.nimdm_pct_in_top100,
    wardKey: (w) => (w ? ((462 - w.deprivation_rank) / 462) * 100 : null),
    min: 0,
    max: 30,
    wardMin: 0,
    wardMax: 100,
    color: [180, 40, 40],
  },
  median_income: {
    label: "Median Annual Earnings (£)",
    key: (d) => d.median_annual_earnings_residence,
    wardKey: null,
    min: 27000,
    max: 35000,
    color: [30, 130, 76],
  },
  house_price: {
    label: "Median House Price (£)",
    key: (d) => d.housing?.median_house_price,
    wardKey: null,
    min: 120000,
    max: 210000,
    color: [140, 80, 30],
  },
  crime_rate: {
    label: "Crime Rate per 1,000",
    key: (d) => d.crime?.rate_per_1000,
    wardKey: null,
    min: 20,
    max: 80,
    color: [160, 30, 30],
  },
  degree_pct: {
    label: "% Degree-Educated",
    key: (d) => d.education?.degree_plus_pct,
    wardKey: (w) => (w ? w.level_4_plus_pct : null),
    min: 18,
    max: 40,
    wardMin: 5,
    wardMax: 65,
    color: [30, 80, 160],
  },
  no_car_pct: {
    label: "% Households No Car",
    key: (d) => d.transport?.no_car_pct,
    wardKey: (w) => (w ? w.no_cars_pct : null),
    min: 10,
    max: 40,
    wardMin: 0,
    wardMax: 60,
    color: [100, 60, 140],
  },
  catholic_pct: {
    label: "% Catholic Background",
    key: (d) => d.demographics?.catholic_pct,
    wardKey: (w) => (w ? w.catholic_pct : null),
    min: 8,
    max: 75,
    wardMin: 0,
    wardMax: 100,
    color: [40, 120, 60],
  },
  protestant_pct: {
    label: "% Protestant / Other Christian",
    key: (d) => d.demographics?.protestant_other_christian_pct,
    wardKey: (w) => (w ? w.protestant_other_christian_pct : null),
    min: 20,
    max: 75,
    wardMin: 0,
    wardMax: 100,
    color: [50, 80, 150],
  },
};

/**
 * Convert a metric color to HSL parameters (cached per color).
 */
function colorToHSL(color: [number, number, number]): { h: number; s: number } {
  const [r, g, b] = color;
  const maxCh = Math.max(r, g, b);
  const minCh = Math.min(r, g, b);
  const delta = maxCh - minCh;
  let h = 0;
  if (delta > 0) {
    if (maxCh === r) h = ((g - b) / delta) % 6;
    else if (maxCh === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }
  const s = Math.round((delta / Math.max(maxCh, 1)) * 100);
  return { h, s };
}

/**
 * Color a single value using a pre-computed rank (0-1).
 * Pass `t` as a rank-normalized value, not a raw data value.
 */
export function choroplethColorFromT(
  t: number,
  color: [number, number, number],
): string {
  const { h, s } = colorToHSL(color);
  // Lightness: 38% (low rank) to 70% (high rank)
  const l = Math.round(38 + t * 32);
  return `hsl(${h}, ${s}%, ${l}%)`;
}

/**
 * Compute rank-based normalization for a set of values.
 * Returns a Map from value to its normalized position (0-1).
 * Ties get the same rank. Guarantees full spread across the color range.
 */
export function computeRankMap(values: (number | null)[]): Map<number, number> {
  const valid = values.filter((v): v is number => v != null);
  if (valid.length === 0) return new Map();

  const sorted = [...new Set(valid)].sort((a, b) => a - b);
  const max = sorted.length - 1;
  const map = new Map<number, number>();

  sorted.forEach((val, i) => {
    map.set(val, max > 0 ? i / max : 0.5);
  });

  return map;
}

/**
 * Legacy function kept for compatibility — uses linear normalization.
 */
export function getChoroplethColor(
  val: number | null,
  color: [number, number, number],
  min: number,
  max: number
): string {
  if (val == null) return "#2a2a2a";
  const t = Math.max(0, Math.min(1, (val - min) / (max - min)));
  return choroplethColorFromT(t, color);
}
