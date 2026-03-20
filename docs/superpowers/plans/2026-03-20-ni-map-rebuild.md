# The Big Dirty NI Map — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the vanilla JS interactive NI map as a Next.js App Router application with TypeScript, Tailwind, react-leaflet, Recharts, mobile bottom sheet, search, URL routing, and social sharing.

**Architecture:** Next.js 15 App Router with client-side Leaflet map. District data bundled at build time, ward data split into 11 JSON files and lazy-loaded on drill-down. Three custom hooks (useMapState, useChoropleth, useComparison) provide all state via React context. Desktop uses a slide-in side panel; mobile uses a bottom sheet.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, react-leaflet, Recharts, Vercel

**Spec:** `docs/superpowers/specs/2026-03-20-ni-map-rebuild-design.md`

**Existing code reference:** The current vanilla site is in the repo root (`index.html`, `app.js`, `stats-data.js`, `ward-stats.js`, `geo-data.js`). All data and logic should be ported from these files.

---

## Task 1: Scaffold Next.js Project

**Files:**
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `.gitignore` (update)

- [ ] **Step 1: Initialize Next.js with TypeScript and Tailwind**

```bash
cd ~/ni-interactive-map
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm --yes
```

Note: This will scaffold into the existing directory. If prompted about existing files, allow it to proceed — the existing vanilla files won't conflict.

- [ ] **Step 2: Install dependencies**

```bash
npm install leaflet react-leaflet recharts
npm install -D @types/leaflet
```

- [ ] **Step 3: Update next.config.ts for static output**

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
```

Note: `output: "export"` produces static HTML for Vercel. `images.unoptimized` because we have no image optimization server in static mode.

- [ ] **Step 4: Set up globals.css with dark theme base**

Replace the Tailwind boilerplate in `app/globals.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg-primary: #1a1a1a;
  --bg-panel: #1e1e1e;
  --bg-card: #252525;
  --border: #333;
  --border-light: #2a2a2a;
  --text-primary: #e0e0e0;
  --text-secondary: #888;
  --text-muted: #555;
  --accent: #2980b9;
  --accent-light: #7fb3d3;
  --positive: #27ae60;
  --negative: #c0392b;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  overflow: hidden;
  height: 100vh;
}

/* Leaflet dark theme overrides */
.leaflet-control-zoom a {
  background: #2a2a2a !important;
  color: #ccc !important;
  border-color: #444 !important;
}
.leaflet-control-zoom a:hover {
  background: #3a3a3a !important;
  color: #fff !important;
}
.leaflet-control-attribution {
  background: rgba(26, 26, 26, 0.7) !important;
  color: #555 !important;
  font-size: 10px !important;
}
.leaflet-control-attribution a {
  color: #666 !important;
}
```

- [ ] **Step 5: Set up root layout with metadata**

```typescript
// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Big Dirty NI Map",
  description:
    "Interactive map of Northern Ireland with real stats for all 462 wards",
  openGraph: {
    title: "The Big Dirty NI Map",
    description:
      "Interactive map of Northern Ireland with real stats for all 462 wards",
    images: ["/og-image.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
  themeColor: "#1a1a1a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 6: Create placeholder home page**

```typescript
// app/page.tsx
export default function Home() {
  return (
    <div className="flex items-center justify-center h-screen">
      <h1 className="text-2xl text-[var(--text-primary)]">
        The Big Dirty NI Map
      </h1>
    </div>
  );
}
```

- [ ] **Step 7: Verify dev server runs**

```bash
npm run dev
```

Expected: Next.js dev server starts on http://localhost:3000, shows "The Big Dirty NI Map" centered.

- [ ] **Step 8: Update .gitignore and commit**

Append to `.gitignore`:
```
.superpowers/
```

```bash
git add -A
git commit -m "feat: scaffold Next.js project with TypeScript and Tailwind"
```

---

## Task 2: TypeScript Types and Utility Functions

**Files:**
- Create: `lib/types.ts`, `lib/utils.ts`, `lib/colors.ts`

- [ ] **Step 1: Define all TypeScript interfaces in lib/types.ts**

Derive these from the existing data shapes in `stats-data.js` (lines 44-80 for district structure) and `ward-stats.js` (lines 9-49 for ward structure).

```typescript
// lib/types.ts

// === Assembly Election ===
export interface PartyResult {
  party: string;
  approx_vote_share: number;
}

export interface AssemblyElection {
  note?: string;
  top_parties: PartyResult[];
}

// === District Sub-Objects ===
export interface Demographics {
  population_2011: number;
  population_change_pct: number;
  catholic_pct: number;
  protestant_other_christian_pct: number;
  other_religion_pct: number;
  no_religion_pct: number;
  born_ni_pct: number;
  born_rest_uk_pct: number;
  born_ireland_pct: number;
  born_eu_pct: number;
  born_rest_world_pct: number;
  irish_speakers_pct: number;
  ulster_scots_speakers_pct: number;
  urban_rural?: string;
}

export interface Housing {
  median_house_price: number;
  avg_house_price: number;
  price_year?: string;
  owner_occupied_pct: number;
  private_rented_pct: number;
  social_housing_pct: number;
}

export interface Health {
  very_good_pct: number;
  good_pct: number;
  fair_pct: number;
  bad_pct: number;
  very_bad_pct: number;
  disability_limited_lot_pct: number;
  disability_limited_little_pct: number;
  unpaid_care_pct: number;
}

export interface Crime {
  total_recorded: number;
  rate_per_1000: number;
  period?: string;
  violence?: number;
  theft?: number;
  criminal_damage?: number;
  burglary?: number;
  drugs?: number;
  public_order?: number;
  possession_weapons?: number;
  antisocial_behaviour?: number;
}

export interface Education {
  degree_plus_pct: number;
  a_level_pct: number;
  gcse_pct: number;
  other_pct?: number;
  no_qualifications_pct: number;
}

export interface Transport {
  no_car_pct: number;
  one_car_pct: number;
  two_plus_cars_pct: number;
  drive_pct?: number;
  public_transport_pct?: number;
  walk_cycle_pct?: number;
  work_from_home_pct?: number;
  other_pct?: number;
  avg_broadband_mbps?: number;
}

// === District ===
export interface District {
  name: string;
  slug: string;
  population: number;
  area_sq_km: number;
  population_density_per_sq_km: number;
  age_0_15_pct: number;
  age_16_64_pct: number;
  age_65_plus_pct: number;
  median_age?: number;
  median_annual_earnings_residence: number;
  employment_rate_pct: number;
  unemployment_rate_census_pct: number;
  claimant_count_rate_pct?: number;
  life_expectancy_male: number;
  life_expectancy_female: number;
  long_term_health_condition_pct: number;
  nimdm_soas_in_top100: number;
  nimdm_total_soas: number;
  nimdm_pct_in_top100: number;
  assembly_2022?: AssemblyElection;
  demographics?: Demographics;
  housing?: Housing;
  health?: Health;
  crime?: Crime;
  education?: Education;
  transport?: Transport;
}

// === Ward ===
export interface DeprivationRanks {
  overall_rank: number;
  income_rank: number;
  employment_rank: number;
  health_rank: number;
  education_rank: number;
  access_rank: number;
  living_env_rank: number;
  crime_rank: number;
}

export interface Ward {
  name: string;
  slug: string;
  lgd: string;
  population: number;
  male: number;
  female: number;
  age_0_15_pct: number;
  age_16_64_pct: number;
  age_65_plus_pct: number;
  catholic_pct: number;
  protestant_other_christian_pct: number;
  other_religion_pct: number;
  no_religion_pct: number;
  born_ni_pct: number;
  born_other_uk_pct: number;
  born_roi_pct: number;
  born_elsewhere_pct: number;
  owner_occupied_pct: number;
  social_rented_pct: number;
  private_rented_pct: number;
  no_qualifications_pct: number;
  level_1_2_pct: number;
  level_3_pct: number;
  level_4_plus_pct: number;
  very_good_good_health_pct: number;
  fair_health_pct: number;
  bad_very_bad_health_pct: number;
  no_cars_pct: number;
  one_car_pct: number;
  two_plus_cars_pct: number;
  work_from_home_pct: number;
  drive_to_work_pct: number;
  public_transport_pct: number;
  walk_cycle_pct: number;
  urban_rural?: string;
  deprivation_rank: number;
  income_rank: number;
  employment_rank: number;
  health_rank: number;
  education_rank: number;
  access_rank: number;
  living_env_rank: number;
  crime_rank: number;
}

// === Ward data file structure (one per LGD) ===
export interface WardDataFile {
  lgd: string;
  wards: WardWithGeometry[];
}

export interface WardWithGeometry extends Ward {
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
}

// === NI Overall ===
export interface NIOverall {
  total_population: number;
  total_area_sq_km: number;
  population_density_per_sq_km: number;
  life_expectancy_male: number;
  life_expectancy_female: number;
  median_annual_earnings_residence: number;
  employment_rate_pct: number;
  unemployment_rate_census_pct: number;
  total_recorded_crime_2024_25: number;
  crime_rate_per_1000: number;
}

// === Choropleth ===
export type ChoroplethMetric =
  | "population_density"
  | "deprivation"
  | "median_income"
  | "house_price"
  | "crime_rate"
  | "degree_pct"
  | "no_car_pct"
  | "catholic_pct"
  | "protestant_pct";

export interface ChoroplethConfig {
  label: string;
  key: (d: District) => number | null;
  wardKey: ((w: Ward) => number | null) | null;
  min: number;
  max: number;
  wardMin?: number;
  wardMax?: number;
  color: [number, number, number];
}

// === Map State ===
export type MapView = "districts" | "district-detail" | "ward-detail";
```

- [ ] **Step 2: Create utility functions in lib/utils.ts**

Port the formatting functions from `app.js` (lines 42-55):

```typescript
// lib/utils.ts

export function fmt(n: number | null | undefined): string {
  if (n == null) return "—";
  return typeof n === "number" ? n.toLocaleString() : String(n);
}

export function fmtPct(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toFixed(1) + "%";
}

export function fmtMoney(n: number | null | undefined): string {
  if (n == null) return "—";
  return "£" + n.toLocaleString();
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function deslugify(slug: string, items: { name: string; slug: string }[]): string | null {
  const found = items.find((item) => item.slug === slug);
  return found ? found.name : null;
}
```

- [ ] **Step 3: Create colors configuration in lib/colors.ts**

Port from `app.js` lines 58-77 (choropleth configs) and `index.html` lines 152-160 (party colors):

```typescript
// lib/colors.ts
import { ChoroplethConfig, ChoroplethMetric, District, Ward } from "./types";

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
};

export function getPartyColor(party: string): string {
  const p = party.toLowerCase();
  for (const [key, color] of Object.entries(PARTY_COLORS)) {
    if (p.includes(key)) return color;
  }
  return "#777";
}

export const CHOROPLETH_CONFIGS: Record<ChoroplethMetric, ChoroplethConfig> = {
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
    key: (d) => (d.housing ? d.housing.median_house_price : null),
    wardKey: null,
    min: 120000,
    max: 210000,
    color: [140, 80, 30],
  },
  crime_rate: {
    label: "Crime Rate per 1,000",
    key: (d) => (d.crime ? d.crime.rate_per_1000 : null),
    wardKey: null,
    min: 20,
    max: 80,
    color: [160, 30, 30],
  },
  degree_pct: {
    label: "% Degree-Educated",
    key: (d) => (d.education ? d.education.degree_plus_pct : null),
    wardKey: (w) => (w ? w.level_4_plus_pct : null),
    min: 18,
    max: 40,
    wardMin: 5,
    wardMax: 65,
    color: [30, 80, 160],
  },
  no_car_pct: {
    label: "% Households No Car",
    key: (d) => (d.transport ? d.transport.no_car_pct : null),
    wardKey: (w) => (w ? w.no_cars_pct : null),
    min: 10,
    max: 40,
    wardMin: 0,
    wardMax: 60,
    color: [100, 60, 140],
  },
  catholic_pct: {
    label: "% Catholic Background",
    key: (d) => (d.demographics ? d.demographics.catholic_pct : null),
    wardKey: (w) => (w ? w.catholic_pct : null),
    min: 8,
    max: 75,
    wardMin: 0,
    wardMax: 100,
    color: [40, 120, 60],
  },
  protestant_pct: {
    label: "% Protestant / Other Christian",
    key: (d) =>
      d.demographics ? d.demographics.protestant_other_christian_pct : null,
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
```

- [ ] **Step 4: Commit**

```bash
git add lib/
git commit -m "feat: add TypeScript types, utilities, and color configuration"
```

---

## Task 3: Convert Data Files

**Files:**
- Create: `data/districts.ts`, `data/ni-overall.ts`, `data/geo-districts.json`
- Create: `data/wards/antrim-newtownabbey.json`, `data/wards/ards-north-down.json`, `data/wards/armagh-banbridge-craigavon.json`, `data/wards/belfast.json`, `data/wards/causeway-coast-glens.json`, `data/wards/derry-strabane.json`, `data/wards/fermanagh-omagh.json`, `data/wards/lisburn-castlereagh.json`, `data/wards/mid-east-antrim.json`, `data/wards/mid-ulster.json`, `data/wards/newry-mourne-down.json`
- Create: `scripts/convert-data.ts` (one-time conversion script)

**Strategy:** Write a Node.js script that reads the existing JS data files and outputs the new typed format. This is more reliable than hand-converting 19K+ lines of data.

- [ ] **Step 1: Create the data conversion script**

```typescript
// scripts/convert-data.ts
// One-time script to convert vanilla JS data files into typed TS/JSON format.
// Run with: npx tsx scripts/convert-data.ts

import * as fs from "fs";
import * as path from "path";

// Load existing data by evaluating the JS files
const geoDataContent = fs.readFileSync(
  path.join(__dirname, "../geo-data.js"),
  "utf-8"
);
const statsDataContent = fs.readFileSync(
  path.join(__dirname, "../stats-data.js"),
  "utf-8"
);
const wardStatsContent = fs.readFileSync(
  path.join(__dirname, "../ward-stats.js"),
  "utf-8"
);

// Execute in a sandboxed context
const vm = require("vm");
const context: Record<string, unknown> = {};
vm.createContext(context);
vm.runInContext(geoDataContent, context);
vm.runInContext(statsDataContent, context);
vm.runInContext(wardStatsContent, context);

const LGD_GEO = context.LGD_GEO as GeoJSON.FeatureCollection;
const WARDS_GEO = context.WARDS_GEO as GeoJSON.FeatureCollection;
const STATS_DATA = context.STATS_DATA as {
  ni_overall: Record<string, number>;
  districts: Record<string, Record<string, unknown>>;
};
const WARD_STATS = context.WARD_STATS as Record<
  string,
  Record<string, Record<string, unknown>>
>;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// === 1. Write ni-overall.ts ===
const niOverall = STATS_DATA.ni_overall;
fs.writeFileSync(
  path.join(__dirname, "../data/ni-overall.ts"),
  `import { NIOverall } from "@/lib/types";\n\nexport const NI_OVERALL: NIOverall = ${JSON.stringify(niOverall, null, 2)};\n`
);
console.log("✓ data/ni-overall.ts");

// === 2. Write districts.ts ===
const districts = Object.entries(STATS_DATA.districts).map(([_key, d]) => ({
  ...d,
  slug: slugify(d.name as string),
}));
fs.writeFileSync(
  path.join(__dirname, "../data/districts.ts"),
  `import { District } from "@/lib/types";\n\nexport const DISTRICTS: District[] = ${JSON.stringify(districts, null, 2)};\n`
);
console.log(`✓ data/districts.ts (${districts.length} districts)`);

// === 3. Write geo-districts.json ===
fs.writeFileSync(
  path.join(__dirname, "../data/geo-districts.json"),
  JSON.stringify(LGD_GEO)
);
console.log("✓ data/geo-districts.json");

// === 4. Write ward files (one per LGD) ===
fs.mkdirSync(path.join(__dirname, "../data/wards"), { recursive: true });

for (const [lgdName, wards] of Object.entries(WARD_STATS)) {
  const lgdSlug = slugify(lgdName);

  // Get GeoJSON features for this LGD
  const geoFeatures = WARDS_GEO.features.filter(
    (f: GeoJSON.Feature) => f.properties?.lgd === lgdName
  );

  // Build ward objects with geometry merged
  const wardList = Object.entries(wards).map(([wardName, wardData]) => {
    const geoFeature = geoFeatures.find(
      (f: GeoJSON.Feature) => f.properties?.name === wardName
    );

    return {
      ...wardData,
      name: wardName,
      slug: slugify(wardName),
      lgd: lgdName,
      geometry: geoFeature?.geometry || null,
    };
  });

  const wardFile = {
    lgd: lgdName,
    lgdSlug,
    wards: wardList,
  };

  fs.writeFileSync(
    path.join(__dirname, `../data/wards/${lgdSlug}.json`),
    JSON.stringify(wardFile)
  );
  console.log(`✓ data/wards/${lgdSlug}.json (${wardList.length} wards)`);
}

console.log("\nDone! All data files converted.");
```

- [ ] **Step 2: Install tsx and run the conversion script**

```bash
npm install -D tsx
npx tsx scripts/convert-data.ts
```

Expected: 13 files created (ni-overall.ts, districts.ts, geo-districts.json, 11 ward JSON files). Console shows ward counts per district.

- [ ] **Step 3: Verify output files exist and have correct structure**

```bash
ls -la data/wards/
head -c 200 data/districts.ts
head -c 200 data/wards/belfast.json
```

Expected: 11 ward JSON files. districts.ts starts with import and array. belfast.json starts with `{"lgd":"Belfast"`.

- [ ] **Step 4: Commit**

```bash
git add data/ scripts/convert-data.ts
git commit -m "feat: convert data files to typed TypeScript and split ward JSON"
```

---

## Task 4: Map Provider and State Hooks

**Files:**
- Create: `hooks/useMapState.ts`, `hooks/useChoropleth.ts`, `hooks/useComparison.ts`, `components/MapProvider.tsx`

- [ ] **Step 1: Create useMapState hook**

```typescript
// hooks/useMapState.ts
"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";
import type { MapView, WardWithGeometry } from "@/lib/types";

interface WardCache {
  wards: WardWithGeometry[];
  geoJSON: GeoJSON.FeatureCollection;
}

interface MapState {
  currentView: MapView;
  selectedDistrict: string | null;
  selectedWard: string | null;
  wardCache: Map<string, WardCache>;
  isLoadingWards: boolean;
}

interface MapStateActions {
  setView: (view: MapView) => void;
  selectDistrict: (slug: string | null) => void;
  selectWard: (slug: string | null) => void;
  loadWardData: (lgdSlug: string) => Promise<WardCache | null>;
  setLoadingWards: (loading: boolean) => void;
}

export type MapStateContextType = MapState & MapStateActions;

export const MapStateContext = createContext<MapStateContextType | null>(null);

export function useMapState(): MapStateContextType {
  const ctx = useContext(MapStateContext);
  if (!ctx) throw new Error("useMapState must be used within MapProvider");
  return ctx;
}

export function useMapStateProvider(): MapStateContextType {
  const [currentView, setCurrentView] = useState<MapView>("districts");
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedWard, setSelectedWard] = useState<string | null>(null);
  const [isLoadingWards, setIsLoadingWards] = useState(false);
  const wardCacheRef = useRef<Map<string, WardCache>>(new Map());

  const loadWardData = useCallback(async (lgdSlug: string): Promise<WardCache | null> => {
    if (wardCacheRef.current.has(lgdSlug)) {
      return wardCacheRef.current.get(lgdSlug)!;
    }

    setIsLoadingWards(true);
    try {
      const res = await fetch(`/data/wards/${lgdSlug}.json`);
      if (!res.ok) throw new Error(`Failed to load ward data for ${lgdSlug}`);
      const data = await res.json();

      const geoJSON: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: data.wards
          .filter((w: WardWithGeometry) => w.geometry)
          .map((w: WardWithGeometry) => ({
            type: "Feature",
            properties: { name: w.name, slug: w.slug, lgd: w.lgd },
            geometry: w.geometry,
          })),
      };

      const cache: WardCache = { wards: data.wards, geoJSON };
      wardCacheRef.current.set(lgdSlug, cache);
      return cache;
    } catch (err) {
      console.error("Failed to load ward data:", err);
      return null;
    } finally {
      setIsLoadingWards(false);
    }
  }, []);

  return {
    currentView,
    selectedDistrict,
    selectedWard,
    wardCache: wardCacheRef.current,
    isLoadingWards,
    setView: setCurrentView,
    selectDistrict: setSelectedDistrict,
    selectWard: setSelectedWard,
    loadWardData,
    setLoadingWards: setIsLoadingWards,
  };
}
```

- [ ] **Step 2: Create useChoropleth hook**

```typescript
// hooks/useChoropleth.ts
"use client";

import { createContext, useContext, useState } from "react";
import type { ChoroplethMetric } from "@/lib/types";

interface ChoroplethState {
  metric: ChoroplethMetric | null;
  setMetric: (metric: ChoroplethMetric | null) => void;
}

export const ChoroplethContext = createContext<ChoroplethState | null>(null);

export function useChoropleth(): ChoroplethState {
  const ctx = useContext(ChoroplethContext);
  if (!ctx) throw new Error("useChoropleth must be used within MapProvider");
  return ctx;
}

export function useChoroplethProvider(): ChoroplethState {
  const [metric, setMetric] = useState<ChoroplethMetric | null>(null);
  return { metric, setMetric };
}
```

- [ ] **Step 3: Create useComparison hook**

```typescript
// hooks/useComparison.ts
"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface ComparisonState {
  isComparing: boolean;
  selections: string[];
  toggleCompareMode: () => void;
  addSelection: (slug: string) => void;
  clearSelections: () => void;
}

export const ComparisonContext = createContext<ComparisonState | null>(null);

export function useComparison(): ComparisonState {
  const ctx = useContext(ComparisonContext);
  if (!ctx) throw new Error("useComparison must be used within MapProvider");
  return ctx;
}

export function useComparisonProvider(): ComparisonState {
  const [isComparing, setIsComparing] = useState(false);
  const [selections, setSelections] = useState<string[]>([]);

  const toggleCompareMode = useCallback(() => {
    setIsComparing((prev) => {
      if (prev) setSelections([]);
      return !prev;
    });
  }, []);

  const addSelection = useCallback((slug: string) => {
    setSelections((prev) => {
      if (prev.includes(slug)) return prev;
      if (prev.length >= 2) return prev;
      return [...prev, slug];
    });
  }, []);

  const clearSelections = useCallback(() => {
    setSelections([]);
  }, []);

  return { isComparing, selections, toggleCompareMode, addSelection, clearSelections };
}
```

- [ ] **Step 4: Create MapProvider component**

```typescript
// components/MapProvider.tsx
"use client";

import { ReactNode } from "react";
import { MapStateContext, useMapStateProvider } from "@/hooks/useMapState";
import { ChoroplethContext, useChoroplethProvider } from "@/hooks/useChoropleth";
import { ComparisonContext, useComparisonProvider } from "@/hooks/useComparison";

export function MapProvider({ children }: { children: ReactNode }) {
  const mapState = useMapStateProvider();
  const choropleth = useChoroplethProvider();
  const comparison = useComparisonProvider();

  return (
    <MapStateContext.Provider value={mapState}>
      <ChoroplethContext.Provider value={choropleth}>
        <ComparisonContext.Provider value={comparison}>
          {children}
        </ComparisonContext.Provider>
      </ChoroplethContext.Provider>
    </MapStateContext.Provider>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add hooks/ components/MapProvider.tsx
git commit -m "feat: add state hooks and MapProvider context"
```

---

## Task 5: Map Container with District Layer

**Files:**
- Create: `components/Map/MapContainer.tsx`, `components/Map/DistrictLayer.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Create MapContainer**

This wraps the Leaflet map with `"use client"` and dynamic import (no SSR).

```typescript
// components/Map/MapContainer.tsx
"use client";

import { useEffect, useRef } from "react";
import { MapContainer as LeafletMap, TileLayer, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const NI_CENTER: [number, number] = [54.6, -7.0];
const NI_BOUNDS: [[number, number], [number, number]] = [
  [53.9, -8.3],
  [55.45, -5.3],
];

export default function MapContainer({ children }: { children?: React.ReactNode }) {
  return (
    <LeafletMap
      center={NI_CENTER}
      zoom={8}
      minZoom={7}
      maxZoom={15}
      maxBounds={[
        [53.5, -9.0],
        [55.8, -4.5],
      ]}
      maxBoundsViscosity={1.0}
      zoomControl={false}
      attributionControl={true}
      className="absolute inset-0 z-[1]"
      style={{ background: "#1a1a1a" }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        subdomains="abcd"
        maxZoom={19}
      />
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={19}
        pane="overlayPane"
      />
      <ZoomControl position="topright" />
      {children}
    </LeafletMap>
  );
}
```

- [ ] **Step 2: Create DistrictLayer**

```typescript
// components/Map/DistrictLayer.tsx
"use client";

import { useCallback } from "react";
import { GeoJSON, useMap } from "react-leaflet";
import type { Layer, LeafletMouseEvent, PathOptions } from "leaflet";
import type { Feature } from "geojson";
import { useMapState } from "@/hooks/useMapState";
import { useChoropleth } from "@/hooks/useChoropleth";
import { useComparison } from "@/hooks/useComparison";
import { DISTRICTS } from "@/data/districts";
import { CHOROPLETH_CONFIGS, getChoroplethColor } from "@/lib/colors";
import { slugify } from "@/lib/utils";
import geoDistricts from "@/data/geo-districts.json";

const DEFAULT_STYLE: PathOptions = {
  color: "#555",
  weight: 1.5,
  fillColor: "#333",
  fillOpacity: 0.6,
};

const HOVER_STYLE: PathOptions = {
  color: "#888",
  weight: 2.5,
  fillColor: "#444",
  fillOpacity: 0.7,
};

export default function DistrictLayer() {
  const map = useMap();
  const { setView, selectDistrict, loadWardData, currentView } = useMapState();
  const { metric } = useChoropleth();
  const { isComparing, addSelection } = useComparison();

  const getStyle = useCallback(
    (feature?: Feature): PathOptions => {
      if (!feature || !metric) return DEFAULT_STYLE;
      const config = CHOROPLETH_CONFIGS[metric];
      const district = DISTRICTS.find(
        (d) => d.name === feature.properties?.name
      );
      if (!district) return DEFAULT_STYLE;
      const val = config.key(district);
      return {
        fillColor: getChoroplethColor(val, config.color, config.min, config.max),
        fillOpacity: 0.75,
        color: "#555",
        weight: 1.5,
      };
    },
    [metric]
  );

  const onEachFeature = useCallback(
    (feature: Feature, layer: Layer) => {
      layer.on({
        mouseover: (e: LeafletMouseEvent) => {
          if (metric) {
            e.target.setStyle({ weight: 2.5, color: "#aaa", fillOpacity: 0.85 });
          } else {
            e.target.setStyle(HOVER_STYLE);
          }
          e.target.bringToFront();
        },
        mouseout: (e: LeafletMouseEvent) => {
          e.target.setStyle(getStyle(feature));
        },
        click: async (e: LeafletMouseEvent) => {
          const name = feature.properties?.name;
          if (!name) return;
          const slug = slugify(name);

          if (isComparing) {
            addSelection(slug);
            return;
          }

          selectDistrict(slug);
          setView("district-detail");

          // Fly to district bounds
          const bounds = e.target.getBounds();
          map.flyToBounds(bounds, { padding: [40, 40], duration: 0.8 });

          // Load ward data
          await loadWardData(slug);
        },
      });
    },
    [metric, isComparing, getStyle, map, setView, selectDistrict, loadWardData, addSelection]
  );

  if (currentView !== "districts") return null;

  return (
    <GeoJSON
      key={`districts-${metric || "default"}`}
      data={geoDistricts as GeoJSON.FeatureCollection}
      style={getStyle}
      onEachFeature={onEachFeature}
    />
  );
}
```

- [ ] **Step 3: Create dynamic map wrapper and update home page**

```typescript
// app/page.tsx
"use client";

import dynamic from "next/dynamic";
import { MapProvider } from "@/components/MapProvider";

const MapContainer = dynamic(() => import("@/components/Map/MapContainer"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-[var(--bg-primary)] flex items-center justify-center">
      <div className="text-[var(--text-secondary)]">Loading map...</div>
    </div>
  ),
});

const DistrictLayer = dynamic(
  () => import("@/components/Map/DistrictLayer"),
  { ssr: false }
);

export default function Home() {
  return (
    <MapProvider>
      <MapContainer>
        <DistrictLayer />
      </MapContainer>
    </MapProvider>
  );
}
```

- [ ] **Step 4: Verify the map renders with district boundaries**

```bash
npm run dev
```

Expected: Map loads at http://localhost:3000 with dark CartoDB basemap and 11 district boundaries visible. Hovering highlights districts. Clicking zooms in (but no ward layer or panel yet).

- [ ] **Step 5: Commit**

```bash
git add components/Map/ app/page.tsx
git commit -m "feat: add Leaflet map with district layer and drill-down"
```

---

## Task 6: Chart Components

**Files:**
- Create: `components/Charts/DonutChart.tsx`, `components/Charts/BarChart.tsx`, `components/Charts/StackedBar.tsx`

- [ ] **Step 1: Create DonutChart**

Port SVG donut logic from `app.js` lines 345-361, rebuilt with Recharts:

```typescript
// components/Charts/DonutChart.tsx
"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export default function DonutChart({
  segments,
  size = 90,
}: {
  segments: DonutSegment[];
  size?: number;
}) {
  return (
    <div className="flex items-center justify-center gap-4 my-2.5">
      <div style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={segments}
              dataKey="value"
              innerRadius="55%"
              outerRadius="90%"
              startAngle={90}
              endAngle={-270}
              strokeWidth={0}
              aria-label={segments
                .map((s) => `${s.label}: ${s.value.toFixed(1)}%`)
                .join(", ")}
            >
              {segments.map((s, i) => (
                <Cell key={i} fill={s.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-col gap-1">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
            <div
              className="w-[9px] h-[9px] rounded-full shrink-0"
              style={{ background: s.color }}
            />
            {s.label}: {s.value}%
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create BarChart**

Port from `app.js` lines 363-376:

```typescript
// components/Charts/BarChart.tsx
"use client";

import { fmtPct } from "@/lib/utils";

interface BarItem {
  label: string;
  value: number;
  color?: string;
  display?: string;
}

export default function BarChart({
  items,
  maxOverride,
}: {
  items: BarItem[];
  maxOverride?: number;
}) {
  const maxVal = maxOverride || Math.max(...items.map((i) => i.value));

  return (
    <div className="mt-1.5" role="img" aria-label={items.map((i) => `${i.label}: ${i.display || fmtPct(i.value)}`).join(", ")}>
      {items.map((item, i) => {
        const w = maxVal > 0 ? ((item.value / maxVal) * 100).toFixed(1) : "0";
        return (
          <div key={i} className="flex items-center mb-1.5 gap-2">
            <div className="text-[11px] text-[var(--text-secondary)] w-[90px] shrink-0 text-right overflow-hidden text-ellipsis whitespace-nowrap">
              {item.label}
            </div>
            <div className="flex-1 h-[18px] bg-[var(--border-light)] rounded-[3px] overflow-hidden">
              <div
                className="h-full rounded-[3px] transition-[width] duration-600 min-w-[2px]"
                style={{ width: `${w}%`, background: item.color || "var(--accent)" }}
              />
            </div>
            <div className="text-[11px] text-[#ccc] w-[42px] text-right shrink-0">
              {item.display || fmtPct(item.value)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Create StackedBar**

Port from `app.js` lines 378-390:

```typescript
// components/Charts/StackedBar.tsx
"use client";

import { fmtPct } from "@/lib/utils";

interface StackedSegment {
  label: string;
  pct: number;
  color: string;
}

export default function StackedBar({
  segments,
}: {
  segments: StackedSegment[];
}) {
  return (
    <div role="img" aria-label={segments.map((s) => `${s.label}: ${fmtPct(s.pct)}`).join(", ")}>
      <div className="flex h-3.5 rounded-[3px] overflow-hidden">
        {segments.map((s, i) => (
          <div
            key={i}
            className="h-full transition-[width] duration-500"
            style={{ width: `${s.pct}%`, background: s.color }}
            title={`${s.label}: ${s.pct}%`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mt-1.5">
        {segments.map((s, i) => (
          <div
            key={i}
            className="flex items-center gap-1 text-[10.5px] text-[var(--text-secondary)]"
          >
            <div
              className="w-2 h-2 rounded-sm shrink-0"
              style={{ background: s.color }}
            />
            {s.label}: {fmtPct(s.pct)}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add components/Charts/
git commit -m "feat: add DonutChart, BarChart, and StackedBar components"
```

---

## Task 7: Stats Panel Shell and Tab Components

**Files:**
- Create: `components/StatsPanel/StatsPanel.tsx`, `components/StatsPanel/OverviewTab.tsx`, `components/StatsPanel/DemographicsTab.tsx`, `components/StatsPanel/HousingTab.tsx`, `components/StatsPanel/HealthTab.tsx`, `components/StatsPanel/CrimeTab.tsx`, `components/StatsPanel/EducationTab.tsx`, `components/StatsPanel/TransportTab.tsx`
- Create: `components/ui/StatCard.tsx`, `components/ui/StatRow.tsx`, `components/ui/DeprivationMeter.tsx`

This is a large task. The implementer should port each tab builder function from `app.js` (lines 427-924) into its own React component, replacing innerHTML string concatenation with JSX. Each tab component receives typed district or ward data as props.

**Key patterns to follow:**
- Each tab receives either `District` or `Ward` data (use a union type or separate components)
- Use `StatCard` for the big number cards, `StatRow` for label/value rows
- Use `DeprivationMeter` for the gradient meter with marker
- Use the Chart components from Task 6
- Use `getPartyColor()` from `lib/colors.ts` for election bars
- Use `fmt()`, `fmtPct()`, `fmtMoney()` from `lib/utils.ts`

**StatsPanel.tsx** should:
- Accept `isOpen`, `onClose`, `title`, `subtitle`, `tabs` props
- Render the slide-in panel (desktop: 480px from right, tablet: 360px)
- Handle tab switching with `role="tablist"` / `role="tab"` / `role="tabpanel"` ARIA
- Close button with `aria-label="Close stats panel"`
- Escape key closes panel

- [ ] **Step 1: Create shared UI components (StatCard, StatRow, DeprivationMeter)**

Port the stat card/row markup from the existing tab builders:

```typescript
// components/ui/StatCard.tsx
export function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-[var(--bg-card)] rounded-md p-3 text-center border border-[var(--border-light)]">
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-[10px] text-[var(--text-secondary)] mt-1 uppercase tracking-wider">{label}</div>
    </div>
  );
}
```

```typescript
// components/ui/StatRow.tsx
export function StatRow({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex justify-between items-center py-1.5">
      <span className="text-[12.5px] text-[var(--text-secondary)]">{label}</span>
      <span className={`text-[13px] font-semibold text-[var(--text-primary)] ${className || ""}`}>{value}</span>
    </div>
  );
}
```

```typescript
// components/ui/DeprivationMeter.tsx
export function DeprivationMeter({ position }: { position: number }) {
  return (
    <div className="mt-1.5">
      <div className="w-full h-2.5 rounded-full relative my-1.5"
           style={{ background: "linear-gradient(to right, #2d5a27, #8B8B00, #c62828)" }}>
        <div
          className="absolute -top-[3px] w-1 h-4 bg-white rounded-sm shadow-md"
          style={{ left: `${position}%`, transform: "translateX(-50%)" }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
        <span>Least deprived</span>
        <span>Most deprived</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create StatsPanel shell with tab switching**

```typescript
// components/StatsPanel/StatsPanel.tsx
"use client";

import { useState, useEffect, ReactNode } from "react";

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

interface StatsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  tabs: Tab[];
}

export default function StatsPanel({ isOpen, onClose, title, subtitle, tabs }: StatsPanelProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || "");

  useEffect(() => {
    if (tabs.length > 0 && !tabs.find((t) => t.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  return (
    <div
      className={`fixed top-0 z-[1001] h-screen bg-[var(--bg-panel)] border-l border-[var(--border)] overflow-y-auto transition-[right] duration-[350ms] ease-[cubic-bezier(0.4,0,0.2,1)] shadow-[-4px_0_20px_rgba(0,0,0,0.4)] w-[480px] lg:w-[480px] md:w-[360px] max-sm:w-screen scrollbar-thin scrollbar-track-[var(--bg-panel)] scrollbar-thumb-[#444] ${isOpen ? "right-0" : "right-[-480px] max-sm:right-[-100vw] md:right-[-360px]"}`}
    >
      <button
        onClick={onClose}
        aria-label="Close stats panel"
        className="sticky top-0 right-0 float-right bg-[var(--bg-panel)] border-none text-[var(--text-secondary)] text-[22px] cursor-pointer w-10 h-10 flex items-center justify-center rounded z-[2] hover:bg-[var(--border)] hover:text-white"
      >
        &times;
      </button>

      <div className="px-5 py-3 border-b border-[var(--border-light)]">
        {subtitle && (
          <div className="text-[11px] text-[var(--text-secondary)] uppercase tracking-wider mb-1">
            {subtitle}
          </div>
        )}
        <h2 className="text-lg font-semibold text-white mr-8">{title}</h2>
      </div>

      <div
        className="flex border-b border-[var(--border-light)] bg-[var(--bg-panel)] sticky top-0 z-[1] overflow-x-auto"
        role="tablist"
        style={{ scrollbarWidth: "none" }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2.5 text-[11px] border-b-2 cursor-pointer font-inherit whitespace-nowrap uppercase tracking-wider transition-colors ${
              activeTab === tab.id
                ? "text-[var(--accent-light)] border-[var(--accent)]"
                : "text-[#777] border-transparent hover:text-[#aaa]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={`tabpanel-${tab.id}`}
          role="tabpanel"
          hidden={activeTab !== tab.id}
        >
          {tab.content}
        </div>
      ))}

      <div className="px-5 py-3 text-[10px] text-[var(--text-muted)] leading-relaxed">
        Source: NISRA Census 2021, NIMDM 2017, NISRA Health Inequalities 2024,
        ASHE 2024, NI Electoral Office 2022, PSNI, LPS, Ofcom.
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create each tab component**

Create all 7 tab components, porting the logic from the existing tab builder functions. Each receives typed data as props. The implementer should reference:
- `buildOverviewTab()` → `OverviewTab.tsx` (app.js lines 427-494)
- `buildDemographicsTab()` → `DemographicsTab.tsx` (lines 497-546)
- `buildHousingTab()` → `HousingTab.tsx` (lines 549-573)
- `buildHealthTab()` → `HealthTab.tsx` (lines 575-621)
- `buildCrimeTab()` → `CrimeTab.tsx` (lines 623-651)
- `buildEducationTab()` → `EducationTab.tsx` (lines 654-678)
- `buildTransportTab()` → `TransportTab.tsx` (lines 681-708)

Each tab should also have a ward variant. For the ward versions, reference:
- `buildWardOverviewTab()` (lines 761-813)
- `buildWardDemographicsTab()` (lines 816-841)
- `buildWardHousingTab()` (lines 843-860)
- `buildWardHealthTab()` (lines 862-877)
- `buildWardEducationTab()` (lines 880-900)
- `buildWardTransportTab()` (lines 903-923)

Use a `mode: "district" | "ward"` prop or separate components. Each tab wraps its content in `<div className="px-5 py-3.5 border-b border-[var(--border-light)]">` sections with `<h3>` headings in uppercase muted style.

- [ ] **Step 4: Commit**

```bash
git add components/StatsPanel/ components/ui/
git commit -m "feat: add StatsPanel with all tab components"
```

---

## Task 8: Wire District Click to Stats Panel

**Files:**
- Modify: `app/page.tsx`, `components/Map/DistrictLayer.tsx`

- [ ] **Step 1: Add panel state and render StatsPanel in page.tsx**

Update `app/page.tsx` to include the StatsPanel. The panel opens when a district is selected via the DistrictLayer click handler (already wired in Task 5). Add a `panelOpen` state and connect it to the stats panel.

The page should:
- Track `panelOpen` boolean state
- Look up the selected district from `useMapState().selectedDistrict`
- Find the matching `District` object from `DISTRICTS` array
- Build the tabs array from the district data
- Pass to `StatsPanel`

- [ ] **Step 2: Add title overlay and control buttons**

Port the UI overlays from `index.html` lines 240-270:
- Title overlay ("The Big Dirty NI Map") top-right
- Compare button top-left
- Back button (visible when drilled into district)

- [ ] **Step 3: Verify clicking a district opens the stats panel**

```bash
npm run dev
```

Expected: Click Belfast → map zooms in, stats panel slides in from right with 7 tabs. All tab content renders with real data. Close button and Escape key dismiss panel.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx components/
git commit -m "feat: wire district click to stats panel with all tabs"
```

---

## Task 9: Ward Layer and Ward Stats

**Files:**
- Create: `components/Map/WardLayer.tsx`

- [ ] **Step 1: Create WardLayer component**

Port from `app.js` lines 203-247. Renders ward GeoJSON when `currentView` is `"district-detail"` or `"ward-detail"`. Uses ward data from the cache loaded in the drill-down click.

Hover and click behavior mirrors DistrictLayer but:
- Click opens ward stats panel (6 tabs, no Crime)
- No further drill-down from wards
- Choropleth uses `wardKey`, `wardMin`, `wardMax` from config

- [ ] **Step 2: Add WardLayer to the map**

Import and render `WardLayer` in `app/page.tsx` alongside `DistrictLayer`.

- [ ] **Step 3: Wire ward click to StatsPanel with ward tabs**

When a ward is clicked, look up ward data from the cached ward array, build 6 tabs (Overview, Demographics, Housing, Health, Education, Transport — no Crime), and open the StatsPanel.

- [ ] **Step 4: Add back button navigation**

Port from `app.js` lines 260-268. Back button resets view to districts, removes ward layer, flies back to NI bounds.

- [ ] **Step 5: Verify drill-down flow**

```bash
npm run dev
```

Expected: Click district → wards appear → click ward → ward stats panel opens with 6 tabs. Back button returns to district view.

- [ ] **Step 6: Commit**

```bash
git add components/Map/WardLayer.tsx app/page.tsx
git commit -m "feat: add ward layer with drill-down and ward stats panel"
```

---

## Task 10: Choropleth Controls and Legend

**Files:**
- Create: `components/Map/ChoroplethControls.tsx`, `components/ui/Legend.tsx`

- [ ] **Step 1: Create ChoroplethControls dropdown**

Port from `index.html` lines 245-258 and `app.js` lines 79-136. A dropdown that sets the choropleth metric via `useChoropleth().setMetric()`. The DistrictLayer and WardLayer already read `metric` and apply styles.

- [ ] **Step 2: Create Legend component**

Port from `index.html` lines 261-265. Shows the color gradient bar with min/max labels. Only visible when a choropleth metric is active. Uses the per-metric color and range from `CHOROPLETH_CONFIGS`.

- [ ] **Step 3: Add both to page.tsx**

Position the choropleth controls top-right (below title), legend bottom-right.

- [ ] **Step 4: Verify choropleth coloring**

Select "Population Density" from dropdown. Districts should color by density. Drill into a district — wards should color if the metric has a `wardKey`.

- [ ] **Step 5: Commit**

```bash
git add components/Map/ChoroplethControls.tsx components/ui/Legend.tsx app/page.tsx
git commit -m "feat: add choropleth controls with 9 metrics and legend"
```

---

## Task 11: Comparison Mode

**Files:**
- Create: `components/ComparePanel.tsx`

- [ ] **Step 1: Create ComparePanel**

Port from `app.js` lines 272-308 (toggle/selection UI) and lines 926-993 (comparison table). Two phases:
1. Selection phase: bottom bar shows "Click two districts to compare" / "Now click a second district"
2. Results phase: stats panel opens with side-by-side comparison rows, green/red delta highlighting

Use `useComparison()` hook for state.

- [ ] **Step 2: Wire compare button and integrate with DistrictLayer**

The compare button toggles `useComparison().toggleCompareMode()`. DistrictLayer already checks `isComparing` and calls `addSelection()` on click.

- [ ] **Step 3: Verify comparison flow**

Click Compare → click Belfast → "Now click a second district" → click Derry → comparison panel shows side-by-side stats with green/red highlighting.

- [ ] **Step 4: Commit**

```bash
git add components/ComparePanel.tsx app/page.tsx
git commit -m "feat: add district comparison mode with side-by-side stats"
```

---

## Task 12: Search Bar

**Files:**
- Create: `components/Search.tsx`

- [ ] **Step 1: Create Search component**

Client-side typeahead filtering over all district names + ward names (~473 items). Districts are always in the search index. Ward names are added to the index as ward data is loaded into the cache.

Features:
- Text input with search icon, positioned top-left (below compare button on desktop, floating icon on mobile)
- Debounced filtering (100ms)
- Dropdown shows up to 10 matches, grouped by type (Districts / Wards)
- Click a result → navigate to that district/ward (update URL, fly map, open panel)
- Escape or click outside closes dropdown
- `aria-label="Search districts and wards"`, `role="combobox"`, `aria-expanded`

- [ ] **Step 2: Integrate with page.tsx**

- [ ] **Step 3: Verify search**

Type "belf" → shows "Belfast" under Districts. Type "bally" → shows ward matches. Click a result → navigates to it.

- [ ] **Step 4: Commit**

```bash
git add components/Search.tsx app/page.tsx
git commit -m "feat: add search bar with typeahead for districts and wards"
```

---

## Task 13: Hover Tooltips

**Files:**
- Create: `components/Map/Tooltip.tsx`
- Modify: `components/Map/DistrictLayer.tsx`, `components/Map/WardLayer.tsx`

- [ ] **Step 1: Create Tooltip component**

A positioned div that follows the cursor on mouseover. Shows:
- District/ward name
- Active choropleth metric value (if any)

Uses a portal or absolute positioning relative to the map container.

- [ ] **Step 2: Wire tooltip to DistrictLayer and WardLayer mouseover events**

On mouseover, set tooltip content and position. On mouseout, hide tooltip.

- [ ] **Step 3: Verify tooltips**

Hover over Belfast → tooltip shows "Belfast". With choropleth active, also shows the metric value.

- [ ] **Step 4: Commit**

```bash
git add components/Map/Tooltip.tsx components/Map/DistrictLayer.tsx components/Map/WardLayer.tsx
git commit -m "feat: add hover tooltips showing name and choropleth value"
```

---

## Task 14: Mobile Bottom Sheet

**Files:**
- Create: `components/StatsPanel/BottomSheet.tsx`
- Modify: `components/StatsPanel/StatsPanel.tsx`

- [ ] **Step 1: Create BottomSheet component**

Replaces the side panel on screens < 640px. Three snap points:
- Peek (~80px): drag handle + district name + population
- Half (~45vh): overview tab visible, map above
- Full (~90vh): all tabs, scrollable

Implementation:
- Track `snapPoint: "peek" | "half" | "full"` state
- Touch event listeners on the drag handle for swipe up/down
- CSS transitions between snap points
- Click the peek area to expand to half
- Swipe down from half to dismiss

- [ ] **Step 2: Modify StatsPanel to switch between side panel and bottom sheet**

Use a media query hook or Tailwind responsive classes. On `< 640px`, render BottomSheet. On `>= 640px`, render the slide-in panel.

- [ ] **Step 3: Verify on mobile viewport**

Open browser DevTools, set to 375px width. Click a district → bottom sheet appears at peek. Swipe up → half → full. Swipe down → dismiss.

- [ ] **Step 4: Commit**

```bash
git add components/StatsPanel/
git commit -m "feat: add mobile bottom sheet for stats panel"
```

---

## Task 15: URL Routing

**Files:**
- Create: `app/district/[slug]/page.tsx`, `app/ward/[lgd]/[slug]/page.tsx`
- Modify: `app/page.tsx`, `components/Map/DistrictLayer.tsx`, `components/Map/WardLayer.tsx`

- [ ] **Step 1: Create district route page**

```typescript
// app/district/[slug]/page.tsx
```

This page:
- Reads `slug` from params
- Renders the same map + panel as home, but initialized with `selectedDistrict` set and view set to `"district-detail"`
- Generates metadata: `{Name} — The Big Dirty NI Map`

- [ ] **Step 2: Create ward route page**

```typescript
// app/ward/[lgd]/[slug]/page.tsx
```

Same as district but initialized to `"ward-detail"` view with both district and ward selected.

- [ ] **Step 3: Update DistrictLayer and WardLayer clicks to use router.push**

Replace direct state updates with `router.push(`/district/${slug}`)` and `router.push(`/ward/${lgdSlug}/${wardSlug}`)`.

- [ ] **Step 4: Add generateStaticParams for static export**

Both route pages need `generateStaticParams()` so Next.js knows all possible slugs at build time (required for `output: "export"`).

- [ ] **Step 5: Verify URL routing**

Navigate to `/district/belfast` directly → map zooms to Belfast, panel opens. Navigate to `/ward/belfast/ballymacarrett` → zooms to ward, ward panel opens. Browser back button works.

- [ ] **Step 6: Commit**

```bash
git add app/district/ app/ward/ components/Map/
git commit -m "feat: add URL routing for districts and wards"
```

---

## Task 16: Accessibility Polish

**Files:**
- Modify: Multiple component files

- [ ] **Step 1: Add ARIA labels to all buttons**

- Back button: `aria-label="Return to all districts"`
- Compare button: `aria-label="Toggle comparison mode"`
- Search input: `aria-label="Search districts and wards"`
- Choropleth select: Add a proper `<label>` element
- Chart components: Verify `role="img"` and `aria-label` on all charts

- [ ] **Step 2: Add keyboard navigation**

- Tab through: search → choropleth dropdown → compare button → panel tabs
- Enter/Space activates buttons
- Arrow keys navigate tabs within tablist
- Escape closes panel/dropdown/search

- [ ] **Step 3: Add focus indicators**

Add `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]` to all interactive elements.

- [ ] **Step 4: Add aria-live region**

Add `<div aria-live="polite" className="sr-only">` that announces when a district/ward is selected.

- [ ] **Step 5: Verify with keyboard-only navigation**

Tab through the entire interface without a mouse. All controls reachable and activatable.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add accessibility — ARIA labels, keyboard nav, focus indicators"
```

---

## Task 17: Loading States and Error Handling

**Files:**
- Create: `components/ui/LoadingSkeleton.tsx`
- Modify: `components/Map/WardLayer.tsx`, `components/StatsPanel/StatsPanel.tsx`

- [ ] **Step 1: Create LoadingSkeleton component**

Animated pulse placeholders for the stats panel content (stat cards, bar charts, tab content).

- [ ] **Step 2: Show skeleton while ward data loads**

When `isLoadingWards` is true, show skeleton in the panel and a subtle loading indicator on the map.

- [ ] **Step 3: Add error states**

- Ward data fetch failure: "Couldn't load ward data. Tap to retry." with retry button
- Missing data: "No data available" instead of crash
- Invalid URL slug: redirect to `/`

- [ ] **Step 4: Commit**

```bash
git add components/ui/LoadingSkeleton.tsx components/
git commit -m "feat: add loading skeletons and error handling"
```

---

## Task 18: Responsive Polish

**Files:**
- Modify: `app/globals.css`, multiple components

- [ ] **Step 1: Add responsive breakpoints**

Verify all three breakpoints work:
- `< 640px`: Bottom sheet, stacked controls, search collapses to icon
- `640–1024px`: Narrower panel (360px), adjusted map padding
- `1024px+`: Full panel (480px)

- [ ] **Step 2: Enforce minimum touch targets**

All buttons and interactive elements must be minimum 44x44px on mobile.

- [ ] **Step 3: Enforce minimum font size**

No text smaller than 14px on mobile (increase from 10-12px in the current site).

- [ ] **Step 4: Move controls for mobile**

- Choropleth dropdown: bottom of screen (above bottom sheet)
- Search: floating icon, expands on tap
- Compare: comparison panel replaces bottom sheet

- [ ] **Step 5: Test at all breakpoints**

Open DevTools responsive mode. Test at 320px, 375px, 640px, 768px, 1024px, 1440px. Verify no overflow, all content readable, all controls accessible.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: responsive polish for mobile, tablet, and desktop"
```

---

## Task 19: Social Sharing and OG Metadata

**Files:**
- Modify: `app/layout.tsx`, `app/district/[slug]/page.tsx`, `app/ward/[lgd]/[slug]/page.tsx`
- Create: `public/og-image.png`, `app/favicon.ico`

- [ ] **Step 1: Add per-route metadata**

Root layout already has base metadata. Add `generateMetadata()` to district and ward pages:

```typescript
// app/district/[slug]/page.tsx
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const district = DISTRICTS.find((d) => d.slug === params.slug);
  const name = district?.name || "District";
  return {
    title: `${name} — The Big Dirty NI Map`,
    description: `Population, crime, housing, deprivation and more for ${name}`,
    openGraph: {
      title: `${name} — The Big Dirty NI Map`,
      description: `Population, crime, housing, deprivation and more for ${name}`,
      images: ["/og-image.png"],
    },
  };
}
```

- [ ] **Step 2: Create OG image**

Create a simple dark-background PNG (1200x630) with:
- NI map outline (extract from GeoJSON, render as SVG, convert to PNG)
- "The Big Dirty NI Map" title text
- Subtitle: "Interactive stats for all 462 wards"

- [ ] **Step 3: Add favicon**

Simple NI map outline or map pin icon as `app/favicon.ico`.

- [ ] **Step 4: Verify OG tags**

```bash
npm run build
```

Check the generated HTML files in `out/` for correct `<meta>` tags. Test with a social media preview tool.

- [ ] **Step 5: Commit**

```bash
git add public/ app/
git commit -m "feat: add OG metadata, social preview image, and favicon"
```

---

## Task 20: Build, Deploy, and Clean Up

**Files:**
- Modify: `.gitignore`, `next.config.ts`

- [ ] **Step 1: Verify production build**

```bash
npm run build
```

Expected: Build succeeds. Static files generated in `out/` directory. No TypeScript errors. Check bundle size is under 200KB gzipped.

- [ ] **Step 2: Copy ward data to public directory for static serving**

The ward JSON files need to be in `public/data/wards/` so they're accessible at runtime:

```bash
cp -r data/wards/ public/data/wards/
```

Update the fetch paths in `useMapState.ts` if needed.

- [ ] **Step 3: Test production build locally**

```bash
npx serve out
```

Open http://localhost:3000. Verify full flow: home → click district → wards load → click ward → stats panel → back → choropleth → search → compare.

- [ ] **Step 4: Update .gitignore**

```
.superpowers/
out/
node_modules/
.next/
```

- [ ] **Step 5: Update README.md**

Update the README to reflect the new stack, name ("The Big Dirty NI Map"), development instructions (`npm run dev`), and deployment info.

- [ ] **Step 6: Deploy to Vercel**

```bash
npx vercel --prod
```

Or connect the GitHub repo to Vercel for auto-deploy.

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "feat: production build, deployment config, and README update"
```

- [ ] **Step 8: Push to GitHub**

```bash
git push origin master
```

---

## Summary

| Task | Description | Depends On |
|------|-------------|------------|
| 1 | Scaffold Next.js project | — |
| 2 | TypeScript types and utilities | 1 |
| 3 | Convert data files | 1, 2 |
| 4 | Map Provider and state hooks | 1, 2 |
| 5 | Map container with district layer | 3, 4 |
| 6 | Chart components | 1, 2 |
| 7 | Stats panel and tab components | 2, 6 |
| 8 | Wire district click to stats panel | 5, 7 |
| 9 | Ward layer and ward stats | 5, 7 |
| 10 | Choropleth controls and legend | 5 |
| 11 | Comparison mode | 8 |
| 12 | Search bar | 3, 5 |
| 13 | Hover tooltips | 5 |
| 14 | Mobile bottom sheet | 7 |
| 15 | URL routing | 8, 9 |
| 16 | Accessibility polish | 8, 9, 10, 11, 12 |
| 17 | Loading states and error handling | 9 |
| 18 | Responsive polish | 14, 16 |
| 19 | Social sharing and OG metadata | 15 |
| 20 | Build, deploy, clean up | All |
