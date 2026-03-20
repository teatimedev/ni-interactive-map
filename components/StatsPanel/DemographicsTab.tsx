"use client";

import type { District, Ward } from "@/lib/types";
import { fmt, fmtPct } from "@/lib/utils";
import StatCard from "@/components/ui/StatCard";
import StatRow from "@/components/ui/StatRow";
import SectionWrapper from "@/components/ui/SectionWrapper";
import StackedBar from "@/components/Charts/StackedBar";

interface DemographicsTabProps {
  data: District | null;
  ward: Ward | null;
}

function DistrictDemographics({ data }: { data: District }) {
  const d = data.demographics;
  const popChange = d.population_change_pct;
  const changeColor = popChange >= 0 ? "#27ae60" : "#c0392b";

  const religionSegments = [
    { label: "Catholic", pct: d.catholic_pct, color: "#2d7a3a" },
    { label: "Protestant", pct: d.protestant_other_christian_pct, color: "#3a6fb0" },
    { label: "Other", pct: d.other_religion_pct, color: "#8e6fb0" },
    { label: "None", pct: d.no_religion_pct, color: "#666" },
  ];

  const birthSegments = [
    { label: "NI", pct: d.born_ni_pct, color: "#4a7c8a" },
    { label: "Rest UK", pct: d.born_rest_uk_pct, color: "#2980b9" },
    { label: "Ireland", pct: d.born_ireland_pct, color: "#27ae60" },
    { label: "EU", pct: d.born_eu_pct, color: "#e8a838" },
    { label: "Rest of World", pct: d.born_rest_world_pct, color: "#c0392b" },
  ];

  return (
    <>
      <SectionWrapper title="Population Change 2011 \u2192 2021" source="Census 2021">
        <div className="stat-cards">
          <StatCard value={fmt(d.population_2011)} label="2011" />
          <StatCard value={fmt(data.population)} label="2021" />
        </div>
        <p className="text-[12px] mt-1">
          <span style={{ color: changeColor }}>
            {popChange >= 0 ? "+" : ""}
            {fmtPct(popChange)}
          </span>
        </p>
      </SectionWrapper>

      <SectionWrapper title="Religion" source="Census 2021">
        <StackedBar segments={religionSegments} />
      </SectionWrapper>

      <SectionWrapper title="Country of Birth" source="Census 2021">
        <StackedBar segments={birthSegments} />
      </SectionWrapper>

      <SectionWrapper title="Language" source="Census 2021">
        <StatRow label="Irish speakers" value={fmtPct(d.irish_speakers_pct)} />
        <StatRow
          label="Ulster-Scots speakers"
          value={fmtPct(d.ulster_scots_speakers_pct)}
        />
      </SectionWrapper>

      {d.urban_rural && (
        <SectionWrapper title="Settlement">
          <StatRow label="Classification" value={d.urban_rural} />
        </SectionWrapper>
      )}
    </>
  );
}

function WardDemographics({ ward }: { ward: Ward }) {
  const religionSegments = [
    { label: "Catholic", pct: ward.catholic_pct, color: "#2d7a3a" },
    { label: "Protestant", pct: ward.protestant_other_christian_pct, color: "#3a6fb0" },
    { label: "Other", pct: ward.other_religion_pct, color: "#8e6fb0" },
    { label: "None", pct: ward.no_religion_pct, color: "#666" },
  ];

  const birthSegments = [
    { label: "NI", pct: ward.born_ni_pct, color: "#4a7c8a" },
    { label: "Rest UK", pct: ward.born_other_uk_pct, color: "#2980b9" },
    { label: "Ireland", pct: ward.born_roi_pct, color: "#27ae60" },
    { label: "Elsewhere", pct: ward.born_elsewhere_pct, color: "#e8a838" },
  ];

  return (
    <>
      {ward.population_2011 != null && (() => {
        const pctChange = ((ward.population - ward.population_2011) / ward.population_2011) * 100;
        const changeColor = pctChange >= 0 ? "#27ae60" : "#c0392b";
        return (
          <SectionWrapper title="Population Change 2011 → 2021">
            <div className="stat-cards">
              <StatCard value={fmt(ward.population_2011)} label="2011" />
              <StatCard value={fmt(ward.population)} label="2021" />
            </div>
            <p className="text-[12px] mt-1">
              <span style={{ color: changeColor }}>
                {pctChange >= 0 ? "+" : ""}{pctChange.toFixed(1)}%
              </span>
            </p>
          </SectionWrapper>
        );
      })()}

      <SectionWrapper title="Religion">
        <StackedBar segments={religionSegments} />
      </SectionWrapper>

      <SectionWrapper title="Country of Birth">
        <StackedBar segments={birthSegments} />
      </SectionWrapper>
    </>
  );
}

export default function DemographicsTab({ data, ward }: DemographicsTabProps) {
  if (ward) {
    return <WardDemographics ward={ward} />;
  }
  if (data) {
    return <DistrictDemographics data={data} />;
  }
  return null;
}
