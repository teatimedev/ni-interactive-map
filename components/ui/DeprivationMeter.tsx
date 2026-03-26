interface DeprivationMeterProps {
  position: number;
}

const ZONE_COLORS = ["#2d6a3f", "#5a9a4e", "#c4b035", "#d4783a", "#c44a3a"];

export default function DeprivationMeter({ position }: DeprivationMeterProps) {
  const clamped = Math.max(0, Math.min(100, position));
  const width = 280;
  const height = 52;
  const trackY = 12;
  const trackH = 16;
  const zoneWidth = width / 5;

  return (
    <div className="deprivation-meter">
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        {/* Track zones */}
        {ZONE_COLORS.map((color, i) => (
          <rect
            key={i}
            x={i * zoneWidth + (i === 0 ? 0 : 1)}
            y={trackY}
            width={zoneWidth - (i === 0 || i === 4 ? 0 : 1)}
            height={trackH}
            rx={i === 0 ? 4 : i === 4 ? 4 : 0}
            ry={i === 0 ? 4 : i === 4 ? 4 : 0}
            fill={color}
            opacity={0.7}
          />
        ))}

        {/* Tick marks at 20%, 40%, 60%, 80% */}
        {[20, 40, 60, 80].map((pct) => (
          <line
            key={pct}
            x1={(pct / 100) * width}
            y1={trackY + trackH + 2}
            x2={(pct / 100) * width}
            y2={trackY + trackH + 6}
            stroke="var(--text-muted)"
            strokeWidth={1}
          />
        ))}

        {/* Position marker */}
        <circle
          cx={(clamped / 100) * width}
          cy={trackY + trackH / 2}
          r={8}
          fill="var(--text-bright)"
          stroke="var(--bg-primary)"
          strokeWidth={3}
          style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.5))" }}
        />
      </svg>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: 10,
        color: "var(--text-muted)",
        marginTop: 2,
        fontFamily: "var(--font-body)",
      }}>
        <span>Least deprived</span>
        <span>Most deprived</span>
      </div>
    </div>
  );
}
