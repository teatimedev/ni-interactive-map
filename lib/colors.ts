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

export function getChoroplethColor(
  val: number | null,
  color: [number, number, number],
  min: number,
  max: number
): string {
  if (val == null) return "#333";
  const t = Math.max(0, Math.min(1, (val - min) / (max - min)));
  const [r, g, b] = color;
  const base = 0.15;
  const intensity = base + t * (1 - base);
  return `rgb(${Math.round(r * intensity)}, ${Math.round(g * intensity)}, ${Math.round(b * intensity)})`;
}
