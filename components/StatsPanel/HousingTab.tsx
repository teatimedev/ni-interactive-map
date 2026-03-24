"use client";

import type { District, Ward } from "@/lib/types";
import { fmtMoney } from "@/lib/utils";
import StatCard from "@/components/ui/StatCard";
import ComparisonStatCard from "@/components/ui/ComparisonStatCard";
import SectionWrapper from "@/components/ui/SectionWrapper";
import { NI_AVG } from "@/lib/ni-averages";
import StackedBar from "@/components/Charts/StackedBar";

interface HousingTabProps {
  data: District | null;
  ward: Ward | null;
}

function DistrictHousing({ data }: { data: District }) {
  const h = data.housing;

  const tenureSegments = [
    { label: "Owner-occupied", pct: h.owner_occupied_pct, color: "#2980b9" },
    { label: "Private rented", pct: h.private_rented_pct, color: "#e8a838" },
    { label: "Social housing", pct: h.social_housing_pct, color: "#27ae60" },
  ];

  return (
    <>
      <SectionWrapper title="House Prices">
        <div className="stat-cards">
          <ComparisonStatCard
            value={h.median_house_price}
            label="Standardised Price"
            format={fmtMoney}
            niAvg={NI_AVG.median_house_price}
            higherBetter={true}
          />
        </div>
        {h.price_year && (
          <p className="text-[11px] text-[#888] mt-1">
            Source: LPS {h.price_year}
          </p>
        )}
      </SectionWrapper>

      <SectionWrapper title="Housing Tenure" source="Census 2021">
        <StackedBar segments={tenureSegments} />
      </SectionWrapper>
    </>
  );
}

function WardHousing({ ward }: { ward: Ward }) {
  const tenureSegments = [
    { label: "Owner-occupied", pct: ward.owner_occupied_pct, color: "#2980b9" },
    { label: "Private rented", pct: ward.private_rented_pct, color: "#e8a838" },
    { label: "Social housing", pct: ward.social_rented_pct, color: "#27ae60" },
  ];

  return (
    <>
      <SectionWrapper title="Housing Tenure">
        <StackedBar segments={tenureSegments} />
      </SectionWrapper>

      <div className="stat-section">
        <p className="text-[11px] text-[#888] italic">
          House prices are not available at ward level.
        </p>
      </div>
    </>
  );
}

export default function HousingTab({ data, ward }: HousingTabProps) {
  if (ward) {
    return <WardHousing ward={ward} />;
  }
  if (data) {
    return <DistrictHousing data={data} />;
  }
  return null;
}
