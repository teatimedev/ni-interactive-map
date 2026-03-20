import type { ReactNode } from "react";

interface StatRowProps {
  label: string;
  value: ReactNode;
  className?: string;
}

export default function StatRow({ label, value, className }: StatRowProps) {
  return (
    <div className="stat-row">
      <span className="stat-label">{label}</span>
      <span className={`stat-value ${className ?? ""}`}>{value}</span>
    </div>
  );
}
