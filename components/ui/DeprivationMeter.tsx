interface DeprivationMeterProps {
  position: number;
}

export default function DeprivationMeter({ position }: DeprivationMeterProps) {
  const clamped = Math.max(0, Math.min(100, position));

  return (
    <div className="deprivation-meter">
      <div className="meter-track">
        <div className="meter-marker" style={{ left: `${clamped}%` }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#555" }}>
        <span>Least deprived</span>
        <span>Most deprived</span>
      </div>
    </div>
  );
}
