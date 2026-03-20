"use client";

import type { Ward } from "@/lib/types";
import { computeLivabilityScore, scoreToGrade } from "@/lib/scoring";

interface ScoreCardProps {
  ward: Ward;
}

export default function ScoreCard({ ward }: ScoreCardProps) {
  const score = computeLivabilityScore(ward);
  const { grade, color } = scoreToGrade(score);

  return (
    <div className="score-card">
      <div className="score-card-badge" style={{ background: color }}>
        {grade}
      </div>
      <div className="score-card-detail">
        <div className="score-card-value">{score}<span className="score-card-max">/100</span></div>
        <div className="score-card-label">Livability</div>
      </div>
      <div className="score-card-bar-track">
        <div
          className="score-card-bar-fill"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
    </div>
  );
}
