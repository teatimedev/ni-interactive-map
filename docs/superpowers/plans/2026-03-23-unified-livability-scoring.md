# Unified Livability Scoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify ward ranking to use livability score everywhere (eliminating the inconsistency between raw deprivation_rank and composite livability score), and add district-level livability scores.

**Architecture:** A build script precomputes livability scores and NI-wide ranks for all 462 wards, then writes them into the ward JSON files and districts.ts. All UI components then use these precomputed values consistently. The deprivation rank becomes just one domain in the breakdown, not THE rank.

**Tech Stack:** Node.js script, TypeScript, Next.js, React components

---

### Task 1: Create build script to precompute livability scores and ranks

**Files:**
- Create: `scripts/compute-livability.ts`

This script reads all 11 ward JSON files, computes livability scores for all 462 wards using the same formula as `lib/scoring.ts`, sorts them NI-wide to assign ranks, then writes `livability_score` and `livability_rank` back into each ward JSON. It also computes district averages and outputs them.

- [ ] **Step 1: Create the script**

```typescript
// scripts/compute-livability.ts
import * as fs from "fs";
import * as path from "path";

const TOTAL_WARDS = 462;

const WEIGHTS = {
  deprivation: 0.20,
  income: 0.15,
  health: 0.18,
  education: 0.13,
  crime: 0.13,
  living_env: 0.12,
  access: 0.09,
};

function rankToScore(rank: number): number {
  return ((rank - 1) / (TOTAL_WARDS - 1)) * 100;
}

function computeLivabilityScore(ward: Record<string, number>): number {
  const domains = [
    { rank: ward.deprivation_rank, weight: WEIGHTS.deprivation },
    { rank: ward.income_rank, weight: WEIGHTS.income },
    { rank: ward.health_rank, weight: WEIGHTS.health },
    { rank: ward.education_rank, weight: WEIGHTS.education },
    { rank: ward.crime_rank, weight: WEIGHTS.crime },
    { rank: ward.living_env_rank, weight: WEIGHTS.living_env },
    { rank: ward.access_rank, weight: WEIGHTS.access },
  ];
  let total = 0;
  for (const d of domains) {
    total += rankToScore(d.rank) * d.weight;
  }
  return Math.round(total);
}

const DISTRICT_SLUGS = [
  "antrim-and-newtownabbey",
  "ards-and-north-down",
  "armagh-city-banbridge-and-craigavon",
  "belfast",
  "causeway-coast-and-glens",
  "derry-city-and-strabane",
  "fermanagh-and-omagh",
  "lisburn-and-castlereagh",
  "mid-and-east-antrim",
  "mid-ulster",
  "newry-mourne-and-down",
];

const wardsDir = path.join(__dirname, "..", "public", "data", "wards");

// Step 1: Load all wards, compute livability scores
interface WardScore {
  slug: string;
  lgdSlug: string;
  score: number;
}

const allWards: WardScore[] = [];
const districtData = new Map<string, { wards: any[]; file: any }>();

for (const slug of DISTRICT_SLUGS) {
  const filePath = path.join(wardsDir, `${slug}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  districtData.set(slug, { wards: data.wards, file: data });

  for (const ward of data.wards) {
    const score = computeLivabilityScore(ward);
    allWards.push({ slug: ward.slug, lgdSlug: slug, score });
  }
}

console.log(`Loaded ${allWards.length} wards across ${DISTRICT_SLUGS.length} districts`);

// Step 2: Sort by score descending, assign NI-wide ranks (1 = best)
allWards.sort((a, b) => b.score - a.score);
const rankMap = new Map<string, { rank: number; score: number }>();
allWards.forEach((w, i) => {
  rankMap.set(`${w.lgdSlug}/${w.slug}`, { rank: i + 1, score: w.score });
});

// Step 3: Write livability_score and livability_rank into each ward JSON
for (const [slug, { wards, file }] of districtData) {
  for (const ward of wards) {
    const key = `${slug}/${ward.slug}`;
    const entry = rankMap.get(key);
    if (entry) {
      ward.livability_score = entry.score;
      ward.livability_rank = entry.rank;
    }
  }

  const filePath = path.join(wardsDir, `${slug}.json`);
  fs.writeFileSync(filePath, JSON.stringify(file, null, 2) + "\n");
}

// Step 4: Compute district averages and print them
console.log("\nDistrict Livability Scores (average of ward scores):");
for (const [slug, { wards }] of districtData) {
  const scores = wards.map((w: any) => w.livability_score as number);
  const avg = Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length);
  console.log(`  ${slug}: ${avg}`);
}
```

- [ ] **Step 2: Run the script**

Run: `cd /c/Users/ripponj/ni-interactive-map && npx tsx scripts/compute-livability.ts`
Expected: "Loaded 462 wards..." + district averages printed. Ward JSON files updated with `livability_score` and `livability_rank` fields.

- [ ] **Step 3: Verify the output**

Run: `cd /c/Users/ripponj/ni-interactive-map && node -e "const d=require('./public/data/wards/belfast.json'); const w=d.wards[0]; console.log(w.name, 'score:', w.livability_score, 'rank:', w.livability_rank)"`
Expected: Ward name with numeric score (0-100) and rank (1-462).

- [ ] **Step 4: Commit**

```bash
git add scripts/compute-livability.ts public/data/wards/*.json
git commit -m "feat: precompute livability scores and NI-wide ranks for all 462 wards"
```

---

### Task 2: Add livability_score to Ward type

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 1: Add fields to Ward interface**

Add after the `crime_rank` field in the Ward interface:

```typescript
  livability_score: number;
  livability_rank: number;
```

- [ ] **Step 2: Verify no type errors**

Run: `cd /c/Users/ripponj/ni-interactive-map && npx tsc --noEmit 2>&1 | head -20`
Expected: No new errors (existing code doesn't reference these fields yet, and the JSON data already has them from Task 1).

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add livability_score and livability_rank to Ward type"
```

---

### Task 3: Update getWardRankStats to use livability rank

**Files:**
- Modify: `lib/scoring.ts`

The `getWardRankStats()` function currently uses `ward.deprivation_rank` for the headline rank and percentile. Change it to use `ward.livability_rank`.

- [ ] **Step 1: Update getWardRankStats**

Replace the existing `getWardRankStats` function. Change:
- `rank` from `ward.deprivation_rank` to `ward.livability_rank`
- Percentile: since livability_rank 1 = best (highest score), flip the percentile so rank 1 = 100th percentile

```typescript
export function getWardRankStats(ward: Ward) {
  const rank = ward.livability_rank;
  const percentile = Math.round(((TOTAL_WARDS - rank) / TOTAL_WARDS) * 100);

  const topThreshold = Math.ceil(TOTAL_WARDS * 0.9);
  const bottomThreshold = Math.floor(TOTAL_WARDS * 0.1);

  const domains = [
    { key: "income_rank" as const, label: "Income" },
    { key: "employment_rank" as const, label: "Employment" },
    { key: "health_rank" as const, label: "Health" },
    { key: "education_rank" as const, label: "Education" },
    { key: "access_rank" as const, label: "Access to Services" },
    { key: "living_env_rank" as const, label: "Living Environment" },
    { key: "crime_rank" as const, label: "Crime & Disorder" },
  ];

  const topDomains = domains
    .filter((d) => ward[d.key] >= topThreshold)
    .map((d) => d.label);

  const bottomDomains = domains
    .filter((d) => ward[d.key] <= bottomThreshold)
    .map((d) => d.label);

  return { rank, percentile, topDomains, bottomDomains };
}
```

- [ ] **Step 2: Verify no type errors**

Run: `cd /c/Users/ripponj/ni-interactive-map && npx tsc --noEmit 2>&1 | head -20`
Expected: Clean compile.

- [ ] **Step 3: Commit**

```bash
git add lib/scoring.ts
git commit -m "refactor: use livability_rank for ward ranking instead of deprivation_rank"
```

---

### Task 4: Update WardRankCard to use unified livability ranking

**Files:**
- Modify: `components/ui/WardRankCard.tsx`

The card currently shows rank from deprivation_rank and livability score as a separate section. Unify so the livability score IS the ranking, and the headline shows livability rank.

- [ ] **Step 1: Update WardRankCard**

Key changes:
- The headline "Ranked #X of 462" now uses livability_rank (via getWardRankStats which was updated in Task 3)
- Change percentile text from "More/Less deprived" to "More/Less livable"
- Remove the separate "Livability Score: X/100" line since it's now the headline
- Show the score prominently in the header next to the grade

Replace the component body:

```tsx
export default function WardRankCard({ ward, districtSlug }: WardRankCardProps) {
  const [copied, setCopied] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const { rank, percentile, topDomains, bottomDomains } = getWardRankStats(ward);
  const score = computeLivabilityScore(ward);
  const { grade, color } = scoreToGrade(score);
  const domains = getDomainScores(ward);

  function handleShare() {
    const url = `${window.location.origin}/ward/${districtSlug}/${ward.slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="ward-rank-card">
      <div className="rank-card-header">
        <div>
          <div className="rank-card-label">Livability Score</div>
          <div className="rank-card-headline">
            <span className="rank-card-number">{score}</span>/100
          </div>
          <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>
            Ranked <strong>#{rank}</strong> of 462 wards
          </div>
        </div>
        <div className="rank-card-grade" style={{ background: color, boxShadow: `0 2px 8px ${color}40` }}>
          {grade}
        </div>
      </div>

      <div className="rank-card-percentile">
        {rank <= 231 ? (
          <>More livable than <span className="rank-card-highlight-good">{percentile}%</span> of NI</>
        ) : (
          <>Less livable than <span className="rank-card-highlight-warn">{100 - percentile}%</span> of NI</>
        )}
      </div>

      {(topDomains.length > 0 || bottomDomains.length > 0) && (
        <div className="rank-card-domains">
          {topDomains.length > 0 && (
            <div className="rank-card-domain-row">
              <span className="rank-card-domain-label-good">Top 10% for:</span>{" "}
              <span className="rank-card-domain-list">{topDomains.join(", ")}</span>
            </div>
          )}
          {bottomDomains.length > 0 && (
            <div className="rank-card-domain-row">
              <span className="rank-card-domain-label-bad">Bottom 10% for:</span>{" "}
              <span className="rank-card-domain-list">{bottomDomains.join(", ")}</span>
            </div>
          )}
        </div>
      )}

      <div className="rank-card-score">
        <button className="score-breakdown-toggle" onClick={() => setShowBreakdown(!showBreakdown)}>
          {showBreakdown ? "Hide breakdown" : "How is this scored?"}
        </button>
      </div>

      {showBreakdown && (
        <div className="score-breakdown">
          <div className="score-breakdown-desc">
            Scores are derived from NIMDM 2017 deprivation rankings across 462 NI wards.
            A rank of 1 means most deprived (score 0), rank 462 means least deprived (score 100).
            The livability score is a weighted average of {domains.length} domains.
          </div>
          {domains.map((d) => (
            <div key={d.key} className="score-domain-row" title={`${d.description} — Ranked ${d.rank} of 462 wards${d.rank <= 46 ? " (bottom 10%)" : d.rank >= 416 ? " (top 10%)" : ""}`}>
              <div className="score-domain-label">{d.label}</div>
              <div className="score-domain-bar">
                <div
                  className="score-domain-fill"
                  style={{ width: `${d.score}%`, background: scoreColor(d.score) }}
                />
              </div>
              <div className="score-domain-value">#{d.rank}</div>
              <div className="score-domain-weight">{Math.round(d.weight * 100)}%</div>
            </div>
          ))}
        </div>
      )}

      <button onClick={handleShare} className="btn-map rank-card-share">
        {copied ? "Link copied!" : "Share this ward"}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Verify no type errors**

Run: `cd /c/Users/ripponj/ni-interactive-map && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add components/ui/WardRankCard.tsx
git commit -m "refactor: unify WardRankCard to use livability score as primary ranking"
```

---

### Task 5: Remove redundant deprivation section from OverviewTab

**Files:**
- Modify: `components/StatsPanel/OverviewTab.tsx`

The WardOverview section (lines 171-185) shows a separate "Deprivation" section with Overall Rank, DeprivationMeter, and sub-domain ranks. This is now redundant since WardRankCard shows all of this via the livability breakdown. Remove it.

- [ ] **Step 1: Remove the redundant deprivation section**

In the `WardOverview` function, remove:
- The `deprivationPosition` calculation (line 122)
- The `subDomains` array (lines 124-132)
- The entire `<SectionWrapper title="Deprivation" ...>` block (lines 171-185)
- The `DeprivationMeter` import (if no longer used by WardOverview — but it's still used by DistrictOverview, so keep the import)

- [ ] **Step 2: Verify no type errors and visually confirm**

Run: `cd /c/Users/ripponj/ni-interactive-map && npx tsc --noEmit 2>&1 | head -20`
Expected: Clean compile.

- [ ] **Step 3: Commit**

```bash
git add components/StatsPanel/OverviewTab.tsx
git commit -m "refactor: remove redundant deprivation section from ward overview (covered by WardRankCard)"
```

---

### Task 6: Add livability score to districts.ts

**Files:**
- Modify: `data/districts.ts`
- Modify: `lib/types.ts`

Use the district averages computed in Task 1 to add a `livability_score` field to each district. Also add the field to the District interface.

- [ ] **Step 1: Add livability_score to District interface**

In `lib/types.ts`, add to the District interface after `nimdm_pct_in_top100`:

```typescript
  livability_score: number;
```

- [ ] **Step 2: Run the compute script to get district averages**

Run: `cd /c/Users/ripponj/ni-interactive-map && npx tsx scripts/compute-livability.ts`
Note the district averages from the output.

- [ ] **Step 3: Add livability_score to each district in districts.ts**

Add the `livability_score` field to each of the 11 district objects, using the averages from the script output.

- [ ] **Step 4: Verify no type errors**

Run: `cd /c/Users/ripponj/ni-interactive-map && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 5: Commit**

```bash
git add lib/types.ts data/districts.ts
git commit -m "feat: add livability_score to District type and data"
```

---

### Task 7: Enable livability choropleth for districts

**Files:**
- Modify: `lib/colors.ts`

Currently `CHOROPLETH_CONFIGS.livability.key` returns `() => null`. Update it to return the district's livability score.

- [ ] **Step 1: Update the livability config key**

Change:
```typescript
key: () => null,
```
To:
```typescript
key: (d) => d.livability_score,
```

- [ ] **Step 2: Verify no type errors**

Run: `cd /c/Users/ripponj/ni-interactive-map && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add lib/colors.ts
git commit -m "feat: enable livability choropleth shading for districts"
```

---

### Task 8: Add livability to district leaderboard

**Files:**
- Modify: `app/leaderboard/leaderboard/page.tsx`

Add a "Livability Score" metric to the district leaderboard METRICS, and make it the default.

- [ ] **Step 1: Import scoreToGrade and add livability metric**

Add import at top:
```typescript
import { scoreToGrade } from "@/lib/scoring";
```

Add to METRICS object (as the first entry so it appears first in the selector):
```typescript
livability: {
  label: "Livability Score",
  getValue: (d) => d.livability_score,
  format: (n) => n.toString(),
  higherBetter: true,
},
```

Change default active metric:
```typescript
const [activeMetric, setActiveMetric] = useState("livability");
```

- [ ] **Step 2: Add grade badge display for livability metric**

In the table row rendering, add a grade badge when the active metric is livability. After the district name `<span>`, add:

```tsx
{activeMetric === "livability" && (() => {
  const { grade, color } = scoreToGrade(metric.getValue(d));
  return (
    <span style={{
      display: "inline-block",
      marginLeft: 8,
      padding: "1px 6px",
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 700,
      background: color,
      color: "#fff",
    }}>
      {grade}
    </span>
  );
})()}
```

- [ ] **Step 3: Verify no type errors**

Run: `cd /c/Users/ripponj/ni-interactive-map && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 4: Commit**

```bash
git add app/leaderboard/leaderboard/page.tsx
git commit -m "feat: add livability score to district leaderboard as default metric"
```

---

### Task 9: Add livability score to district overview panel

**Files:**
- Modify: `components/StatsPanel/OverviewTab.tsx`

Add a livability score display to the DistrictOverview, similar in style to the WardRankCard but simpler (no domain breakdown since district scores are averages).

- [ ] **Step 1: Import scoreToGrade**

Add to imports:
```typescript
import { scoreToGrade } from "@/lib/scoring";
```

- [ ] **Step 2: Add livability section to DistrictOverview**

Add before the existing "Deprivation" SectionWrapper (before line 95):

```tsx
<SectionWrapper title="Livability Score" source="NIMDM 2017 (ward average)">
  {(() => {
    const { grade, color } = scoreToGrade(data.livability_score);
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 8,
          background: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          fontWeight: 700,
          color: "#fff",
          boxShadow: `0 2px 8px ${color}40`,
        }}>
          {grade}
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-bright)" }}>
            {data.livability_score}/100
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            Average of ward livability scores
          </div>
        </div>
      </div>
    );
  })()}
</SectionWrapper>
```

- [ ] **Step 3: Verify no type errors**

Run: `cd /c/Users/ripponj/ni-interactive-map && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 4: Commit**

```bash
git add components/StatsPanel/OverviewTab.tsx
git commit -m "feat: add livability score display to district overview panel"
```

---

### Task 10: Visual verification

- [ ] **Step 1: Verify ward detail panel**

Open http://localhost:3000, click a district, click a ward. The WardRankCard should show:
- "Livability Score" as the header
- Score X/100 with rank #Y of 462
- Grade badge (A+/A/B+/etc.)
- "More/Less livable than X% of NI"
- No separate "Deprivation" section below

- [ ] **Step 2: Verify district detail panel**

Click a district. The overview should show:
- A new "Livability Score" section with grade badge and score/100
- The existing "Deprivation" section still present (for SOAs in top 100)

- [ ] **Step 3: Verify livability choropleth at district level**

Select "Livability Score" from the choropleth metric selector. Districts should now show color shading (previously they were unshaded).

- [ ] **Step 4: Verify district leaderboard**

Navigate to the district leaderboard. It should default to "Livability Score" metric with grade badges.

- [ ] **Step 5: Verify ward leaderboard**

Navigate to the ward leaderboard. Rankings should match the ward detail panel (both using livability score now).
