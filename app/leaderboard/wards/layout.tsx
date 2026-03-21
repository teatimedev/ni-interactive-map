import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ward Leaderboard — The Big Dirty NI Map",
  description: "All 462 Northern Ireland wards ranked by livability score, deprivation, education, health and more",
  openGraph: {
    title: "Ward Leaderboard — The Big Dirty NI Map",
    description: "All 462 Northern Ireland wards ranked by livability score, deprivation, education, health and more",
    images: ["/api/og"],
  },
};

export default function WardLeaderboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
