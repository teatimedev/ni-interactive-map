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
      className="fixed top-4 left-[120px] z-[1000]"
    >
      {/* Mobile: collapsed icon-only button when not expanded */}
      {!expanded && (
        <button
          aria-label="Open search"
          onClick={handleSearchIconClick}
          className="sm:hidden flex items-center justify-center w-[44px] h-[44px] bg-[#2a2a2a] text-[#ccc] border border-[#444] rounded-md shadow-md hover:bg-[#3a3a3a]"
        >
          🔍
        </button>
      )}

      {/* Full input — always visible on sm+, conditionally on mobile */}
      <div className={`relative ${expanded ? "block" : "hidden sm:block"}`}>
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#666] pointer-events-none text-xs">
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
          className="bg-[#2a2a2a] text-[#ccc] border border-[#444] rounded-md pl-7 pr-3 py-2 text-xs w-[200px] outline-none focus:border-[#666] transition-colors min-h-[44px]"
        />
      </div>

      {open && results.length > 0 && (
        <div className="bg-[#2a2a2a] border border-[#444] rounded-md mt-1 shadow-lg max-h-[300px] overflow-y-auto">
          {districtResults.length > 0 && (
            <>
              <div className="text-[10px] text-[#666] uppercase px-3 py-1.5">
                Districts
              </div>
              {districtResults.map((r) => (
                <button
                  key={r.slug}
                  className="w-full text-left px-3 py-2 text-xs text-[#ccc] cursor-pointer hover:bg-[#3a3a3a]"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelectDistrict(r.slug);
                  }}
                >
                  {r.name}
                </button>
              ))}
            </>
          )}

          {wardResults.length > 0 && (
            <>
              <div className="text-[10px] text-[#666] uppercase px-3 py-1.5">
                Wards
              </div>
              {wardResults.map((r) => (
                <button
                  key={`${r.lgdSlug}/${r.slug}`}
                  className="w-full text-left px-3 py-2 text-xs text-[#ccc] cursor-pointer hover:bg-[#3a3a3a]"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelectWard(r.lgdSlug, r.slug);
                  }}
                >
                  {r.name}{" "}
                  <span className="text-[#666]">— {r.lgdName}</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
