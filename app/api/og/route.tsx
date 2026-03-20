import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import districts from "@/data/districts";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

interface WardData {
  slug: string;
  name: string;
  population: number;
  deprivation_rank: number;
  catholic_pct: number;
  protestant_other_christian_pct: number;
  level_4_plus_pct: number;
  no_cars_pct: number;
}

interface WardFile {
  lgd: string;
  lgdSlug: string;
  wards: WardData[];
}

function findWard(lgdSlug: string, wardSlug: string): WardData | null {
  try {
    const filePath = path.join(process.cwd(), "data", "wards", `${lgdSlug}.json`);
    const data: WardFile = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return data.wards.find((w) => w.slug === wardSlug) ?? null;
  } catch {
    return null;
  }
}

function fmt(n: number): string {
  return n.toLocaleString();
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type");
  const slug = searchParams.get("slug");
  const lgd = searchParams.get("lgd");

  if (type === "ward" && lgd && slug) {
    const ward = findWard(lgd, slug);
    const district = districts.find((d) => d.slug === lgd);
    if (!ward || !district) {
      return new Response("Ward not found", { status: 404 });
    }

    const percentile = Math.round(((462 - ward.deprivation_rank) / 462) * 100);

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "48px 60px",
            background: "linear-gradient(135deg, #1a1a1a 0%, #1e2a3a 100%)",
            fontFamily: "sans-serif",
          }}
        >
          <div style={{ fontSize: 16, color: "#888", textTransform: "uppercase", letterSpacing: 2 }}>
            The Big Dirty NI Map
          </div>
          <div style={{ fontSize: 48, fontWeight: 700, color: "#fff", marginTop: 8 }}>
            {ward.name}
          </div>
          <div style={{ fontSize: 20, color: "#7fb3d3", marginTop: 4 }}>
            {district.name}
          </div>
          <div
            style={{
              display: "flex",
              gap: 40,
              marginTop: 32,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#fff" }}>{fmt(ward.population)}</div>
              <div style={{ fontSize: 14, color: "#888" }}>Population</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#7fb3d3" }}>#{ward.deprivation_rank}</div>
              <div style={{ fontSize: 14, color: "#888" }}>of 462 wards</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: percentile > 50 ? "#c0392b" : "#27ae60" }}>
                {percentile}%
              </div>
              <div style={{ fontSize: 14, color: "#888" }}>Deprivation percentile</div>
            </div>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  if (type === "district" && slug) {
    const district = districts.find((d) => d.slug === slug);
    if (!district) {
      return new Response("District not found", { status: 404 });
    }

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "48px 60px",
            background: "linear-gradient(135deg, #1a1a1a 0%, #1e2a3a 100%)",
            fontFamily: "sans-serif",
          }}
        >
          <div style={{ fontSize: 16, color: "#888", textTransform: "uppercase", letterSpacing: 2 }}>
            The Big Dirty NI Map
          </div>
          <div style={{ fontSize: 52, fontWeight: 700, color: "#fff", marginTop: 8 }}>
            {district.name}
          </div>
          <div style={{ fontSize: 18, color: "#7fb3d3", marginTop: 4 }}>
            Local Government District
          </div>
          <div
            style={{
              display: "flex",
              gap: 40,
              marginTop: 32,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#fff" }}>{fmt(district.population)}</div>
              <div style={{ fontSize: 14, color: "#888" }}>Population</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#27ae60" }}>
                {"\u00A3" + fmt(district.median_annual_earnings_residence)}
              </div>
              <div style={{ fontSize: 14, color: "#888" }}>Median Earnings</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#7fb3d3" }}>
                {district.crime.rate_per_1000.toFixed(1)}
              </div>
              <div style={{ fontSize: 14, color: "#888" }}>Crime per 1,000</div>
            </div>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  // Default OG image
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1a1a1a 0%, #1e2a3a 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 56, fontWeight: 700, color: "#fff" }}>
          The Big Dirty NI Map
        </div>
        <div style={{ fontSize: 22, color: "#7fb3d3", marginTop: 8 }}>
          Interactive map of Northern Ireland — 11 districts, 462 wards
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
