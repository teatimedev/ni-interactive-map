"use client";

import type { District, Ward } from "@/lib/types";
import { fmtPct } from "@/lib/utils";
import StatCard from "@/components/ui/StatCard";
import StatRow from "@/components/ui/StatRow";
import SectionWrapper from "@/components/ui/SectionWrapper";
import BarChart from "@/components/Charts/BarChart";

interface HealthTabProps {
  data: District | null;
  ward: Ward | null;
}

function DistrictHealth({ data }: { data: District }) {
  const h = data.health;

  const healthBars = [
    { label: "Very Good", value: h.very_good_pct, color: "#27ae60" },
    { label: "Good", value: h.good_pct, color: "#2ecc71" },
    { label: "Fair", value: h.fair_pct, color: "#e8a838" },
    { label: "Bad", value: h.bad_pct, color: "#e67e22" },
    { label: "Very Bad", value: h.very_bad_pct, color: "#c0392b" },
  ];

  return (
    <>
      <SectionWrapper title="Life Expectancy" source="NISRA Health Inequalities 2024">
        <div className="grid grid-cols-2 gap-2">
          <StatCard
            value={data.life_expectancy_male.toFixed(1)}
            label="Male"
          />
          <StatCard
            value={data.life_expectancy_female.toFixed(1)}
            label="Female"
          />
        </div>
      </SectionWrapper>

      <SectionWrapper title="General Health" source="Census 2021">
        <BarChart items={healthBars} />
      </SectionWrapper>

      <SectionWrapper title="Disability &amp; Care" source="Census 2021">
        <StatRow
          label="Long-term condition"
          value={fmtPct(data.long_term_health_condition_pct)}
        />
        <StatRow
          label="Limited a lot"
          value={fmtPct(h.disability_limited_lot_pct)}
        />
        <StatRow
          label="Limited a little"
          value={fmtPct(h.disability_limited_little_pct)}
        />
        <StatRow label="Unpaid care" value={fmtPct(h.unpaid_care_pct)} />
      </SectionWrapper>
    </>
  );
}

function WardHealth({ ward }: { ward: Ward }) {
  const healthBars = [
    { label: "Very Good/Good", value: ward.very_good_good_health_pct, color: "#27ae60" },
    { label: "Fair", value: ward.fair_health_pct, color: "#e8a838" },
    { label: "Bad/Very Bad", value: ward.bad_very_bad_health_pct, color: "#c0392b" },
  ];

  return (
    <>
      <SectionWrapper title="General Health">
        <BarChart items={healthBars} />
      </SectionWrapper>

      <div className="stat-section">
        <p className="text-[11px] text-[#888] italic">
          Life expectancy and disability data not available at ward level.
        </p>
      </div>
    </>
  );
}

export default function HealthTab({ data, ward }: HealthTabProps) {
  if (ward) {
    return <WardHealth ward={ward} />;
  }
  if (data) {
    return <DistrictHealth data={data} />;
  }
  return null;
}
