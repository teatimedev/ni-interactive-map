"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Ward } from "@/lib/types";
import { computeLivabilityScore, scoreToGrade } from "@/lib/scoring";
import { fmt, fmtPct } from "@/lib/utils";

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

interface WardEntry {
  ward: Ward;
  lgdSlug: string;
  lgdName: string;
  livabilityScore: number;
  grade: { grade: string; color: string };
}

interface MetricConfig {
  label: string;
  getValue: (e: WardEntry) => number;
  format: (n: number) => string;
  higherBetter: boolean;
}

const METRICS: Record<string, MetricConfig> = {
  livability: {
    label: "Livability Score",
    getValue: (e) => e.livabilityScore,
    format: (n) => n.toString(),
    higherBetter: true,
  },
  population: {
    label: "Population",
    getValue: (e) => e.ward.population,
    format: fmt,
    higherBetter: true,
  },
  degree: {
    label: "% Degree-Educated",
    getValue: (e) => e.ward.level_4_plus_pct,
    format: fmtPct,
    higherBetter: true,
  },
  no_quals: {
    label: "% No Qualifications",
    getValue: (e) => e.ward.no_qualifications_pct,
    format: fmtPct,
    higherBetter: false,
  },
  owner_occupied: {
    label: "% Owner-Occupied",
    getValue: (e) => e.ward.owner_occupied_pct,
    format: fmtPct,
    higherBetter: true,
  },
  social_rented: {
    label: "% Social Rented",
    getValue: (e) => e.ward.social_rented_pct,
    format: fmtPct,
    higherBetter: true,
  },
  catholic: {
    label: "% Catholic",
    getValue: (e) => e.ward.catholic_pct,
    format: fmtPct,
    higherBetter: true,
  },
  protestant: {
    label: "% Protestant",
    getValue: (e) => e.ward.protestant_other_christian_pct,
    format: fmtPct,
    higherBetter: true,
  },
  no_car: {
    label: "% No Car",
    getValue: (e) => e.ward.no_cars_pct,
    format: fmtPct,
    higherBetter: false,
  },
  bad_health: {
    label: "% Bad Health",
    getValue: (e) => e.ward.bad_very_bad_health_pct,
    format: fmtPct,
    higherBetter: false,
  },
  deprivation: {
    label: "Deprivation Rank",
    getValue: (e) => e.ward.deprivation_rank,
    format: (n) => n.toString(),
    higherBetter: true,
  },
  age_young: {
    label: "% Age 0-15",
    getValue: (e) => e.ward.age_0_15_pct,
    format: fmtPct,
    higherBetter: true,
  },
  age_old: {
    label: "% Age 65+",
    getValue: (e) => e.ward.age_65_plus_pct,
    format: fmtPct,
    higherBetter: true,
  },
  crime_rate: {
    label: "Crime Rate per 1,000",
    getValue: (e) => e.ward.crime_rate_per_1000 ?? 0,
    format: (n) => n.toFixed(1),
    higherBetter: false,
  },
};

const PAGE_SIZE = 50;

export default function WardLeaderboardPage() {
  const [allWards, setAllWards] = useState<WardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMetric, setActiveMetric] = useState("livability");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  useEffect(() => {
    async function loadWards() {
      const results = await Promise.all(
        DISTRICT_SLUGS.map(async (slug) => {
          const res = await fetch(`/data/wards/${slug}.json`);
          const data = await res.json();
          return { lgdSlug: data.lgdSlug || slug, lgdName: data.lgd as string, wards: data.wards as Ward[] };
        })
      );

      const entries: WardEntry[] = [];
      for (const { lgdSlug, lgdName, wards } of results) {
        for (const ward of wards) {
          const livabilityScore = computeLivabilityScore(ward);
          entries.push({
            ward,
            lgdSlug,
            lgdName,
            livabilityScore,
            grade: scoreToGrade(livabilityScore),
          });
        }
      }
      setAllWards(entries);
      setLoading(false);
    }
    loadWards();
  }, []);

  const metric = METRICS[activeMetric];

  const districtNames = useMemo(() => {
    const names = new Set<string>();
    for (const e of allWards) names.add(e.lgdName);
    return Array.from(names).sort();
  }, [allWards]);

  const filtered = useMemo(() => {
    let list = allWards;
    if (districtFilter !== "all") {
      list = list.filter((e) => e.lgdName === districtFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((e) => e.ward.name.toLowerCase().includes(q));
    }
    return list;
  }, [allWards, districtFilter, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const diff = metric.getValue(b) - metric.getValue(a);
      return metric.higherBetter ? diff : -diff;
    });
  }, [filtered, metric]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageItems = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [activeMetric, districtFilter, search]);

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        color: "var(--text-primary)",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 40,
            height: 40,
            border: "3px solid var(--border)",
            borderTop: "3px solid var(--accent-light)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 16px",
          }} />
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>Loading 462 wards...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    );
  }

  const maxValue = sorted.length > 0 ? metric.getValue(sorted[0]) : 1;

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-primary)",
      color: "var(--text-primary)",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 8 }}>
            <Link href="/" style={{ color: "var(--accent-light)", textDecoration: "none", fontSize: 12 }}>
              &larr; Back to Map
            </Link>
            <Link href="/leaderboard" style={{ color: "var(--accent-light)", textDecoration: "none", fontSize: 12 }}>
              District Leaderboard
            </Link>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-bright)", marginTop: 8 }}>
            Ward Leaderboard
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
            {districtFilter === "all"
              ? `${sorted.length} of 462 wards across Northern Ireland`
              : `${sorted.length} wards in ${districtFilter}`}
            {search.trim() ? ` matching "${search.trim()}"` : ""}
          </p>
        </div>

        {/* Search + District filter */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Search wards..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: "1 1 200px",
              padding: "8px 12px",
              fontSize: 13,
              background: "var(--bg-panel)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              color: "var(--text-primary)",
              outline: "none",
            }}
          />
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              fontSize: 13,
              background: "var(--bg-panel)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              color: "var(--text-primary)",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="all">All NI</option>
            {districtNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        {/* Metric selector */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
          {Object.entries(METRICS).map(([key, m]) => (
            <button
              key={key}
              className={`btn-map ${activeMetric === key ? "active" : ""}`}
              style={{ fontSize: 11, padding: "5px 10px" }}
              onClick={() => setActiveMetric(key)}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{
          background: "var(--bg-panel)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          overflow: "hidden",
        }}>
          {/* Table header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: activeMetric === "livability"
              ? "40px 1fr 50px 80px"
              : "40px 1fr 100px",
            padding: "10px 16px",
            background: "rgba(41,128,185,0.08)",
            borderBottom: "1px solid var(--border-light)",
            fontSize: 11,
            color: "var(--text-secondary)",
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}>
            <span>#</span>
            <span>Ward</span>
            {activeMetric === "livability" && <span style={{ textAlign: "center" }}>Grade</span>}
            <span style={{ textAlign: "right" }}>{activeMetric === "livability" ? "Score" : metric.label}</span>
          </div>

          {/* Rows */}
          {pageItems.length === 0 && (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-secondary)", fontSize: 14 }}>
              No wards found
            </div>
          )}
          {pageItems.map((entry, i) => {
            const globalRank = page * PAGE_SIZE + i;
            const value = metric.getValue(entry);
            const barPct = maxValue > 0 ? (value / maxValue) * 100 : 0;
            const isTop3 = globalRank < 3;
            const isBottom10 = globalRank >= sorted.length - 10;

            let rowBg = globalRank % 2 === 1 ? "rgba(255,255,255,0.02)" : "transparent";
            if (isTop3) rowBg = "rgba(39,174,96,0.06)";
            else if (isBottom10) rowBg = "rgba(192,57,43,0.06)";

            const rankColor = globalRank === 0
              ? "#f1c40f"
              : globalRank === 1
                ? "#bdc3c7"
                : globalRank === 2
                  ? "#cd7f32"
                  : isBottom10
                    ? "var(--negative)"
                    : "var(--text-secondary)";

            return (
              <Link
                key={`${entry.lgdSlug}-${entry.ward.slug}`}
                href={`/ward/${entry.lgdSlug}/${entry.ward.slug}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div style={{
                  display: "grid",
                  gridTemplateColumns: activeMetric === "livability"
                    ? "40px 1fr 50px 80px"
                    : "40px 1fr 100px",
                  padding: "10px 16px",
                  borderBottom: i < pageItems.length - 1 ? "1px solid var(--border-light)" : "none",
                  background: rowBg,
                  transition: "background 0.15s",
                  cursor: "pointer",
                  alignItems: "center",
                  position: "relative",
                }}>
                  {/* Rank */}
                  <span style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: rankColor,
                  }}>
                    {globalRank + 1}
                  </span>

                  {/* Ward + district */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "var(--text-primary)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}>
                      {entry.ward.name.charAt(0) + entry.ward.name.slice(1).toLowerCase()}
                    </div>
                    <div style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}>
                      {entry.lgdName}
                    </div>
                  </div>

                  {/* Grade badge (livability only) */}
                  {activeMetric === "livability" && (
                    <div style={{ textAlign: "center" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 700,
                        background: entry.grade.color + "22",
                        color: entry.grade.color,
                        border: `1px solid ${entry.grade.color}44`,
                      }}>
                        {entry.grade.grade}
                      </span>
                    </div>
                  )}

                  {/* Value with background bar */}
                  <div style={{ textAlign: "right", position: "relative" }}>
                    <div style={{
                      position: "absolute",
                      right: 0,
                      top: -4,
                      bottom: -4,
                      width: `${barPct}%`,
                      background: isTop3 ? "rgba(39,174,96,0.12)" : "rgba(41,128,185,0.08)",
                      borderRadius: 3,
                    }} />
                    <span style={{
                      position: "relative",
                      fontSize: 13,
                      fontWeight: 600,
                      color: isTop3 ? "var(--positive)" : "var(--text-primary)",
                    }}>
                      {metric.format(value)}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
            marginTop: 16,
            flexWrap: "wrap",
          }}>
            <button
              className="btn-map"
              style={{ fontSize: 12, padding: "6px 12px" }}
              onClick={() => setPage(0)}
              disabled={page === 0}
            >
              First
            </button>
            <button
              className="btn-map"
              style={{ fontSize: 12, padding: "6px 12px" }}
              onClick={() => setPage(page - 1)}
              disabled={page === 0}
            >
              &larr; Prev
            </button>
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              Page {page + 1} of {totalPages}
            </span>
            <button
              className="btn-map"
              style={{ fontSize: 12, padding: "6px 12px" }}
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages - 1}
            >
              Next &rarr;
            </button>
            <button
              className="btn-map"
              style={{ fontSize: 12, padding: "6px 12px" }}
              onClick={() => setPage(totalPages - 1)}
              disabled={page >= totalPages - 1}
            >
              Last
            </button>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 16, fontSize: 11, color: "var(--text-muted)" }}>
          Sources: NISRA Census 2021, NIMDM 2017
        </div>
      </div>
    </div>
  );
}
