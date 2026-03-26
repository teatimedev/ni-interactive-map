import type { WardCache } from "@/hooks/useMapState";

interface WardLocation {
  wardSlug: string;
  lgdSlug: string;
}

/**
 * Ray-casting point-in-polygon test.
 * Returns true if (lat, lng) is inside the polygon ring.
 */
function pointInRing(lat: number, lng: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]; // GeoJSON: [lng, lat]
    const [xj, yj] = ring[j];
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * Check if a point is inside a GeoJSON geometry (Polygon or MultiPolygon).
 */
function pointInGeometry(
  lat: number,
  lng: number,
  geometry: { type: string; coordinates: number[][][] | number[][][][] }
): boolean {
  if (geometry.type === "Polygon") {
    const coords = geometry.coordinates as number[][][];
    // Check outer ring, exclude holes
    return pointInRing(lat, lng, coords[0]);
  }
  if (geometry.type === "MultiPolygon") {
    const coords = geometry.coordinates as number[][][][];
    return coords.some((polygon) => pointInRing(lat, lng, polygon[0]));
  }
  return false;
}

/**
 * Find which ward a lat/lng point falls within, using the cached ward GeoJSON.
 * Returns { wardSlug, lgdSlug } or null if not found.
 */
export function findWardForPoint(
  lat: number,
  lng: number,
  wardCache: Map<string, WardCache>
): WardLocation | null {
  for (const [lgdSlug, cache] of wardCache.entries()) {
    for (const feature of cache.geoJSON.features) {
      const slug = feature.properties?.slug as string | undefined;
      if (!slug || !feature.geometry) continue;

      if (pointInGeometry(lat, lng, feature.geometry as { type: string; coordinates: number[][][] | number[][][][] })) {
        return { wardSlug: slug, lgdSlug };
      }
    }
  }
  return null;
}
