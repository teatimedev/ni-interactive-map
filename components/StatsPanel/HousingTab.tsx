"use client";

import type { District, Ward } from "@/lib/types";
import { fmtMoney } from "@/lib/utils";
import StatCard from "@/components/ui/StatCard";
import StackedBar from "@/components/Charts/StackedBar";

interface HousingTabProps {
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
    <div className="px-5 py-3.5 border-b border-[#2a2a2a]">
      <h3 className="text-xs text-[#888] uppercase tracking-wider mb-2.5 font-medium">
        {title}
      </h3>
      {children}
    </div>
  );
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
        <div className="grid grid-cols-2 gap-2 mb-2">
          <StatCard value={fmtMoney(h.median_house_price)} label="Median" />
          <StatCard value={fmtMoney(h.avg_house_price)} label="Average" />
        </div>
        {h.price_year && (
          <p className="text-[11px] text-[#888] mt-1">
            Source: LPS {h.price_year}
          </p>
        )}
      </SectionWrapper>

      <SectionWrapper title="Housing Tenure">
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

      <div className="px-5 py-3.5 border-b border-[#2a2a2a]">
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
