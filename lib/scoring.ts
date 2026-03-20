import type { Ward } from "./types";

const TOTAL_WARDS = 462;

export const WEIGHTS = {
  deprivation: 0.20,
  income: 0.15,
  health: 0.18,
  education: 0.13,
  crime: 0.13,
  living_env: 0.12,
  access: 0.09,
} as const;

function rankToScore(rank: number): number {
  return ((rank - 1) / (TOTAL_WARDS - 1)) * 100;
}

export interface DomainScore {
  key: string;
  label: string;
  description: string;
  weight: number;
  rank: number;
  score: number;
}

export function getDomainScores(ward: Ward): DomainScore[] {
  return [
    {
      key: "deprivation",
      label: "Deprivation",
      description: "Overall multiple deprivation index",
      weight: WEIGHTS.deprivation,
      rank: ward.deprivation_rank,
      score: Math.round(rankToScore(ward.deprivation_rank)),
    },
    {
      key: "income",
      label: "Income",
      description: "Income deprivation rate",
      weight: WEIGHTS.income,
      rank: ward.income_rank,
      score: Math.round(rankToScore(ward.income_rank)),
    },
    {
      key: "health",
      label: "Health",
      description: "Health deprivation & disability",
      weight: WEIGHTS.health,
      rank: ward.health_rank,
      score: Math.round(rankToScore(ward.health_rank)),
    },
    {
      key: "education",
      label: "Education",
      description: "Education, skills & training",
      weight: WEIGHTS.education,
      rank: ward.education_rank,
      score: Math.round(rankToScore(ward.education_rank)),
    },
    {
      key: "crime",
      label: "Crime",
      description: "Crime & disorder rates",
      weight: WEIGHTS.crime,
      rank: ward.crime_rank,
      score: Math.round(rankToScore(ward.crime_rank)),
    },
    {
      key: "living_env",
      label: "Environment",
      description: "Housing & local environment quality",
      weight: WEIGHTS.living_env,
      rank: ward.living_env_rank,
      score: Math.round(rankToScore(ward.living_env_rank)),
    },
    {
      key: "access",
      label: "Access",
      description: "Access to GPs, schools, shops",
      weight: WEIGHTS.access,
      rank: ward.access_rank,
      score: Math.round(rankToScore(ward.access_rank)),
    },
  ];
}

export function computeLivabilityScore(ward: Ward): number {
  const domains = getDomainScores(ward);
  let total = 0;
  for (const d of domains) {
    total += (rankToScore(d.rank) * d.weight);
  }
  return Math.round(total);
}

export function scoreToGrade(score: number): { grade: string; color: string } {
  if (score >= 90) return { grade: "A+", color: "#27ae60" };
  if (score >= 80) return { grade: "A", color: "#2ecc71" };
  if (score >= 70) return { grade: "B+", color: "#3498db" };
  if (score >= 60) return { grade: "B", color: "#2980b9" };
  if (score >= 50) return { grade: "C+", color: "#7fb3d3" };
  if (score >= 40) return { grade: "C", color: "#e8a838" };
  if (score >= 25) return { grade: "D", color: "#e67e22" };
  return { grade: "F", color: "#c0392b" };
}

export function getWardRankStats(ward: Ward) {
  const rank = ward.deprivation_rank;
  const percentile = Math.round(((TOTAL_WARDS - rank) / TOTAL_WARDS) * 100);

  const topThreshold = Math.ceil(TOTAL_WARDS * 0.9);
  const bottomThreshold = Math.floor(TOTAL_WARDS * 0.1);

  const domains = [
    { key: "income_rank" as const, label: "Income" },
    { key: "employment_rank" as const, label: "Employment" },
    { key: "health_rank" as const, label: "Health" },
    { key: "education_rank" as const, label: "Education" },
    { key: "access_rank" as const, label: "Access to Services" },
    { key: "living_env_rank" as const, label: "Living Environment" },
    { key: "crime_rank" as const, label: "Crime & Disorder" },
  ];

  const topDomains = domains
    .filter((d) => ward[d.key] >= topThreshold)
    .map((d) => d.label);

  const bottomDomains = domains
    .filter((d) => ward[d.key] <= bottomThreshold)
    .map((d) => d.label);

  return { rank, percentile, topDomains, bottomDomains };
}
