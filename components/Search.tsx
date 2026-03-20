"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useMapState } from "@/hooks/useMapState";
import districts from "@/data/districts";

interface DistrictResult {
  type: "district";
  slug: string;
  name: string;
}

interface WardResult {
  type: "ward";
  slug: string;
  name: string;
  lgdSlug: string;
  lgdName: string;
}

type SearchResult = DistrictResult | WardResult;

export default function Search() {
  const { wardCache, selectDistrict, selectWard, setView, loadWardData } = useMapState();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(
    (q: string) => {
      const trimmed = q.trim();
      if (!trimmed) {
        setResults([]);
        setOpen(false);
        return;
      }

      const lower = trimmed.toLowerCase();

      // Districts — always available, max 5
      const districtMatches: DistrictResult[] = districts
        .filter((d) => d.name.toLowerCase().includes(lower))
        .slice(0, 5)
        .map((d) => ({ type: "district", slug: d.slug, name: d.name }));

      // Wards — only from loaded cache, max 5
      const wardMatches: WardResult[] = [];
      for (const [lgdSlug, cache] of wardCache.entries()) {
        if (wardMatches.length >= 5) break;
        const districtName =
          districts.find((d) => d.slug === lgdSlug)?.name ?? lgdSlug;
        for (const ward of cache.wards) {
          if (wardMatches.length >= 5) break;
          if (ward.name.toLowerCase().includes(lower)) {
            wardMatches.push({
              type: "ward",
              slug: ward.slug,
              name: ward.name,
              lgdSlug,
              lgdName: districtName,
            });
          }
        }
      }

      const combined = [...districtMatches, ...wardMatches];
      setResults(combined);
      setOpen(combined.length > 0);
    },
    [wardCache]
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(val), 100);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
      setResults([]);
      setExpanded(false);
    }
  }

  function handleSearchIconClick() {
    setExpanded(true);
    // Focus input on next tick after it becomes visible
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleSelectDistrict(slug: string) {
    setOpen(false);
    setQuery("");
    setResults([]);
    selectDistrict(slug);
    setView("district-detail");
    loadWardData(slug);
  }

  function handleSelectWard(lgdSlug: string, wardSlug: string) {
    setOpen(false);
    setQuery("");
    setResults([]);
    selectDistrict(lgdSlug);
    selectWard(wardSlug);
    setView("ward-detail");
    loadWardData(lgdSlug);
  }

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setExpanded(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const districtResults = results.filter(
    (r): r is DistrictResult => r.type === "district"
  );
  const wardResults = results.filter(
    (r): r is WardResult => r.type === "ward"
  );

  return (
    <div
      ref={containerRef}
      style={{ position: "fixed", top: 56, left: 16, zIndex: 1000 }}
    >
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#666", pointerEvents: "none", fontSize: 12 }}>
          🔍
        </span>
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-label="Search districts and wards"
          aria-expanded={open}
          aria-autocomplete="list"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Search districts and wards..."
          style={{
            background: "#2a2a2a", color: "#ccc", border: "1px solid #444", borderRadius: 6,
            paddingLeft: 28, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
            fontSize: 12, width: 220, fontFamily: "inherit", outline: "none",
          }}
        />
      </div>

      {open && results.length > 0 && (
        <div style={{ background: "#2a2a2a", border: "1px solid #444", borderRadius: 6, marginTop: 4, boxShadow: "0 4px 12px rgba(0,0,0,0.4)", maxHeight: 300, overflowY: "auto" }}>
          {districtResults.length > 0 && (
            <>
              <div style={{ fontSize: 10, color: "#666", textTransform: "uppercase", padding: "6px 12px" }}>Districts</div>
              {districtResults.map((r) => (
                <button
                  key={r.slug}
                  style={{ width: "100%", textAlign: "left", padding: "8px 12px", fontSize: 12, color: "#ccc", cursor: "pointer", background: "none", border: "none", fontFamily: "inherit" }}
                  onMouseDown={(e) => { e.preventDefault(); handleSelectDistrict(r.slug); }}
                >
                  {r.name}
                </button>
              ))}
            </>
          )}
          {wardResults.length > 0 && (
            <>
              <div style={{ fontSize: 10, color: "#666", textTransform: "uppercase", padding: "6px 12px" }}>Wards</div>
              {wardResults.map((r) => (
                <button
                  key={`${r.lgdSlug}/${r.slug}`}
                  style={{ width: "100%", textAlign: "left", padding: "8px 12px", fontSize: 12, color: "#ccc", cursor: "pointer", background: "none", border: "none", fontFamily: "inherit" }}
                  onMouseDown={(e) => { e.preventDefault(); handleSelectWard(r.lgdSlug, r.slug); }}
                >
                  {r.name} <span style={{ color: "#666" }}>— {r.lgdName}</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
