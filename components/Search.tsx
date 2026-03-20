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

function highlightMatch(text: string, query: string) {
  if (!query) return <>{text}</>;
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span className="search-result-highlight">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function Search() {
  const { wardCache, selectDistrict, selectWard, setView, loadWardData } = useMapState();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
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

      const districtMatches: DistrictResult[] = districts
        .filter((d) => d.name.toLowerCase().includes(lower))
        .slice(0, 5)
        .map((d) => ({ type: "district", slug: d.slug, name: d.name }));

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
      setActiveIndex(-1);
    },
    [wardCache]
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(val), 100);
  }

  function handleSelectDistrict(slug: string) {
    setOpen(false);
    setExpanded(false);
    setQuery("");
    setResults([]);
    selectDistrict(slug);
    setView("district-detail");
    loadWardData(slug);
  }

  function handleSelectWard(lgdSlug: string, wardSlug: string) {
    setOpen(false);
    setExpanded(false);
    setQuery("");
    setResults([]);
    selectDistrict(lgdSlug);
    selectWard(wardSlug);
    setView("ward-detail");
    loadWardData(lgdSlug);
  }

  function selectResult(result: SearchResult) {
    if (result.type === "district") {
      handleSelectDistrict(result.slug);
    } else {
      handleSelectWard(result.lgdSlug, result.slug);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      setExpanded(false);
      setQuery("");
      setResults([]);
      return;
    }

    if (!open || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      selectResult(results[activeIndex]);
    }
  }

  useEffect(() => {
    const media = window.matchMedia("(max-width: 768px)");
    const updateMobile = () => {
      const mobile = media.matches;
      setIsMobile(mobile);
      if (!mobile) {
        setExpanded(false);
      }
    };

    updateMobile();
    media.addEventListener("change", updateMobile);
    return () => media.removeEventListener("change", updateMobile);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        if (isMobile) setExpanded(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobile]);

  useEffect(() => {
    if (!expanded || !isMobile) return;
    inputRef.current?.focus();
  }, [expanded, isMobile]);

  function handleExpand() {
    setExpanded(true);
  }

  function handleCollapse() {
    setOpen(false);
    setExpanded(false);
    setQuery("");
    setResults([]);
  }

  const districtResults = results.filter(
    (r): r is DistrictResult => r.type === "district"
  );
  const wardResults = results.filter(
    (r): r is WardResult => r.type === "ward"
  );

  // Track flat index for keyboard nav
  let flatIndex = 0;

  return (
    <div
      ref={containerRef}
      className={`search-container ${expanded ? "is-expanded" : ""}`}
    >
      {isMobile && !expanded ? (
        <button
          type="button"
          className="search-fab"
          aria-label="Open search"
          onClick={handleExpand}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
      ) : (
      <div style={{ position: "relative" }}>
        <svg
          style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#666"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-label="Search districts and wards"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `search-result-${activeIndex}` : undefined}
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (isMobile && !query.trim()) {
              window.setTimeout(() => {
                if (!containerRef.current?.contains(document.activeElement)) {
                  handleCollapse();
                }
              }, 0);
            }
          }}
          placeholder="Search districts and wards..."
          className="btn-map"
          style={{
            paddingLeft: 28, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
            width: 220, outline: "none",
          }}
        />
        {isMobile && (
          <button
            type="button"
            className="search-close"
            aria-label="Close search"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleCollapse}
          >
            &times;
          </button>
        )}
      </div>
      )}

      {open && results.length > 0 && (
        <div className="search-dropdown" style={{ background: "#2a2a2a", border: "1px solid #444", borderRadius: 6, marginTop: 4, boxShadow: "0 4px 12px rgba(0,0,0,0.4)", maxHeight: 300, overflowY: "auto" }} role="listbox">
          {districtResults.length > 0 && (
            <>
              <div className="search-group-label">Districts</div>
              {districtResults.map((r) => {
                const idx = flatIndex++;
                return (
                  <button
                    key={r.slug}
                    id={`search-result-${idx}`}
                    role="option"
                    aria-selected={activeIndex === idx}
                    className={`search-result ${activeIndex === idx ? "active" : ""}`}
                    onMouseDown={(e) => { e.preventDefault(); handleSelectDistrict(r.slug); }}
                    onMouseEnter={() => setActiveIndex(idx)}
                  >
                    {highlightMatch(r.name, query)}
                  </button>
                );
              })}
            </>
          )}
          {wardResults.length > 0 && (
            <>
              <div className="search-group-label">Wards</div>
              {wardResults.map((r) => {
                const idx = flatIndex++;
                return (
                  <button
                    key={`${r.lgdSlug}/${r.slug}`}
                    id={`search-result-${idx}`}
                    role="option"
                    aria-selected={activeIndex === idx}
                    className={`search-result ${activeIndex === idx ? "active" : ""}`}
                    onMouseDown={(e) => { e.preventDefault(); handleSelectWard(r.lgdSlug, r.slug); }}
                    onMouseEnter={() => setActiveIndex(idx)}
                  >
                    {highlightMatch(r.name, query)} <span className="search-result-sub">\u2014 {r.lgdName}</span>
                  </button>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
