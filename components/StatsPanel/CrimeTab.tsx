"use client";

import type { District } from "@/lib/types";
import { fmt } from "@/lib/utils";
import StatCard from "@/components/ui/StatCard";
import StatRow from "@/components/ui/StatRow";
import BarChart from "@/components/Charts/BarChart";

interface CrimeTabProps {
  data: District | null;
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

export default function CrimeTab({ data }: CrimeTabProps) {
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
      <SectionWrapper title="Recorded Crime">
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
