import { Metadata } from "next";

export const metadata: Metadata = {
  title: "District Leaderboard — The Big Dirty NI Map",
  description: "All 11 Northern Ireland councils ranked by population, earnings, crime, education and more",
  openGraph: {
    title: "District Leaderboard — The Big Dirty NI Map",
    description: "All 11 Northern Ireland councils ranked by population, earnings, crime, education and more",
    images: ["/api/og"],
  },
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
