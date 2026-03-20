interface StatRowProps {
  label: string;
  value: string;
  className?: string;
}

export default function StatRow({ label, value, className }: StatRowProps) {
  return (
    <div className="flex justify-between items-baseline py-1">
      <span className="text-[12.5px] text-[#999]">{label}</span>
      <span className={`text-[13px] font-semibold text-white ${className ?? ""}`}>
        {value}
      </span>
    </div>
  );
}
