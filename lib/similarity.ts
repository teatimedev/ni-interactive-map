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
