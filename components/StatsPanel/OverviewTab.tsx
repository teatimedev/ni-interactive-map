"use client";

import type { District, Ward } from "@/lib/types";
import { fmt, fmtPct, fmtMoney } from "@/lib/utils";
import { getPartyColor } from "@/lib/colors";
import { scoreToGrade } from "@/lib/scoring";
import StatCard from "@/components/ui/StatCard";
import ComparisonStatCard from "@/components/ui/ComparisonStatCard";
import StatRow from "@/components/ui/StatRow";
import { NI_AVG } from "@/lib/ni-averages";
import SectionWrapper from "@/components/ui/SectionWrapper";
import DeprivationMeter from "@/components/ui/DeprivationMeter";
import WardRankCard from "@/components/ui/WardRankCard";
import WardTags from "@/components/ui/WardTags";
import SimilarWards from "@/components/ui/SimilarWards";
import DonutChart from "@/components/Charts/DonutChart";
import BarChart from "@/components/Charts/BarChart";

interface OverviewTabProps {
  data: District | null;
  ward: Ward | null;
  districtSlug?: string;
}

function DistrictOverview({ data }: { data: District }) {
  const popChange = data.demographics.population_change_pct;
  const changeColor = popChange >= 0 ? "#27ae60" : "#c0392b";
  const changeArrow = popChange >= 0 ? "\u25B2" : "\u25BC";

  const ageSegments = [
    { label: "0-15", value: data.age_0_15_pct, color: "#4a7c8a" },
    { label: "16-64", value: data.age_16_64_pct, color: "#2980b9" },
    { label: "65+", value: data.age_65_plus_pct, color: "#7fb3d3" },
  ];

  const electionBars = data.assembly_2022.top_parties.map((p) => ({
    label: p.party,
    value: p.approx_vote_share,
    color: getPartyColor(p.party),
  }));

  return (
    <>
      <SectionWrapper title="Population" source="Census 2021">
        <div className="stat-cards">
          <StatCard value={fmt(data.population)} label="People" />
          <StatCard
            value={fmt(data.population_density_per_sq_km)}
            label="per km\u00B2"
          />
        </div>
        <div className="flex items-center gap-1 text-[12px] mb-1">
          <span style={{ color: changeColor }}>
            {changeArrow} {fmtPct(Math.abs(popChange))}
          </span>
          <span className="text-[#999]">since 2011</span>
        </div>
        <StatRow
          label="Area"
          value={`${data.area_sq_km.toFixed(1)} km\u00B2`}
        />
      </SectionWrapper>

      <SectionWrapper title="Age Breakdown" source="Census 2021">
        <DonutChart segments={ageSegments} />
      </SectionWrapper>

      <SectionWrapper title="Economy" source="ASHE 2024 / Census 2021">
        <div className="stat-cards">
          <ComparisonStatCard
            value={data.median_annual_earnings_residence}
            label="Median Earnings"
            format={fmtMoney}
            niAvg={NI_AVG.median_earnings}
            higherBetter={true}
          />
          <ComparisonStatCard
            value={data.employment_rate_pct}
            label="Employment"
            format={fmtPct}
            niAvg={NI_AVG.employment_rate}
            higherBetter={true}
          />
        </div>
        <div className="stat-cards" style={{ marginTop: 10 }}>
          <ComparisonStatCard
            value={data.unemployment_rate_census_pct}
            label="Unemployment"
            format={fmtPct}
            niAvg={NI_AVG.unemployment_rate}
            higherBetter={false}
          />
        </div>
      </SectionWrapper>

      <SectionWrapper title="Livability Score" source="NIMDM 2017 (ward average)">
        {(() => {
          const { grade, color } = scoreToGrade(data.livability_score);
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 8,
                background: color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                fontWeight: 700,
                color: "#fff",
                boxShadow: `0 2px 8px ${color}40`,
              }}>
                {grade}
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-bright)" }}>
                  {data.livability_score}/100
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  Average of ward livability scores
                </div>
              </div>
            </div>
          );
        })()}
      </SectionWrapper>

      <SectionWrapper title="Deprivation (NIMDM 2017)">
        <StatRow
          label="SOAs in top 100"
          value={`${data.nimdm_soas_in_top100} of ${data.nimdm_total_soas}`}
        />
        <DeprivationMeter position={data.nimdm_pct_in_top100 * (100 / 30)} />
      </SectionWrapper>

      <SectionWrapper title="2022 Assembly Election" source="Electoral Office NI 2022">
        {data.assembly_2022.note && (
          <p className="text-[11px] text-[#888] mb-2">
            {data.assembly_2022.note}
          </p>
        )}
        <BarChart items={electionBars} />
      </SectionWrapper>
    </>
  );
}

function WardOverview({ ward, districtSlug }: { ward: Ward; districtSlug: string }) {
  const ageSegments = [
    { label: "0-15", value: ward.age_0_15_pct, color: "#4a7c8a" },
    { label: "16-64", value: ward.age_16_64_pct, color: "#2980b9" },
    { label: "65+", value: ward.age_65_plus_pct, color: "#7fb3d3" },
  ];

  return (
    <>
      <div className="stat-section">
        <WardRankCard ward={ward} districtSlug={districtSlug} />
      </div>

      <SectionWrapper title="Population" source="Census 2021">
        <div className="stat-cards" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
          <StatCard value={fmt(ward.population)} label="People" />
          <StatCard value={fmt(ward.male)} label="Male" />
          <StatCard value={fmt(ward.female)} label="Female" />
        </div>
        {ward.urban_rural && (
          <p className="text-[12px] text-[#999] mt-1">{ward.urban_rural}</p>
        )}
        {ward.population_2011 != null && (() => {
          const pctChange = ((ward.population - ward.population_2011) / ward.population_2011) * 100;
          return (
            <StatRow
              label="Since 2011"
              value={<>
                <span style={{ color: pctChange > 0 ? "var(--positive)" : "var(--negative)" }}>
                  {pctChange > 0 ? "+" : ""}{pctChange.toFixed(1)}%
                </span>
                <span style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: 4 }}>
                  ({ward.population_2011.toLocaleString()} → {ward.population.toLocaleString()})
                </span>
              </>}
            />
          );
        })()}
      </SectionWrapper>

      <SectionWrapper title="Age Breakdown" source="Census 2021">
        <DonutChart segments={ageSegments} />
      </SectionWrapper>

      <WardTags wardSlug={ward.slug} lgdSlug={districtSlug} />

      <SectionWrapper title="Explore">
        <SimilarWards ward={ward} districtSlug={districtSlug} />
      </SectionWrapper>
    </>
  );
}

export default function OverviewTab({ data, ward, districtSlug }: OverviewTabProps) {
  if (ward && districtSlug) {
    return <WardOverview ward={ward} districtSlug={districtSlug} />;
  }
  if (data) {
    return <DistrictOverview data={data} />;
  }
  return null;
}
