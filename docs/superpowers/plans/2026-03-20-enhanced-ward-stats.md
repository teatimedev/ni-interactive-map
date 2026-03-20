# Enhanced Ward Stats & Scoring Improvements

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the ward livability scoring system, add income rank to the score, add 2011-vs-2021 census trend data, add ward-level benefits claimant rates, and add a "similar wards" feature — all surfaced in the existing stats panel tabs.

**Architecture:** New ward data fields are added to `ward-stats.js` source, converted via the existing `convert-data.ts` pipeline into typed JSON. New scoring logic in `lib/scoring.ts`. New UI sections in existing tab components. No new pages or API routes — this is a data + display enrichment.

**Tech Stack:** Next.js 16, TypeScript, Recharts, existing CSS design system. Data sourced from NISRA Census 2021/2011, DfC benefits statistics, NIMDM 2017.

---

## File Structure

### New Files
- `lib/similarity.ts` — Ward similarity scoring algorithm
- `components/ui/SimilarWards.tsx` — "Wards like this one" card component
- `components/ui/TrendIndicator.tsx` — Small up/down arrow with % change

### Modified Files
- `ward-stats.js` — Add new fields: `benefits_claimant_pct`, `population_2011`, `no_qualifications_2011_pct`, `level_4_plus_2011_pct`, `bad_very_bad_health_2011_pct`, `owner_occupied_2011_pct`, `no_cars_2011_pct`
- `lib/types.ts` — Extend `Ward` interface with new fields
- `lib/scoring.ts` — Add income rank to livability score, rebalance weights
- `components/ui/StatRow.tsx` — Change `value` prop from `string` to `ReactNode` so trend indicators can be inlined
- `scripts/convert-data.ts` — No changes needed (already passes through all fields)
- `components/ui/WardRankCard.tsx` — Show income rank in domain breakdown, improve transparency
- `components/StatsPanel/OverviewTab.tsx` — Add population trend, similar wards section, preload ward data
- `components/StatsPanel/DemographicsTab.tsx` — Add 2011→2021 population change for wards
- `components/StatsPanel/EducationTab.tsx` — Add qualification trend arrows
- `components/StatsPanel/HealthTab.tsx` — Add health trend comparison
- `components/StatsPanel/HousingTab.tsx` — Add tenure trend comparison
- `components/StatsPanel/TransportTab.tsx` — Add car ownership trend

---

## Task 1: Add Income Rank to Livability Score

**Why:** Income rank exists in the data (`income_rank`) but isn't used in the livability score. Income is arguably the most tangible deprivation measure.

**Files:**
- Modify: `lib/scoring.ts`
- Modify: `components/ui/WardRankCard.tsx`

- [ ] **Step 1: Update WEIGHTS in scoring.ts**

Add income to the weights and rebalance. New weights:

```typescript
export const WEIGHTS = {
  deprivation: 0.20,    // was 0.25 — still heaviest but reduced
  income: 0.15,         // NEW — tangible deprivation measure
  health: 0.18,         // was 0.20
  education: 0.13,      // was 0.15
  crime: 0.13,          // was 0.15
  living_env: 0.12,     // was 0.15
  access: 0.09,         // was 0.10
} as const;
```

- [ ] **Step 2: Add income domain to getDomainScores()**

Add this entry to the array after the deprivation entry:

```typescript
{
  key: "income",
  label: "Income",
  description: "Income deprivation rate",
  weight: WEIGHTS.income,
  rank: ward.income_rank,
  score: Math.round(rankToScore(ward.income_rank)),
},
```

- [ ] **Step 3: Verify WardRankCard renders the new domain**

The WardRankCard iterates `getDomainScores()` — no code change needed, but visually confirm 7 bars now show in the breakdown instead of 6.

- [ ] **Step 4: Run build**

```bash
npm run build
```

Expected: Build passes. Waterworks livability score will shift slightly due to rebalanced weights.

- [ ] **Step 5: Commit**

```bash
git add lib/scoring.ts
git commit -m "feat: add income rank to livability score, rebalance domain weights"
```

---

## Task 2: Add 2011 Census Baseline Data to ward-stats.js

**Why:** Comparing 2011 vs 2021 census values shows whether a ward is improving or declining. This is the highest-value new stat — trend data tells a story raw numbers can't.

**Files:**
- Modify: `ward-stats.js` — Add 2011 baseline fields for every ward
- Modify: `lib/types.ts` — Extend Ward interface

**Data source:** NISRA Census 2011 Flexible Table Builder, same tables as 2021 but previous census. Available at https://www.ninis2.nisra.gov.uk/

The following 2011 fields should be added per ward (all from Census 2011):

| Field | Description |
|-------|-------------|
| `population_2011` | Total population in 2011 census |
| `no_qualifications_2011_pct` | % with no qualifications (2011) |
| `level_4_plus_2011_pct` | % degree-educated (2011) |
| `bad_very_bad_health_2011_pct` | % in bad/very bad health (2011) |
| `owner_occupied_2011_pct` | % owner-occupied housing (2011) |
| `no_cars_2011_pct` | % households with no car (2011) |

- [ ] **Step 1: Add 2011 fields to Ward interface in lib/types.ts**

Add these optional fields (optional because data may not be available for every ward):

```typescript
// Census 2011 baselines (for trend comparison)
population_2011?: number;
no_qualifications_2011_pct?: number;
level_4_plus_2011_pct?: number;
bad_very_bad_health_2011_pct?: number;
owner_occupied_2011_pct?: number;
no_cars_2011_pct?: number;
```

Add after the `urban_rural` field, before the deprivation ranks section.

- [ ] **Step 2: Research and populate 2011 Census data in ward-stats.js**

For each of the 462 wards, add the 6 fields listed above. This data must come from the NISRA Census 2011 ward-level tables.

**Important:** Ward boundaries changed between 2011 and 2014 (Local Government Reform). The current 462 wards are the post-2014 boundaries. NISRA publishes Census 2011 data re-mapped to 2014 ward boundaries — use that version, NOT the original 2011 ward geographies.

If this data cannot be sourced reliably for all 462 wards, use `null` for missing values and the UI will hide the trend indicator.

- [ ] **Step 3: Run the conversion script**

```bash
npx tsx scripts/convert-data.ts
```

This will regenerate `data/wards/*.json` with the new fields included.

- [ ] **Step 4: Verify a ward JSON file has the new fields**

```bash
node -e "const d = require('./data/wards/belfast.json'); const w = d.wards.find(w => w.slug === 'water-works'); console.log(w.population_2011, w.level_4_plus_2011_pct)"
```

Expected: Prints the 2011 values (or `undefined` if not yet populated).

- [ ] **Step 5: Run build**

```bash
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add ward-stats.js lib/types.ts data/wards/
git commit -m "feat: add 2011 census baseline data for ward trend comparisons"
```

---

## Task 3: Create TrendIndicator Component + Update StatRow

**Why:** A reusable small component that shows "↑ 12.4%" in green or "↓ 3.1%" in red next to any stat. Used across multiple tabs. StatRow's `value` prop must accept ReactNode (not just string) so TrendIndicator can be inlined.

**Files:**
- Modify: `components/ui/StatRow.tsx`
- Create: `components/ui/TrendIndicator.tsx`

- [ ] **Step 0: Update StatRow value prop to ReactNode**

Change `components/ui/StatRow.tsx` so `value` accepts React nodes:

```tsx
import type { ReactNode } from "react";

interface StatRowProps {
  label: string;
  value: ReactNode;
  className?: string;
}

export default function StatRow({ label, value, className }: StatRowProps) {
  return (
    <div className="stat-row">
      <span className="stat-label">{label}</span>
      <span className={`stat-value ${className ?? ""}`}>{value}</span>
    </div>
  );
}
```

This is backwards-compatible — all existing string values still work.

- [ ] **Step 1: Create TrendIndicator component**

```tsx
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
```

- [ ] **Step 2: Run build to verify**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add components/ui/TrendIndicator.tsx
git commit -m "feat: create TrendIndicator component for 2011-2021 comparisons"
```

---

## Task 4: Add Trends to Stats Panel Tabs

**Why:** Wire the TrendIndicator into the existing tabs wherever we have both 2011 and 2021 data.

**Files:**
- Modify: `components/StatsPanel/OverviewTab.tsx` — Population change for wards
- Modify: `components/StatsPanel/EducationTab.tsx` — Qualification trends
- Modify: `components/StatsPanel/HealthTab.tsx` — Health trends
- Modify: `components/StatsPanel/HousingTab.tsx` — Tenure trends
- Modify: `components/StatsPanel/TransportTab.tsx` — Car ownership trends

- [ ] **Step 1: Add population trend to OverviewTab ward section**

In `OverviewTab.tsx`, import TrendIndicator and add a population change row in the ward population section. Since population is a count (not a percentage), compute the % change inline and pass both the formatted value and TrendIndicator as the value (StatRow now accepts ReactNode):

```tsx
import TrendIndicator from "@/components/ui/TrendIndicator";

// Inside the ward population section, after the existing population StatCards:
{ward.population_2011 != null && (() => {
  const pctChange = ((ward.population - ward.population_2011) / ward.population_2011) * 100;
  return (
    <StatRow
      label="Since 2011"
      value={<>
        {pctChange > 0 ? "+" : ""}{pctChange.toFixed(1)}%
        <span style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: 4 }}>
          ({ward.population_2011.toLocaleString()} → {ward.population.toLocaleString()})
        </span>
      </>}
      className={pctChange > 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"}
    />
  );
})()}

- [ ] **Step 2: Add population trend to DemographicsTab**

In `DemographicsTab.tsx`, in the ward rendering section, add a population change row (same pattern as OverviewTab). Import TrendIndicator and add after existing population display:

```tsx
{ward.population_2011 != null && (
  <StatRow
    label="Population Change (2011→2021)"
    value={<>
      {fmt(ward.population_2011)} → {fmt(ward.population)}
      <TrendIndicator current={ward.population} previous={ward.population_2011} suffix="%" />
    </>}
  />
)}
```

Note: Since population is a count, TrendIndicator will show the absolute diff. If percentage change is preferred, compute it inline as in Step 1.

- [ ] **Step 3: Add education trends to EducationTab**

In `EducationTab.tsx`, in the ward rendering section, inline TrendIndicators into the existing StatRow values for "Degree+" and "No Qualifications". Since StatRow now accepts ReactNode, wrap value + indicator:

```tsx
<StatRow
  label="Degree Educated"
  value={<>{fmtPct(ward.level_4_plus_pct)} <TrendIndicator current={ward.level_4_plus_pct} previous={ward.level_4_plus_2011_pct} /></>}
/>
<StatRow
  label="No Qualifications"
  value={<>{fmtPct(ward.no_qualifications_pct)} <TrendIndicator current={ward.no_qualifications_pct} previous={ward.no_qualifications_2011_pct} invertColor /></>}
/>
```

- [ ] **Step 4: Add health trend to HealthTab**

In `HealthTab.tsx`, inline TrendIndicator into the "Bad/Very Bad Health" StatRow value:

```tsx
<StatRow
  label="Bad / Very Bad"
  value={<>{fmtPct(ward.bad_very_bad_health_pct)} <TrendIndicator current={ward.bad_very_bad_health_pct} previous={ward.bad_very_bad_health_2011_pct} invertColor /></>}
/>
```

- [ ] **Step 5: Add housing tenure trend to HousingTab**

In `HousingTab.tsx`, inline TrendIndicator into the owner-occupied StatRow value:

```tsx
<StatRow
  label="Owner Occupied"
  value={<>{fmtPct(ward.owner_occupied_pct)} <TrendIndicator current={ward.owner_occupied_pct} previous={ward.owner_occupied_2011_pct} /></>}
/>
```

- [ ] **Step 6: Add car ownership trend to TransportTab**

In `TransportTab.tsx`, inline TrendIndicator into the no-car StatRow value:

```tsx
<StatRow
  label="No Car"
  value={<>{fmtPct(ward.no_cars_pct)} <TrendIndicator current={ward.no_cars_pct} previous={ward.no_cars_2011_pct} invertColor /></>}
/>
```

- [ ] **Step 7: Run build**

```bash
npm run build
```

- [ ] **Step 8: Commit**

```bash
git add components/ui/StatRow.tsx components/StatsPanel/OverviewTab.tsx components/StatsPanel/DemographicsTab.tsx components/StatsPanel/EducationTab.tsx components/StatsPanel/HealthTab.tsx components/StatsPanel/HousingTab.tsx components/StatsPanel/TransportTab.tsx
git commit -m "feat: add 2011-2021 trend indicators across ward stats tabs"
```

---

## Task 5: Add Benefits Claimant Data

**Why:** Universal Credit / benefits claimant rate is a strong signal of economic health at ward level. DfC (Department for Communities) publishes quarterly ward-level claimant counts.

**Data source:** DfC / NISRA — "Universal Credit, Working Age Benefits and Tax Credits" ward-level statistics.

**Files:**
- Modify: `ward-stats.js` — Add `benefits_claimant_pct` per ward
- Modify: `lib/types.ts` — Add field to Ward interface
- Modify: `components/StatsPanel/OverviewTab.tsx` — Display in ward economy section

- [ ] **Step 1: Add field to Ward interface**

In `lib/types.ts`, add after the transport fields:

```typescript
// Benefits (DfC quarterly statistics)
benefits_claimant_pct?: number;  // % of working-age population on UC/benefits
```

- [ ] **Step 2: Populate benefits data in ward-stats.js**

Add `benefits_claimant_pct` for each ward. Source: DfC quarterly statistics, latest available quarter.

If data is not available for a ward, omit the field (it's optional).

- [ ] **Step 3: Run conversion script**

```bash
npx tsx scripts/convert-data.ts
```

- [ ] **Step 4: Display in OverviewTab**

In the ward section of `OverviewTab.tsx`, add a new "Economy" SectionWrapper (wards currently don't have an economy section — districts do but wards don't):

```tsx
{ward.benefits_claimant_pct != null && (
  <SectionWrapper title="Economy" source="DfC Benefits Statistics">
    <StatRow label="Benefits Claimant Rate" value={fmtPct(ward.benefits_claimant_pct)} />
  </SectionWrapper>
)}
```

- [ ] **Step 5: Run build**

```bash
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add ward-stats.js lib/types.ts data/wards/ components/StatsPanel/OverviewTab.tsx
git commit -m "feat: add ward-level benefits claimant rate from DfC statistics"
```

---

## Task 6: Create Similar Wards Feature

**Why:** "Wards most similar to this one" helps users discover comparable areas. Clusters wards by their demographic vectors using Euclidean distance on normalised fields.

**Files:**
- Create: `lib/similarity.ts` — Similarity algorithm
- Create: `components/ui/SimilarWards.tsx` — Display component
- Modify: `components/StatsPanel/OverviewTab.tsx` — Render SimilarWards at bottom of ward view

- [ ] **Step 1: Create similarity algorithm in lib/similarity.ts**

```typescript
import type { Ward } from "./types";

/** Fields used for similarity comparison, all 0-100 scale */
const SIMILARITY_FIELDS: (keyof Ward)[] = [
  "catholic_pct",
  "no_religion_pct",
  "born_ni_pct",
  "born_elsewhere_pct",
  "owner_occupied_pct",
  "social_rented_pct",
  "level_4_plus_pct",
  "no_qualifications_pct",
  "bad_very_bad_health_pct",
  "no_cars_pct",
  "age_0_15_pct",
  "age_65_plus_pct",
];

function euclideanDistance(a: Ward, b: Ward): number {
  let sum = 0;
  for (const field of SIMILARITY_FIELDS) {
    const va = (a[field] as number) ?? 0;
    const vb = (b[field] as number) ?? 0;
    sum += (va - vb) ** 2;
  }
  return Math.sqrt(sum);
}

export interface SimilarWard {
  ward: Ward;
  lgdSlug: string;
  distance: number;
  similarity: number; // 0-100, higher = more similar
}

/**
 * Find the N most similar wards from a pool.
 * Excludes wards from the same LGD to make results more interesting.
 */
export function findSimilarWards(
  target: Ward,
  targetLgdSlug: string,
  allWards: { ward: Ward; lgdSlug: string }[],
  count: number = 5,
): SimilarWard[] {
  const distances = allWards
    .filter((w) => w.ward.slug !== target.slug || w.lgdSlug !== targetLgdSlug)
    .map((w) => ({
      ward: w.ward,
      lgdSlug: w.lgdSlug,
      distance: euclideanDistance(target, w.ward),
    }))
    .sort((a, b) => a.distance - b.distance);

  // Normalise distances to a 0-100 similarity scale
  const maxDist = distances.length > 0 ? distances[distances.length - 1].distance : 1;

  return distances.slice(0, count).map((d) => ({
    ...d,
    similarity: Math.round((1 - d.distance / maxDist) * 100),
  }));
}
```

- [ ] **Step 2: Create SimilarWards component**

```tsx
"use client";

import { useMemo } from "react";
import { useMapState } from "@/hooks/useMapState";
import { findSimilarWards } from "@/lib/similarity";
import type { Ward } from "@/lib/types";
import districts from "@/data/districts";

interface SimilarWardsProps {
  ward: Ward;
  districtSlug: string;
}

export default function SimilarWards({ ward, districtSlug }: SimilarWardsProps) {
  const { wardCache, selectDistrict, selectWard, setView, loadWardData } = useMapState();

  const similar = useMemo(() => {
    // Collect all wards from all cached districts
    const allWards: { ward: Ward; lgdSlug: string }[] = [];
    for (const [lgdSlug, cache] of wardCache.entries()) {
      for (const w of cache.wards) {
        allWards.push({ ward: w, lgdSlug });
      }
    }
    if (allWards.length < 20) return []; // not enough data loaded
    return findSimilarWards(ward, districtSlug, allWards, 5);
  }, [ward, districtSlug, wardCache]);

  if (similar.length === 0) return null;

  function handleClick(lgdSlug: string, wardSlug: string) {
    selectDistrict(lgdSlug);
    selectWard(wardSlug);
    setView("ward-detail");
    loadWardData(lgdSlug);
  }

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
        Similar Wards
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {similar.map((s) => {
          const lgdName = districts.find((d) => d.slug === s.lgdSlug)?.name ?? s.lgdSlug;
          return (
            <button
              key={`${s.lgdSlug}/${s.ward.slug}`}
              onClick={() => handleClick(s.lgdSlug, s.ward.slug)}
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 10px", background: "var(--bg-card)", border: "1px solid var(--card-border)",
                borderRadius: 6, cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                transition: "background 0.15s, transform 0.1s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bg-card)"; }}
            >
              <div>
                <div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>{s.ward.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{lgdName}</div>
              </div>
              <div style={{ fontSize: 12, color: "var(--accent-light)", fontWeight: 600 }}>
                {s.similarity}% match
              </div>
            </button>
          );
        })}
      </div>
      <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 6, fontStyle: "italic" }}>
        Based on demographics, housing, education, and health profile
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add SimilarWards to OverviewTab**

In `OverviewTab.tsx`, at the bottom of the ward rendering section (after the last SectionWrapper), add:

```tsx
import SimilarWards from "@/components/ui/SimilarWards";

// At bottom of ward view:
<SectionWrapper title="Explore">
  <SimilarWards ward={ward} districtSlug={districtSlug} />
</SectionWrapper>
```

- [ ] **Step 4: Pre-load all ward data for similarity**

The similarity feature needs all 11 districts' ward data loaded. Add this to `components/ui/SimilarWards.tsx` itself (not OverviewTab) so the loading logic stays co-located with the feature that needs it.

**Important:** Call `loadWardData` with a staggered delay to avoid `isLoadingWards` state flickering (each call sets loading true/false). Use a ref to prevent re-triggering:

```tsx
const preloadedRef = useRef(false);

useEffect(() => {
  if (preloadedRef.current) return;
  preloadedRef.current = true;

  // Stagger loading to avoid UI flicker from isLoadingWards toggling
  const slugs = districts.map((d) => d.slug);
  let i = 0;
  function loadNext() {
    if (i >= slugs.length) return;
    loadWardData(slugs[i]);
    i++;
    setTimeout(loadNext, 200);
  }
  loadNext();
}, []); // eslint-disable-line react-hooks/exhaustive-deps
```

The SimilarWards component already handles the "not enough data" case by returning null when `allWards.length < 20`. As more districts load in the background, the component will re-render with results. If no districts beyond the current one are loaded yet, show a message:

```tsx
if (similar.length === 0) {
  const totalLoaded = Array.from(wardCache.values()).reduce((sum, c) => sum + c.wards.length, 0);
  if (totalLoaded < 50) {
    return (
      <div style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>
        Loading ward data for comparison...
      </div>
    );
  }
  return null;
}
```

- [ ] **Step 5: Run build**

```bash
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add lib/similarity.ts components/ui/SimilarWards.tsx components/StatsPanel/OverviewTab.tsx
git commit -m "feat: add 'similar wards' feature using demographic vector distance"
```

---

## Task 7: Improve Scoring Transparency in WardRankCard

**Why:** Users asked "why is health zero?" — the score-from-rank conversion isn't explained clearly enough. Add plain-English context to each domain score.

**Files:**
- Modify: `components/ui/WardRankCard.tsx`

- [ ] **Step 1: Add rank context to domain score display**

In the score breakdown section of `WardRankCard.tsx`, after each domain bar, show the rank in plain English:

Currently it shows: `Health ████░░░░ 0 (20%)`

Change to show: `Health ████░░░░ Rank 2 of 462 (20%)`

In the `.score-domain-value` span, change from showing `d.score` to showing `#${d.rank}`:

```tsx
<span className="score-domain-value">#{d.rank}</span>
```

And add a tooltip/title to the domain row:

```tsx
<div className="score-domain-row" title={`${d.description} — Ranked ${d.rank} of 462 wards (${d.rank <= 46 ? "bottom 10%" : d.rank >= 416 ? "top 10%" : ""})`}>
```

- [ ] **Step 2: Add explanatory text about what low scores mean**

Update the score breakdown description text to explain the inversion:

```tsx
<div className="score-breakdown-desc">
  Scores are derived from NIMDM 2017 deprivation rankings across 462 NI wards.
  A rank of 1 means most deprived (score 0), rank 462 means least deprived (score 100).
  The livability score is a weighted average of {getDomainScores(ward).length} domains.
</div>
```

- [ ] **Step 3: Run build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add components/ui/WardRankCard.tsx
git commit -m "feat: improve scoring transparency with rank numbers and explanatory text"
```

---

## Task 8: Final Verification

- [ ] **Step 1: Run full build**

```bash
npm run build
```

- [ ] **Step 2: Run data verification**

```bash
npx tsx scripts/verify-data.ts
```

- [ ] **Step 3: Visual spot-check**

Start dev server and check:

```bash
npm run dev
```

1. Open Waterworks ward — verify 7 domain bars (including Income), updated weights, rank numbers shown
2. Check trend indicators show on education/health/housing tabs (if 2011 data populated)
3. Check "Similar Wards" section appears at bottom of Overview tab
4. Check benefits claimant rate shows if data is populated
5. Verify no layout breakage on the stats panel

- [ ] **Step 4: Commit any fixes**

---

## Execution Order & Dependencies

```
Task 1 (Income in score)     — independent, do first
Task 2 (2011 data)           — independent, research-heavy (data sourcing)
Task 3 (TrendIndicator+StatRow) — independent, small component + prop type change
Task 4 (Wire trends to tabs) — depends on Task 2 + Task 3
Task 5 (Benefits data)       — independent, research-heavy (data sourcing)
Task 6 (Similar wards)       — independent
Task 7 (Score transparency)  — soft dependency on Task 1 (references domain count)
Task 8 (Verification)        — depends on all above
```

Tasks 1, 2, 3, 5, 6 can all be done in parallel. Task 4 needs 2+3 done. Task 7 is best done after Task 1 but will compile regardless.

**Note on data sourcing (Tasks 2 & 5):** These require researching and entering real data from NISRA/DfC publications. If the data cannot be found for all 462 wards, use `null`/`undefined` for missing wards — all UI components handle optional fields gracefully.

---

## Data Research Notes

### Where to find 2011 Census data (Task 2)

- NISRA NINIS2: https://www.ninis2.nisra.gov.uk/
- Look for "Census 2011 Key Statistics" tables re-mapped to 2014 ward boundaries
- Tables needed: KS102NI (age), KS201NI (religion), KS501NI (qualifications), KS301NI (health), KS402NI (housing tenure), KS404NI (car ownership)
- **Critical:** Use the 2014-ward-remapped versions, not original 2011 ward geographies

### Where to find benefits data (Task 5)

- DfC Statistical Bulletin: "Universal Credit, Housing Benefit and Working-Age Statistical Information"
- Published quarterly with ward-level breakdowns
- Available at: https://www.communities-ni.gov.uk/topics/benefits-statistics
- Use working-age claimant count as % of working-age population
