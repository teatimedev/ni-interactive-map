"use client";

import { useState } from "react";
import districts from "@/data/districts";
import { fmt, fmtPct, fmtMoney } from "@/lib/utils";
import Link from "next/link";

interface MetricConfig {
  label: string;
  getValue: (d: (typeof districts)[0]) => number;
  format: (n: number) => string;
  higherBetter: boolean;
}

const METRICS: Record<string, MetricConfig> = {
  population: {
    label: "Population",
    getValue: (d) => d.population,
    format: fmt,
    higherBetter: true,
  },
  density: {
    label: "Population Density",
    getValue: (d) => d.population_density_per_sq_km,
    format: (n) => fmt(Math.round(n)) + "/km\u00B2",
    higherBetter: true,
  },
  earnings: {
    label: "Median Earnings",
    getValue: (d) => d.median_annual_earnings_residence,
    format: fmtMoney,
    higherBetter: true,
  },
  employment: {
    label: "Employment Rate",
    getValue: (d) => d.employment_rate_pct,
    format: fmtPct,
    higherBetter: true,
  },
  unemployment: {
    label: "Unemployment",
    getValue: (d) => d.unemployment_rate_census_pct,
    format: fmtPct,
    higherBetter: false,
  },
  deprivation: {
    label: "% SOAs in Top 100 Deprived",
    getValue: (d) => d.nimdm_pct_in_top100,
    format: fmtPct,
    higherBetter: false,
  },
  life_exp_male: {
    label: "Male Life Expectancy",
    getValue: (d) => d.life_expectancy_male,
    format: (n) => n.toFixed(1),
    higherBetter: true,
  },
  life_exp_female: {
    label: "Female Life Expectancy",
    getValue: (d) => d.life_expectancy_female,
    format: (n) => n.toFixed(1),
    higherBetter: true,
  },
  house_price: {
    label: "House Price",
    getValue: (d) => d.housing.median_house_price,
    format: fmtMoney,
    higherBetter: true,
  },
  degree: {
    label: "% Degree-Educated",
    getValue: (d) => d.education.degree_plus_pct,
    format: fmtPct,
    higherBetter: true,
  },
  no_quals: {
    label: "% No Qualifications",
    getValue: (d) => d.education.no_qualifications_pct,
    format: fmtPct,
    higherBetter: false,
  },
  crime_rate: {
    label: "Crime Rate per 1,000",
    getValue: (d) => d.crime.rate_per_1000,
    format: (n) => n.toFixed(1),
    higherBetter: false,
  },
  catholic: {
    label: "% Catholic",
    getValue: (d) => d.demographics.catholic_pct,
    format: fmtPct,
    higherBetter: true,
  },
  protestant: {
    label: "% Protestant",
    getValue: (d) => d.demographics.protestant_other_christian_pct,
    format: fmtPct,
    higherBetter: true,
  },
  youngest: {
    label: "% Age 0-15",
    getValue: (d) => d.age_0_15_pct,
    format: fmtPct,
    higherBetter: true,
  },
  oldest: {
    label: "% Age 65+",
    getValue: (d) => d.age_65_plus_pct,
    format: fmtPct,
    higherBetter: true,
  },
  no_car: {
    label: "% No Car",
    getValue: (d) => d.transport.no_car_pct,
    format: fmtPct,
    higherBetter: false,
  },
};

export default function LeaderboardPage() {
  const [activeMetric, setActiveMetric] = useState("earnings");
  const metric = METRICS[activeMetric];

  const sorted = [...districts].sort((a, b) => {
    const diff = metric.getValue(b) - metric.getValue(a);
    return metric.higherBetter ? diff : -diff;
  });

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
            <Link href="/leaderboard/wards" style={{ color: "var(--accent-light)", textDecoration: "none", fontSize: 12 }}>
              Ward Leaderboard
            </Link>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-bright)", marginTop: 8 }}>
            District Leaderboard
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
            All 11 councils ranked by any metric
          </p>
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
            gridTemplateColumns: "40px 1fr 120px",
            padding: "10px 16px",
            background: "rgba(41,128,185,0.08)",
            borderBottom: "1px solid var(--border-light)",
            fontSize: 11,
            color: "var(--text-secondary)",
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}>
            <span>#</span>
            <span>District</span>
            <span style={{ textAlign: "right" }}>{metric.label}</span>
          </div>

          {/* Rows */}
          {sorted.map((d, i) => {
            const value = metric.getValue(d);
            const maxValue = metric.getValue(sorted[0]);
            const barPct = maxValue > 0 ? (value / maxValue) * 100 : 0;

            return (
              <Link
                key={d.slug}
                href={`/district/${d.slug}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "40px 1fr 120px",
                  padding: "12px 16px",
                  borderBottom: i < sorted.length - 1 ? "1px solid var(--border-light)" : "none",
                  background: i % 2 === 1 ? "rgba(255,255,255,0.02)" : "transparent",
                  transition: "background 0.15s",
                  cursor: "pointer",
                  alignItems: "center",
                  position: "relative",
                }}>
                  {/* Rank */}
                  <span style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: i === 0 ? "var(--positive)" : i <= 2 ? "var(--accent-light)" : "var(--text-secondary)",
                  }}>
                    {i + 1}
                  </span>

                  {/* District name */}
                  <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>
                    {d.name}
                  </span>

                  {/* Value with background bar */}
                  <div style={{ textAlign: "right", position: "relative" }}>
                    <div style={{
                      position: "absolute",
                      right: 0,
                      top: -4,
                      bottom: -4,
                      width: `${barPct}%`,
                      background: i === 0 ? "rgba(39,174,96,0.12)" : "rgba(41,128,185,0.08)",
                      borderRadius: 3,
                    }} />
                    <span style={{
                      position: "relative",
                      fontSize: 13,
                      fontWeight: 600,
                      color: i === 0 ? "var(--positive)" : "var(--text-primary)",
                    }}>
                      {metric.format(value)}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 16, fontSize: 11, color: "var(--text-muted)" }}>
          Sources: NISRA Census 2021, NIMDM 2017, PSNI 2024/25, LPS 2024, ASHE 2024, Electoral Office NI
        </div>
      </div>
    </div>
  );
}
