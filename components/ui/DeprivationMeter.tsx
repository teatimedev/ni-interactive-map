interface DeprivationMeterProps {
  position: number;
}

export default function DeprivationMeter({ position }: DeprivationMeterProps) {
  const clampedPosition = Math.max(0, Math.min(100, position));

  return (
    <div className="mt-1">
      <div
        className="relative h-3 rounded-full overflow-hidden"
        style={{
          background: "linear-gradient(to right, #27ae60, #e8a838, #c0392b)",
        }}
      >
        <div
          className="absolute top-0 w-1 h-full bg-white rounded-full"
          style={{
            left: `${clampedPosition}%`,
            transform: "translateX(-50%)",
            boxShadow: "0 0 3px rgba(0,0,0,0.5)",
          }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-[#888]">Least deprived</span>
        <span className="text-[10px] text-[#888]">Most deprived</span>
      </div>
    </div>
  );
}
