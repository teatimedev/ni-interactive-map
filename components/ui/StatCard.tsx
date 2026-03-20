interface StatCardProps {
  value: string;
  label: string;
}

export default function StatCard({ value, label }: StatCardProps) {
  return (
    <div className="bg-[#252525] rounded-lg p-3 text-center border border-[#2a2a2a]">
      <div className="text-[20px] font-bold text-white">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-[#999]">
        {label}
      </div>
    </div>
  );
}
