/**
 * One-time conversion script: reads vanilla JS data files and writes
 * typed TypeScript / JSON output files for the Next.js app.
 *
 * Run with:  npx tsx scripts/convert-data.ts
 */

import fs from "fs";
import path from "path";
import vm from "vm";

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
  // Replace `const ` with `var ` so vm.runInContext can capture assignments
  const patched = raw.replace(/^const /gm, "var ");
  const ctx: Record<string, unknown> = {};
  vm.createContext(ctx);
  vm.runInContext(patched, ctx);
  return ctx;
}

const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const WARDS_DIR = path.join(DATA_DIR, "wards");

// Ensure output directories exist
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(WARDS_DIR, { recursive: true });

// ---------------------------------------------------------------------------
// Load source files
// ---------------------------------------------------------------------------

console.log("Loading source data files…");
const geoCtx = loadJsFile(path.join(ROOT, "geo-data.js"));
const statsCtx = loadJsFile(path.join(ROOT, "stats-data.js"));
const wardCtx = loadJsFile(path.join(ROOT, "ward-stats.js"));

const LGD_GEO = geoCtx.LGD_GEO as {
  type: string;
  features: Array<{
    type: string;
    properties: { name: string };
    geometry: unknown;
  }>;
};

const WARDS_GEO = geoCtx.WARDS_GEO as {
  type: string;
  features: Array<{
    type: string;
    properties: { name: string; code: string; lgd: string };
    geometry: unknown;
  }>;
};

const STATS_DATA = statsCtx.STATS_DATA as {
  _metadata: unknown;
  ni_overall: Record<string, unknown>;
  districts: Record<string, Record<string, unknown>>;
};

const WARD_STATS = wardCtx.WARD_STATS as Record<
  string,
  Record<string, Record<string, unknown>>
>;

// ---------------------------------------------------------------------------
// 1. Write data/ni-overall.ts
// ---------------------------------------------------------------------------

const niOverallTs = `import type { NIOverall } from "@/lib/types";

const niOverall: NIOverall = ${JSON.stringify(STATS_DATA.ni_overall, null, 2)};

export default niOverall;
`;

fs.writeFileSync(path.join(DATA_DIR, "ni-overall.ts"), niOverallTs, "utf8");
console.log("✓ data/ni-overall.ts");

// ---------------------------------------------------------------------------
// 2. Write data/districts.ts
// ---------------------------------------------------------------------------

const districtEntries = Object.entries(STATS_DATA.districts).map(
  ([_key, district]) => {
    const name = district.name as string;
    return { slug: slugify(name), ...district };
  }
);

const districtsTs = `import type { District } from "@/lib/types";

const districts: District[] = ${JSON.stringify(districtEntries, null, 2)};

export default districts;
`;

fs.writeFileSync(path.join(DATA_DIR, "districts.ts"), districtsTs, "utf8");
console.log(`✓ data/districts.ts (${districtEntries.length} districts)`);

// ---------------------------------------------------------------------------
// 3. Write data/geo-districts.json (LGD boundaries only)
// ---------------------------------------------------------------------------

fs.writeFileSync(
  path.join(DATA_DIR, "geo-districts.json"),
  JSON.stringify(LGD_GEO, null, 2),
  "utf8"
);
console.log(
  `✓ data/geo-districts.json (${LGD_GEO.features.length} features)`
);

// ---------------------------------------------------------------------------
// 4. Write one ward JSON file per LGD
// ---------------------------------------------------------------------------

// Build a lookup: lgd -> wardNameUpper -> geometry
const geoByLgdAndWard = new Map<string, Map<string, unknown>>();
for (const feature of WARDS_GEO.features) {
  const lgdName = feature.properties.lgd;
  const wardName = feature.properties.name.toUpperCase();
  if (!geoByLgdAndWard.has(lgdName)) {
    geoByLgdAndWard.set(lgdName, new Map());
  }
  geoByLgdAndWard.get(lgdName)!.set(wardName, feature.geometry);
}

let totalWards = 0;
let filesWritten = 0;

for (const [lgdName, wards] of Object.entries(WARD_STATS)) {
  const lgdSlug = slugify(lgdName);
  const geoLookup = geoByLgdAndWard.get(lgdName) ?? new Map();

  const wardArray = Object.entries(wards).map(([wardKey, wardStats]) => {
    // wardKey is already uppercase (e.g. "ABBEY")
    const geometry = geoLookup.get(wardKey.toUpperCase()) ?? null;

    if (!geometry) {
      console.warn(
        `  WARNING: no geometry found for ward "${wardKey}" in "${lgdName}"`
      );
    }

    // Derive a human-readable name from the ward key:
    // WARD_STATS keys are uppercase; GeoJSON properties.name is also uppercase.
    // Use the GeoJSON name if available (preserves original casing), otherwise
    // title-case the key.
    const geoFeature = WARDS_GEO.features.find(
      (f) =>
        f.properties.lgd === lgdName &&
        f.properties.name.toUpperCase() === wardKey.toUpperCase()
    );
    const wardName = geoFeature ? geoFeature.properties.name : wardKey;
    const wardSlug = slugify(wardName);

    return {
      slug: wardSlug,
      name: wardName,
      lgd: lgdName,
      ...wardStats,
      geometry,
    };
  });

  const output = {
    lgd: lgdName,
    lgdSlug,
    wards: wardArray,
  };

  const fileName = `${lgdSlug}.json`;
  fs.writeFileSync(
    path.join(WARDS_DIR, fileName),
    JSON.stringify(output, null, 2),
    "utf8"
  );

  totalWards += wardArray.length;
  filesWritten++;
  console.log(
    `✓ data/wards/${fileName} (${wardArray.length} wards)`
  );
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log("\n--- Conversion complete ---");
console.log(`Districts:   ${districtEntries.length}`);
console.log(`Ward files:  ${filesWritten}`);
console.log(`Total wards: ${totalWards}`);
