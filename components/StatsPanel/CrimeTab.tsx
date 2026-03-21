"use client";

import type { District, Ward } from "@/lib/types";
import { fmt } from "@/lib/utils";
import StatCard from "@/components/ui/StatCard";
import StatRow from "@/components/ui/StatRow";
import SectionWrapper from "@/components/ui/SectionWrapper";
import BarChart from "@/components/Charts/BarChart";

interface CrimeTabProps {
  data: District | null;
  ward?: Ward | null;
}

export default function CrimeTab({ data, ward }: CrimeTabProps) {
  // Ward crime view
  if (ward) {
    if (ward.crime_total == null) {
      return (
        <SectionWrapper title="Recorded Crime">
          <p style={{ fontSize: 13, color: "var(--text-secondary)", padding: "8px 0" }}>
            Crime data not yet available for this ward.
          </p>
        </SectionWrapper>
      );
    }

    const crimeTypes: { label: string; value: number; color: string }[] = [];

    if (ward.crime_violent)
      crimeTypes.push({ label: "Violence", value: ward.crime_violent, color: "#c0392b" });
    if (ward.crime_theft)
      crimeTypes.push({ label: "Theft", value: ward.crime_theft, color: "#e8a838" });
    if (ward.crime_criminal_damage)
      crimeTypes.push({ label: "Criminal Damage", value: ward.crime_criminal_damage, color: "#d35400" });
    if (ward.crime_burglary)
      crimeTypes.push({ label: "Burglary", value: ward.crime_burglary, color: "#8e44ad" });
    if (ward.crime_drugs)
      crimeTypes.push({ label: "Drug Offences", value: ward.crime_drugs, color: "#2980b9" });
    if (ward.crime_public_order)
      crimeTypes.push({ label: "Public Order", value: ward.crime_public_order, color: "#27ae60" });
    if (ward.crime_weapons)
      crimeTypes.push({ label: "Weapons", value: ward.crime_weapons, color: "#666" });
    if (ward.crime_robbery)
      crimeTypes.push({ label: "Robbery", value: ward.crime_robbery, color: "#e74c3c" });
    if (ward.crime_vehicle)
      crimeTypes.push({ label: "Vehicle Crime", value: ward.crime_vehicle, color: "#3498db" });
    if (ward.crime_other)
      crimeTypes.push({ label: "Other", value: ward.crime_other, color: "#95a5a6" });

    return (
      <>
        <SectionWrapper title="Recorded Crime" source="data.police.uk">
          <div className="stat-cards">
            <StatCard value={fmt(ward.crime_total)} label="Total Crimes" />
            <StatCard
              value={ward.crime_rate_per_1000!.toFixed(1)}
              label="per 1,000 pop."
            />
          </div>
          {ward.crime_period && (
            <p className="text-[11px] text-[#888] mt-1">{ward.crime_period}</p>
          )}
        </SectionWrapper>

        {crimeTypes.length > 0 && (
          <SectionWrapper title="Crime by Type">
            <BarChart
              items={crimeTypes.map((ct) => ({
                label: ct.label,
                value: ct.value,
                color: ct.color,
                display: fmt(ct.value),
              }))}
            />
          </SectionWrapper>
        )}

        {ward.crime_asb != null && ward.crime_asb > 0 && (
          <SectionWrapper title="Anti-Social Behaviour">
            <StatRow label="ASB incidents" value={fmt(ward.crime_asb)} />
          </SectionWrapper>
        )}
      </>
    );
  }

  // District crime view (existing behavior)
  if (!data) return null;

  const c = data.crime;

  const crimeTypes: { label: string; value: number; color: string }[] = [];

  if (c.violence != null)
    crimeTypes.push({ label: "Violence", value: c.violence, color: "#c0392b" });
  if (c.theft != null)
    crimeTypes.push({ label: "Theft", value: c.theft, color: "#e8a838" });
  if (c.criminal_damage != null)
    crimeTypes.push({ label: "Criminal Damage", value: c.criminal_damage, color: "#d35400" });
  if (c.burglary != null)
    crimeTypes.push({ label: "Burglary", value: c.burglary, color: "#8e44ad" });
  if (c.drugs != null)
    crimeTypes.push({ label: "Drug Offences", value: c.drugs, color: "#2980b9" });
  if (c.public_order != null)
    crimeTypes.push({ label: "Public Order", value: c.public_order, color: "#27ae60" });
  if (c.possession_weapons != null)
    crimeTypes.push({ label: "Weapons", value: c.possession_weapons, color: "#666" });

  return (
    <>
      <SectionWrapper title="Recorded Crime" source="PSNI 2024/25">
        <div className="stat-cards">
          <StatCard value={fmt(c.total_recorded)} label="Total Offences" />
          <StatCard
            value={c.rate_per_1000.toFixed(1)}
            label="per 1,000 pop."
          />
        </div>
        {c.period && (
          <p className="text-[11px] text-[#888] mt-1">{c.period}</p>
        )}
      </SectionWrapper>

      {crimeTypes.length > 0 && (
        <SectionWrapper title="Crime by Type">
          <BarChart
            items={crimeTypes.map((ct) => ({
              label: ct.label,
              value: ct.value,
              color: ct.color,
              display: fmt(ct.value),
            }))}
          />
        </SectionWrapper>
      )}

      {c.antisocial_behaviour != null && (
        <SectionWrapper title="Anti-Social Behaviour">
          <StatRow label="ASB incidents" value={fmt(c.antisocial_behaviour)} />
        </SectionWrapper>
      )}
    </>
  );
}
