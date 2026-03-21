/**
 * Fetch ward-level crime data from data.police.uk API and merge into ward JSON files.
 *
 * Downloads 12 months of crime data for each of the 462 wards using centroid lat/lng,
 * aggregates by crime category, and writes updated ward JSON files.
 *
 * Run with:  npx tsx scripts/fetch-ward-crime.ts
 */

import fs from "fs";
import path from "path";
import vm from "vm";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const MONTHS = [
  "2024-07", "2024-08", "2024-09", "2024-10", "2024-11", "2024-12",
  "2025-01", "2025-02", "2025-03", "2025-04", "2025-05", "2025-06",
];

const PERIOD_LABEL = "Jul 2024 – Jun 2025";
const API_BASE = "https://data.police.uk/api/crimes-street/all-crime";
const DELAY_MS = 200;
const RETRY_DELAY_MS = 10_000;
const MAX_RETRIES = 5;

const ROOT = path.resolve(__dirname, "..");
const PUBLIC_WARDS_DIR = path.join(ROOT, "public", "data", "wards");
const PROGRESS_FILE = path.join(ROOT, "scripts", ".ward-crime-progress.json");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CrimeRecord {
  category: string;
  id: number;
  persistent_id: string;
  location: { latitude: string; longitude: string };
}

interface WardCrimeData {
  crime_total: number;
  crime_rate_per_1000: number;
  crime_asb: number;
  crime_violent: number;
  crime_burglary: number;
  crime_criminal_damage: number;
  crime_drugs: number;
  crime_theft: number;
  crime_vehicle: number;
  crime_public_order: number;
  crime_robbery: number;
  crime_weapons: number;
  crime_other: number;
  crime_period: string;
}

interface GeoFeature {
  type: string;
  properties: { name: string; code: string; lgd: string };
  geometry: {
    type: string;
    coordinates: number[][][] | number[][][][];
  };
}

interface ProgressData {
  completed: Record<string, boolean>; // key: "lgd:wardName"
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function loadJsFile(filePath: string): Record<string, unknown> {
  const raw = fs.readFileSync(filePath, "utf8");
  const patched = raw.replace(/^const /gm, "var ");
  const ctx: Record<string, unknown> = {};
  vm.createContext(ctx);
  vm.runInContext(patched, ctx);
  return ctx;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function calculateCentroid(geometry: GeoFeature["geometry"]): [number, number] {
  // Get all coordinate rings
  let coords: number[][];
  if (geometry.type === "MultiPolygon") {
    // MultiPolygon: number[][][][]
    coords = (geometry.coordinates as number[][][][]).flat(2);
  } else {
    // Polygon: number[][][]
    coords = (geometry.coordinates as number[][][]).flat();
  }

  let sumLng = 0;
  let sumLat = 0;
  for (const [lng, lat] of coords) {
    sumLng += lng;
    sumLat += lat;
  }
  const n = coords.length;
  return [sumLat / n, sumLng / n]; // [lat, lng]
}

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<CrimeRecord[]> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);

      if (res.status === 429) {
        console.log(`    Rate limited (429). Waiting ${RETRY_DELAY_MS / 1000}s before retry ${attempt}/${retries}...`);
        await sleep(RETRY_DELAY_MS);
        continue;
      }

      if (res.status === 503) {
        console.log(`    Service unavailable (503). Waiting ${RETRY_DELAY_MS / 1000}s before retry ${attempt}/${retries}...`);
        await sleep(RETRY_DELAY_MS);
        continue;
      }

      if (!res.ok) {
        // Some endpoints return 400 for invalid areas or no data
        if (res.status === 400) {
          return [];
        }
        console.log(`    HTTP ${res.status} for request. Retry ${attempt}/${retries}...`);
        await sleep(RETRY_DELAY_MS);
        continue;
      }

      const text = await res.text();
      if (!text || text.trim() === "") return [];
      return JSON.parse(text) as CrimeRecord[];
    } catch (err) {
      console.log(`    Network error: ${(err as Error).message}. Retry ${attempt}/${retries}...`);
      await sleep(RETRY_DELAY_MS);
    }
  }
  console.log(`    Failed after ${retries} retries, returning empty.`);
  return [];
}

function categorizeCrimes(crimes: CrimeRecord[]): Omit<WardCrimeData, "crime_total" | "crime_rate_per_1000" | "crime_period"> {
  const counts = {
    crime_asb: 0,
    crime_violent: 0,
    crime_burglary: 0,
    crime_criminal_damage: 0,
    crime_drugs: 0,
    crime_theft: 0,
    crime_vehicle: 0,
    crime_public_order: 0,
    crime_robbery: 0,
    crime_weapons: 0,
    crime_other: 0,
  };

  for (const crime of crimes) {
    switch (crime.category) {
      case "anti-social-behaviour":
        counts.crime_asb++;
        break;
      case "violent-crime":
      case "violence-and-sexual-offences":
        counts.crime_violent++;
        break;
      case "burglary":
        counts.crime_burglary++;
        break;
      case "criminal-damage-arson":
        counts.crime_criminal_damage++;
        break;
      case "drugs":
        counts.crime_drugs++;
        break;
      case "other-theft":
      case "shoplifting":
      case "theft-from-the-person":
        counts.crime_theft++;
        break;
      case "vehicle-crime":
        counts.crime_vehicle++;
        break;
      case "public-order":
        counts.crime_public_order++;
        break;
      case "robbery":
        counts.crime_robbery++;
        break;
      case "possession-of-weapons":
        counts.crime_weapons++;
        break;
      case "other-crime":
      case "bicycle-theft":
      default:
        counts.crime_other++;
        break;
    }
  }

  return counts;
}

function loadProgress(): ProgressData {
  if (fs.existsSync(PROGRESS_FILE)) {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf8"));
  }
  return { completed: {} };
}

function saveProgress(progress: ProgressData): void {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("Loading ward boundaries from geo-data.js...");
  const geoCtx = loadJsFile(path.join(ROOT, "geo-data.js"));
  const WARDS_GEO = geoCtx.WARDS_GEO as { type: string; features: GeoFeature[] };
  console.log(`Found ${WARDS_GEO.features.length} ward boundaries.`);

  // Load existing ward data files
  const wardFiles = fs.readdirSync(PUBLIC_WARDS_DIR).filter((f) => f.endsWith(".json"));
  console.log(`Found ${wardFiles.length} ward data files.`);

  // Build lookup: lgd (lowercase) -> { slug, wards, filePath }
  const districtData: Map<string, { lgd: string; lgdSlug: string; wards: Record<string, unknown>[]; filePath: string }> = new Map();
  for (const file of wardFiles) {
    const filePath = path.join(PUBLIC_WARDS_DIR, file);
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    districtData.set(data.lgd.toLowerCase(), {
      lgd: data.lgd,
      lgdSlug: data.lgdSlug || file.replace(".json", ""),
      wards: data.wards,
      filePath,
    });
  }

  // Build ward list with centroids
  interface WardTask {
    lgd: string;
    wardName: string;
    centroid: [number, number]; // [lat, lng]
    population: number;
    wardIndex: number; // index in district wards array
  }

  const wardTasks: WardTask[] = [];

  for (const feature of WARDS_GEO.features) {
    const lgd = feature.properties.lgd;
    const wardName = feature.properties.name;
    const centroid = calculateCentroid(feature.geometry);

    // Find matching ward in data files
    const district = districtData.get(lgd.toLowerCase());
    if (!district) {
      console.log(`  Warning: No district data file for "${lgd}"`);
      continue;
    }

    const wardIndex = district.wards.findIndex(
      (w) => (w.name as string).toLowerCase() === wardName.toLowerCase()
    );
    if (wardIndex === -1) {
      console.log(`  Warning: Ward "${wardName}" not found in ${lgd} data file`);
      continue;
    }

    const population = (district.wards[wardIndex].population as number) || 1;

    wardTasks.push({
      lgd,
      wardName,
      centroid,
      population,
      wardIndex,
    });
  }

  console.log(`\nPrepared ${wardTasks.length} wards for crime data fetching.`);
  console.log(`Fetching ${MONTHS.length} months of data per ward (${wardTasks.length * MONTHS.length} total API calls).`);
  console.log(`Estimated time: ~${Math.ceil((wardTasks.length * MONTHS.length * DELAY_MS) / 60000)} minutes\n`);

  const progress = loadProgress();
  let completed = Object.keys(progress.completed).length;
  const total = wardTasks.length;

  for (let i = 0; i < wardTasks.length; i++) {
    const task = wardTasks[i];
    const progressKey = `${task.lgd}:${task.wardName}`;

    if (progress.completed[progressKey]) {
      continue;
    }

    console.log(`Processing ward ${i + 1}/${total}: ${task.wardName} (${task.lgd})...`);

    // Fetch all months for this ward
    const allCrimes: CrimeRecord[] = [];
    const seenIds = new Set<number>();

    for (const month of MONTHS) {
      const [lat, lng] = task.centroid;
      const url = `${API_BASE}?lat=${lat.toFixed(6)}&lng=${lng.toFixed(6)}&date=${month}`;

      const crimes = await fetchWithRetry(url);

      // Deduplicate by crime ID
      for (const crime of crimes) {
        if (crime.id && !seenIds.has(crime.id)) {
          seenIds.add(crime.id);
          allCrimes.push(crime);
        } else if (!crime.id) {
          // No ID — include but can't deduplicate
          allCrimes.push(crime);
        }
      }

      await sleep(DELAY_MS);
    }

    // Aggregate
    const categorized = categorizeCrimes(allCrimes);
    const crimeTotal = allCrimes.length;
    const crimeRate = Math.round((crimeTotal / (task.population / 1000)) * 10) / 10;

    const crimeData: WardCrimeData = {
      crime_total: crimeTotal,
      crime_rate_per_1000: crimeRate,
      ...categorized,
      crime_period: PERIOD_LABEL,
    };

    // Update ward in district data
    const district = districtData.get(task.lgd.toLowerCase())!;
    Object.assign(district.wards[task.wardIndex], crimeData);

    // Mark complete and save progress
    progress.completed[progressKey] = true;
    completed++;
    saveProgress(progress);

    console.log(`  → ${crimeTotal} crimes (rate: ${crimeRate}/1000) — ${completed}/${total} done`);

    // Write district file every 10 wards to avoid data loss
    if (completed % 10 === 0 || i === wardTasks.length - 1) {
      const fileData = {
        lgd: district.lgd,
        lgdSlug: district.lgdSlug,
        wards: district.wards,
      };
      fs.writeFileSync(district.filePath, JSON.stringify(fileData, null, 2));
      console.log(`  (Saved ${district.lgd} ward data to disk)`);
    }
  }

  // Final write for all districts
  console.log("\nWriting final ward data files...");
  for (const [, district] of districtData) {
    const fileData = {
      lgd: district.lgd,
      lgdSlug: district.lgdSlug,
      wards: district.wards,
    };
    fs.writeFileSync(district.filePath, JSON.stringify(fileData, null, 2));
    console.log(`  ✓ ${district.lgd}`);
  }

  // Clean up progress file
  if (fs.existsSync(PROGRESS_FILE)) {
    fs.unlinkSync(PROGRESS_FILE);
  }

  console.log(`\nDone! Crime data added to ${completed} wards.`);
  console.log(`Period: ${PERIOD_LABEL}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
