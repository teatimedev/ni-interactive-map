"use client";

import type { Ward } from "@/lib/types";
import { scoreToGrade, getWardRankStats, getDomainScores } from "@/lib/scoring";
import { useState } from "react";

interface WardRankCardProps {
  ward: Ward;
  districtSlug: string;
}

function scoreColor(score: number): string {
  if (score >= 70) return "var(--positive)";
  if (score >= 50) return "var(--accent)";
  if (score >= 30) return "var(--warning)";
  return "var(--negative)";
}

export default function WardRankCard({ ward, districtSlug }: WardRankCardProps) {
  const [copied, setCopied] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const { rank, percentile, topDomains, bottomDomains } = getWardRankStats(ward);
  const score = ward.livability_score;
  const { grade, color } = scoreToGrade(score);
  const domains = getDomainScores(ward);

  function handleShare() {
    const url = `${window.location.origin}/ward/${districtSlug}/${ward.slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="ward-rank-card">
      <div className="rank-card-header">
        <div>
          <div className="rank-card-label">Livability Score</div>
          <div className="rank-card-headline">
            <span className="rank-card-number">{score}</span>/100
          </div>
          <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>
            Ranked <strong>#{rank}</strong> of 462 wards
          </div>
        </div>
        <div className="rank-card-grade" style={{ background: color, boxShadow: `0 2px 8px ${color}40` }}>
          {grade}
        </div>
      </div>

      <div className="rank-card-percentile">
        {rank <= 231 ? (
          <>More livable than <span className="rank-card-highlight-good">{percentile}%</span> of NI</>
        ) : (
          <>Less livable than <span className="rank-card-highlight-warn">{100 - percentile}%</span> of NI</>
        )}
      </div>

      {(topDomains.length > 0 || bottomDomains.length > 0) && (
        <div className="rank-card-domains">
          {topDomains.length > 0 && (
            <div className="rank-card-domain-row">
              <span className="rank-card-domain-label-good">Top 10% for:</span>{" "}
              <span className="rank-card-domain-list">{topDomains.join(", ")}</span>
            </div>
          )}
          {bottomDomains.length > 0 && (
            <div className="rank-card-domain-row">
              <span className="rank-card-domain-label-bad">Bottom 10% for:</span>{" "}
              <span className="rank-card-domain-list">{bottomDomains.join(", ")}</span>
            </div>
          )}
        </div>
      )}

      <div className="rank-card-score">
        <button className="score-breakdown-toggle" onClick={() => setShowBreakdown(!showBreakdown)}>
          {showBreakdown ? "Hide breakdown" : "How is this scored?"}
        </button>
      </div>

      {showBreakdown && (
        <div className="score-breakdown">
          <div className="score-breakdown-desc">
            Scores are derived from NIMDM 2017 deprivation rankings across 462 NI wards.
            A rank of 1 means most deprived (score 0), rank 462 means least deprived (score 100).
            The livability score is a weighted average of {domains.length} domains.
          </div>
          {domains.map((d) => (
            <div key={d.key} className="score-domain-row" title={`${d.description} — Ranked ${d.rank} of 462 wards${d.rank <= 46 ? " (bottom 10%)" : d.rank >= 416 ? " (top 10%)" : ""}`}>
              <div className="score-domain-row-header">
                <div className="score-domain-label">{d.label}</div>
                <div className="score-domain-meta">
                  <span className="score-domain-value">#{d.rank}</span>
                  <span className="score-domain-weight">{Math.round(d.weight * 100)}%</span>
                </div>
              </div>
              <div className="score-domain-bar">
                <div
                  className="score-domain-fill"
                  style={{ width: `${d.score}%`, background: scoreColor(d.score) }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <button onClick={handleShare} className="btn-map rank-card-share">
        {copied ? "Link copied!" : "Share this ward"}
      </button>
    </div>
  );
}
