"use client";

import dynamic from "next/dynamic";
import { MapProvider } from "@/components/MapProvider";

const MapContainer = dynamic(() => import("@/components/Map/MapContainer"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-[#1a1a1a] flex items-center justify-center">
      <div className="text-[#888]">Loading map...</div>
    </div>
  ),
});

const DistrictLayer = dynamic(() => import("@/components/Map/DistrictLayer"), { ssr: false });

export default function Home() {
  return (
    <MapProvider>
      <MapContainer>
        <DistrictLayer />
      </MapContainer>
    </MapProvider>
  );
}
