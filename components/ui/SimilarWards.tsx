"use client";

import { useMemo, useEffect, useRef } from "react";
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
  const preloadedRef = useRef(false);

  // Stagger-load all districts in the background for comparison
  useEffect(() => {
    if (preloadedRef.current) return;
    preloadedRef.current = true;

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

  const similar = useMemo(() => {
    const allWards: { ward: Ward; lgdSlug: string }[] = [];
    for (const [lgdSlug, cache] of wardCache.entries()) {
      for (const w of cache.wards) {
        allWards.push({ ward: w, lgdSlug });
      }
    }
    if (allWards.length < 20) return [];
    return findSimilarWards(ward, districtSlug, allWards, 5);
  }, [ward, districtSlug, wardCache]);

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
