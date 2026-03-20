import fs from "fs";
import path from "path";
import districts from "../data/districts";

interface WardFile {
  lgd: string;
  lgdSlug: string;
  wards: Array<Record<string, unknown>>;
}

const errors: string[] = [];
const warnings: string[] = [];

function err(msg: string) { errors.push(msg); }
function warn(msg: string) { warnings.push(msg); }

function checkRange(value: number | null | undefined, min: number, max: number, label: string) {
  if (value == null) { err(`${label}: null/undefined`); return; }
  if (value < min || value > max) err(`${label}: ${value} outside [${min}, ${max}]`);
}

function checkPctGroup(values: (number | null | undefined)[], label: string) {
  const nums = values.filter((v): v is number => v != null);
  if (nums.length === 0) return;
  const sum = nums.reduce((a, b) => a + b, 0);
  if (sum < 95 || sum > 105) warn(`${label}: percentages sum to ${sum.toFixed(1)}% (expected ~100%)`);
}

// ===== DISTRICT CHECKS =====
console.log("Checking districts...\n");

for (const d of districts) {
  const prefix = `District [${d.name}]`;

  // Population
  if (d.population <= 0) err(`${prefix}: population ${d.population} <= 0`);
  if (d.area_sq_km <= 0) err(`${prefix}: area ${d.area_sq_km} <= 0`);
  if (d.population_density_per_sq_km <= 0) err(`${prefix}: density <= 0`);

  // Age percentages
  checkRange(d.age_0_15_pct, 0, 100, `${prefix} age_0_15_pct`);
  checkRange(d.age_16_64_pct, 0, 100, `${prefix} age_16_64_pct`);
  checkRange(d.age_65_plus_pct, 0, 100, `${prefix} age_65_plus_pct`);
  checkPctGroup([d.age_0_15_pct, d.age_16_64_pct, d.age_65_plus_pct], `${prefix} age`);

  // Economy
  checkRange(d.median_annual_earnings_residence, 15000, 60000, `${prefix} earnings`);
  checkRange(d.employment_rate_pct, 0, 100, `${prefix} employment_rate`);
  checkRange(d.unemployment_rate_census_pct, 0, 100, `${prefix} unemployment_rate`);

  // Life expectancy
  checkRange(d.life_expectancy_male, 60, 90, `${prefix} life_exp_male`);
  checkRange(d.life_expectancy_female, 60, 95, `${prefix} life_exp_female`);

  // House prices
  if (d.housing.median_house_price <= 0) err(`${prefix}: median house price <= 0`);
  if (d.housing.avg_house_price <= 0) err(`${prefix}: avg house price <= 0`);

  // Housing tenure
  checkRange(d.housing.owner_occupied_pct, 0, 100, `${prefix} owner_occupied`);
  checkRange(d.housing.private_rented_pct, 0, 100, `${prefix} private_rented`);
  checkRange(d.housing.social_housing_pct, 0, 100, `${prefix} social_housing`);
  checkPctGroup(
    [d.housing.owner_occupied_pct, d.housing.private_rented_pct, d.housing.social_housing_pct],
    `${prefix} housing tenure`
  );

  // Religion
  checkPctGroup(
    [d.demographics.catholic_pct, d.demographics.protestant_other_christian_pct, d.demographics.other_religion_pct, d.demographics.no_religion_pct],
    `${prefix} religion`
  );

  // Education
  checkRange(d.education.degree_plus_pct, 0, 100, `${prefix} degree_plus`);
  checkRange(d.education.no_qualifications_pct, 0, 100, `${prefix} no_qualifications`);

  // Crime
  if (d.crime.total_recorded <= 0) err(`${prefix}: total crime <= 0`);
  checkRange(d.crime.rate_per_1000, 1, 200, `${prefix} crime_rate`);

  // Transport
  checkPctGroup(
    [d.transport.no_car_pct, d.transport.one_car_pct, d.transport.two_plus_cars_pct],
    `${prefix} car ownership`
  );
}

// ===== WARD CHECKS =====
console.log("Checking wards...\n");

const wardsDir = path.join(__dirname, "..", "data", "wards");
const wardFiles = fs.readdirSync(wardsDir).filter(f => f.endsWith(".json"));

const allDepRanks: number[] = [];
const allSlugs = new Map<string, string[]>();

for (const file of wardFiles) {
  const data: WardFile = JSON.parse(fs.readFileSync(path.join(wardsDir, file), "utf-8"));
  const lgdName = data.lgd;
  const slugsInDistrict: string[] = [];

  for (const w of data.wards) {
    const prefix = `Ward [${w.name}] in ${lgdName}`;

    // Required fields
    const required = ["slug", "name", "population", "male", "female", "deprivation_rank",
      "income_rank", "employment_rank", "health_rank", "education_rank",
      "access_rank", "living_env_rank", "crime_rank"];
    for (const field of required) {
      if (w[field] == null) err(`${prefix}: missing ${field}`);
    }

    // Population
    const pop = w.population as number;
    if (pop != null && pop <= 0) err(`${prefix}: population ${pop} <= 0`);

    // Percentage fields
    const pctFields = [
      "age_0_15_pct", "age_16_64_pct", "age_65_plus_pct",
      "catholic_pct", "protestant_other_christian_pct", "other_religion_pct", "no_religion_pct",
      "owner_occupied_pct", "social_rented_pct", "private_rented_pct",
      "no_qualifications_pct", "level_1_2_pct", "level_3_pct", "level_4_plus_pct",
      "very_good_good_health_pct", "fair_health_pct", "bad_very_bad_health_pct",
      "no_cars_pct", "one_car_pct", "two_plus_cars_pct",
    ];
    for (const field of pctFields) {
      const val = w[field] as number;
      if (val != null) checkRange(val, 0, 100, `${prefix} ${field}`);
    }

    // Age group sums
    checkPctGroup(
      [w.age_0_15_pct as number, w.age_16_64_pct as number, w.age_65_plus_pct as number],
      `${prefix} age`
    );

    // Religion sums
    checkPctGroup(
      [w.catholic_pct as number, w.protestant_other_christian_pct as number, w.other_religion_pct as number, w.no_religion_pct as number],
      `${prefix} religion`
    );

    // Housing tenure sums
    checkPctGroup(
      [w.owner_occupied_pct as number, w.social_rented_pct as number, w.private_rented_pct as number],
      `${prefix} housing tenure`
    );

    // Deprivation ranks
    const depRank = w.deprivation_rank as number;
    if (depRank != null) {
      checkRange(depRank, 1, 462, `${prefix} deprivation_rank`);
      allDepRanks.push(depRank);
    }

    // Sub-domain ranks
    for (const rankField of ["income_rank", "employment_rank", "health_rank", "education_rank", "access_rank", "living_env_rank", "crime_rank"]) {
      const val = w[rankField] as number;
      if (val != null) checkRange(val, 1, 462, `${prefix} ${rankField}`);
    }

    // Duplicate slug check
    const slug = w.slug as string;
    if (slug) {
      if (slugsInDistrict.includes(slug)) {
        err(`${prefix}: duplicate slug "${slug}" in ${lgdName}`);
      }
      slugsInDistrict.push(slug);
    }
  }

  allSlugs.set(lgdName, slugsInDistrict);
}

// Check all deprivation ranks are unique
const depSet = new Set(allDepRanks);
if (depSet.size !== allDepRanks.length) {
  const dupes = allDepRanks.filter((r, i) => allDepRanks.indexOf(r) !== i);
  err(`Duplicate deprivation ranks: ${[...new Set(dupes)].join(", ")}`);
}
if (depSet.size !== 462) {
  warn(`Expected 462 unique deprivation ranks, got ${depSet.size}`);
}

// ===== RESULTS =====
console.log("=".repeat(60));
console.log(`ERRORS: ${errors.length}`);
for (const e of errors) console.log(`  ❌ ${e}`);

console.log(`\nWARNINGS: ${warnings.length}`);
for (const w of warnings) console.log(`  ⚠️  ${w}`);

console.log(`\nTotal wards checked: ${allDepRanks.length}`);
console.log(`Total districts checked: ${districts.length}`);
console.log("=".repeat(60));

if (errors.length > 0) {
  process.exit(1);
}
