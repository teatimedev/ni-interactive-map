/**
 * Precompute livability scores and NI-wide ranks for all 462 wards.
 * Also computes district averages and prints them for districts.ts.
 *
 * Run: npx tsx scripts/compute-livability.ts
 */
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

const publicWardsDir = path.join(__dirname, "..", "public", "data", "wards");
const dataWardsDir = path.join(__dirname, "..", "data", "wards");

// Step 1: Load all wards, compute livability scores
interface WardScore {
  slug: string;
  lgdSlug: string;
  score: number;
  deprivationRank: number; // tiebreaker
}

const allWards: WardScore[] = [];
const districtData = new Map<string, { wards: any[]; file: any }>();

for (const slug of DISTRICT_SLUGS) {
  const filePath = path.join(publicWardsDir, `${slug}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  districtData.set(slug, { wards: data.wards, file: data });

  for (const ward of data.wards) {
    const score = computeLivabilityScore(ward);
    allWards.push({
      slug: ward.slug,
      lgdSlug: slug,
      score,
      deprivationRank: ward.deprivation_rank,
    });
  }
}

console.log(`Loaded ${allWards.length} wards across ${DISTRICT_SLUGS.length} districts`);

// Step 2: Sort by score descending, tiebreak by deprivation_rank descending (higher = less deprived = better)
allWards.sort((a, b) => {
  if (b.score !== a.score) return b.score - a.score;
  return b.deprivationRank - a.deprivationRank;
});

const rankMap = new Map<string, { rank: number; score: number }>();
allWards.forEach((w, i) => {
  rankMap.set(`${w.lgdSlug}/${w.slug}`, { rank: i + 1, score: w.score });
});

// Step 3: Write livability_score and livability_rank into each ward JSON (both dirs)
for (const [slug, { wards, file }] of districtData) {
  for (const ward of wards) {
    const key = `${slug}/${ward.slug}`;
    const entry = rankMap.get(key);
    if (entry) {
      ward.livability_score = entry.score;
      ward.livability_rank = entry.rank;
    }
  }

  // Write to public/data/wards/
  const publicPath = path.join(publicWardsDir, `${slug}.json`);
  fs.writeFileSync(publicPath, JSON.stringify(file, null, 2) + "\n");

  // Write to data/wards/ (used by OG image route)
  const dataPath = path.join(dataWardsDir, `${slug}.json`);
  if (fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, JSON.stringify(file, null, 2) + "\n");
  }
}

console.log("Ward JSON files updated with livability_score and livability_rank\n");

// Step 4: Compute district averages
console.log("District Livability Scores (average of ward scores):");
console.log("Copy these into data/districts.ts:\n");
for (const [slug, { wards }] of districtData) {
  const scores = wards.map((w: any) => w.livability_score as number);
  const avg = Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length);
  console.log(`  "${slug}": ${avg},`);
}

// Step 5: Print rank distribution stats
const scoreCounts = new Map<number, number>();
for (const w of allWards) {
  scoreCounts.set(w.score, (scoreCounts.get(w.score) ?? 0) + 1);
}
const uniqueScores = scoreCounts.size;
const maxTies = Math.max(...scoreCounts.values());
console.log(`\nRank stats: ${uniqueScores} unique scores, max ${maxTies} wards sharing a score`);
