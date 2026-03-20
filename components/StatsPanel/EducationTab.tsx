"use client";

import type { District, Ward } from "@/lib/types";
import { fmtPct } from "@/lib/utils";
import StatCard from "@/components/ui/StatCard";
import SectionWrapper from "@/components/ui/SectionWrapper";
import BarChart from "@/components/Charts/BarChart";

interface EducationTabProps {
  data: District | null;
  ward: Ward | null;
}

function DistrictEducation({ data }: { data: District }) {
  const e = data.education;

  const qualBars = [
    { label: "Degree+", value: e.degree_plus_pct, color: "#2980b9" },
    { label: "A-Level", value: e.a_level_pct, color: "#3498db" },
    { label: "GCSE", value: e.gcse_pct, color: "#7fb3d3" },
    ...(e.other_pct != null
      ? [{ label: "Other", value: e.other_pct, color: "#95a5a6" }]
      : []),
    { label: "None", value: e.no_qualifications_pct, color: "#666" },
  ];

  return (
    <>
      <SectionWrapper title="Qualifications" source="Census 2021">
        <div className="grid grid-cols-2 gap-2 mb-3">
          <StatCard value={fmtPct(e.degree_plus_pct)} label="Degree+" />
          <StatCard value={fmtPct(e.no_qualifications_pct)} label="No Quals" />
        </div>
      </SectionWrapper>

      <SectionWrapper title="Qualification Breakdown" source="Census 2021">
        <BarChart items={qualBars} />
      </SectionWrapper>
    </>
  );
}

function WardEducation({ ward }: { ward: Ward }) {
  const qualBars = [
    { label: "Level 4+", value: ward.level_4_plus_pct, color: "#2980b9" },
    { label: "Level 3", value: ward.level_3_pct, color: "#3498db" },
    { label: "Level 1-2", value: ward.level_1_2_pct, color: "#7fb3d3" },
    { label: "No Qualifications", value: ward.no_qualifications_pct, color: "#666" },
  ];

  return (
    <>
      <SectionWrapper title="Qualifications">
        <div className="grid grid-cols-2 gap-2 mb-3">
          <StatCard value={fmtPct(ward.level_4_plus_pct)} label="Degree+" />
          <StatCard
            value={fmtPct(ward.no_qualifications_pct)}
            label="No Quals"
          />
        </div>
      </SectionWrapper>

      <SectionWrapper title="Qualification Breakdown">
        <BarChart items={qualBars} />
      </SectionWrapper>
    </>
  );
}

export default function EducationTab({ data, ward }: EducationTabProps) {
  if (ward) {
    return <WardEducation ward={ward} />;
  }
  if (data) {
    return <DistrictEducation data={data} />;
  }
  return null;
}
