"use client";

import type { District, Ward } from "@/lib/types";
import { fmt, fmtPct, fmtMoney } from "@/lib/utils";
import { getPartyColor } from "@/lib/colors";
import StatCard from "@/components/ui/StatCard";
import StatRow from "@/components/ui/StatRow";
import DeprivationMeter from "@/components/ui/DeprivationMeter";
import DonutChart from "@/components/Charts/DonutChart";
import BarChart from "@/components/Charts/BarChart";

interface OverviewTabProps {
  data: District | null;
  ward: Ward | null;
}

function SectionWrapper({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="stat-section">
      <h3 >
        {title}
      </h3>
      {children}
    </div>
  );
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
      <SectionWrapper title="Population">
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

      <SectionWrapper title="Age Breakdown">
        <DonutChart segments={ageSegments} />
      </SectionWrapper>

      <SectionWrapper title="Economy">
        <StatRow
          label="Median Earnings"
          value={fmtMoney(data.median_annual_earnings_residence)}
        />
        <StatRow
          label="Employment Rate"
          value={fmtPct(data.employment_rate_pct)}
        />
        <StatRow
          label="Unemployment"
          value={fmtPct(data.unemployment_rate_census_pct)}
        />
      </SectionWrapper>

      <SectionWrapper title="Deprivation (NIMDM 2017)">
        <StatRow
          label="SOAs in top 100"
          value={`${data.nimdm_soas_in_top100} of ${data.nimdm_total_soas}`}
        />
        <DeprivationMeter position={data.nimdm_pct_in_top100 * (100 / 30)} />
      </SectionWrapper>

      <SectionWrapper title="2022 Assembly Election">
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

function WardOverview({ ward }: { ward: Ward }) {
  const ageSegments = [
    { label: "0-15", value: ward.age_0_15_pct, color: "#4a7c8a" },
    { label: "16-64", value: ward.age_16_64_pct, color: "#2980b9" },
    { label: "65+", value: ward.age_65_plus_pct, color: "#7fb3d3" },
  ];

  const deprivationPosition = ((462 - ward.deprivation_rank) / 462) * 100;

  const subDomains: { label: string; rank: number }[] = [
    { label: "Income", rank: ward.income_rank },
    { label: "Employment", rank: ward.employment_rank },
    { label: "Health", rank: ward.health_rank },
    { label: "Education", rank: ward.education_rank },
    { label: "Access to Services", rank: ward.access_rank },
    { label: "Living Environment", rank: ward.living_env_rank },
    { label: "Crime & Disorder", rank: ward.crime_rank },
  ];

  return (
    <>
      <SectionWrapper title="Population">
        <div className="stat-cards" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
          <StatCard value={fmt(ward.population)} label="People" />
          <StatCard value={fmt(ward.male)} label="Male" />
          <StatCard value={fmt(ward.female)} label="Female" />
        </div>
        {ward.urban_rural && (
          <p className="text-[12px] text-[#999] mt-1">{ward.urban_rural}</p>
        )}
      </SectionWrapper>

      <SectionWrapper title="Age Breakdown">
        <DonutChart segments={ageSegments} />
      </SectionWrapper>

      <SectionWrapper title="Deprivation">
        <StatRow
          label="Overall Rank"
          value={`${ward.deprivation_rank} of 462`}
        />
        <DeprivationMeter position={deprivationPosition} />
        <div className="mt-3 space-y-0.5">
          {subDomains.map((d) => (
            <StatRow
              key={d.label}
              label={d.label}
              value={`${d.rank}/462`}
            />
          ))}
        </div>
      </SectionWrapper>
    </>
  );
}

export default function OverviewTab({ data, ward }: OverviewTabProps) {
  if (ward) {
    return <WardOverview ward={ward} />;
  }
  if (data) {
    return <DistrictOverview data={data} />;
  }
  return null;
}
