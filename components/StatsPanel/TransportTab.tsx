"use client";

import type { District, Ward } from "@/lib/types";
import { fmtPct } from "@/lib/utils";
import StatRow from "@/components/ui/StatRow";
import SectionWrapper from "@/components/ui/SectionWrapper";
import StackedBar from "@/components/Charts/StackedBar";
import BarChart from "@/components/Charts/BarChart";

interface TransportTabProps {
  data: District | null;
  ward: Ward | null;
}

function DistrictTransport({ data }: { data: District }) {
  const t = data.transport;

  const carSegments = [
    { label: "No car", pct: t.no_car_pct, color: "#c0392b" },
    { label: "1 car", pct: t.one_car_pct, color: "#e8a838" },
    { label: "2+ cars", pct: t.two_plus_cars_pct, color: "#27ae60" },
  ];

  const travelBars: { label: string; value: number; color: string }[] = [];
  if (t.drive_pct != null)
    travelBars.push({ label: "Car/Van", value: t.drive_pct, color: "#2980b9" });
  if (t.public_transport_pct != null)
    travelBars.push({ label: "Public Transport", value: t.public_transport_pct, color: "#27ae60" });
  if (t.walk_cycle_pct != null)
    travelBars.push({ label: "Walk/Cycle", value: t.walk_cycle_pct, color: "#e8a838" });
  if (t.work_from_home_pct != null)
    travelBars.push({ label: "Work from Home", value: t.work_from_home_pct, color: "#8e44ad" });
  if (t.other_pct != null)
    travelBars.push({ label: "Other", value: t.other_pct, color: "#666" });

  return (
    <>
      <SectionWrapper title="Car Ownership" source="Census 2021">
        <StackedBar segments={carSegments} />
      </SectionWrapper>

      {travelBars.length > 0 && (
        <SectionWrapper title="Travel to Work" source="Census 2021">
          <BarChart items={travelBars} />
        </SectionWrapper>
      )}

      {t.avg_broadband_mbps != null && (
        <SectionWrapper title="Broadband" source="Ofcom 2024">
          <StatRow
            label="Avg download speed"
            value={`${t.avg_broadband_mbps.toFixed(1)} Mbps`}
          />
        </SectionWrapper>
      )}
    </>
  );
}

function WardTransport({ ward }: { ward: Ward }) {
  const carSegments = [
    { label: "No car", pct: ward.no_cars_pct, color: "#c0392b" },
    { label: "1 car", pct: ward.one_car_pct, color: "#e8a838" },
    { label: "2+ cars", pct: ward.two_plus_cars_pct, color: "#27ae60" },
  ];

  const travelBars = [
    { label: "Car/Van", value: ward.drive_to_work_pct, color: "#2980b9" },
    { label: "Public Transport", value: ward.public_transport_pct, color: "#27ae60" },
    { label: "Walk/Cycle", value: ward.walk_cycle_pct, color: "#e8a838" },
    { label: "Work from Home", value: ward.work_from_home_pct, color: "#8e44ad" },
  ];

  return (
    <>
      <SectionWrapper title="Car Ownership">
        <StackedBar segments={carSegments} />
      </SectionWrapper>

      <SectionWrapper title="Travel to Work">
        <BarChart items={travelBars} />
      </SectionWrapper>
    </>
  );
}

export default function TransportTab({ data, ward }: TransportTabProps) {
  if (ward) {
    return <WardTransport ward={ward} />;
  }
  if (data) {
    return <DistrictTransport data={data} />;
  }
  return null;
}
