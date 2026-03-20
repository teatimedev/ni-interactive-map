"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { MapProvider } from "@/components/MapProvider";
import { useMapState } from "@/hooks/useMapState";
import { useComparison } from "@/hooks/useComparison";
import districts from "@/data/districts";
import StatsPanel from "@/components/StatsPanel/StatsPanel";
import OverviewTab from "@/components/StatsPanel/OverviewTab";
import DemographicsTab from "@/components/StatsPanel/DemographicsTab";
import HousingTab from "@/components/StatsPanel/HousingTab";
import HealthTab from "@/components/StatsPanel/HealthTab";
import CrimeTab from "@/components/StatsPanel/CrimeTab";
import EducationTab from "@/components/StatsPanel/EducationTab";
import TransportTab from "@/components/StatsPanel/TransportTab";

const MapContainer = dynamic(() => import("@/components/Map/MapContainer"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-[#1a1a1a] flex items-center justify-center">
      <div className="text-[#888]">Loading map...</div>
    </div>
  ),
});

const DistrictLayer = dynamic(() => import("@/components/Map/DistrictLayer"), { ssr: false });
const WardLayer = dynamic(() => import("@/components/Map/WardLayer"), { ssr: false });
const MapController = dynamic(() => import("@/components/Map/MapController"), { ssr: false });
const ChoroplethControls = dynamic(() => import("@/components/Map/ChoroplethControls"), { ssr: false });
const Legend = dynamic(() => import("@/components/ui/Legend"), { ssr: false });

function MapApp() {
  const {
    currentView,
    selectedDistrict,
    selectedWard,
    wardCache,
    selectDistrict,
    selectWard,
    setView,
  } = useMapState();
  const comparison = useComparison();

  const [panelOpen, setPanelOpen] = useState(false);

  // Open panel when a district is selected
  useEffect(() => {
    if (selectedDistrict !== null) {
      setPanelOpen(true);
    }
  }, [selectedDistrict]);

  function handleClose() {
    setPanelOpen(false);
  }

  function handleBack() {
    setView("districts");
    selectDistrict(null);
    selectWard(null);
    setPanelOpen(false);
  }

  // Look up district data from slug
  const districtData = selectedDistrict
    ? (districts.find((d) => d.slug === selectedDistrict) ?? null)
    : null;

  // Look up ward data when a ward is selected
  const wardData =
    selectedWard && selectedDistrict
      ? (wardCache.get(selectedDistrict)?.wards.find((w) => w.slug === selectedWard) ?? null)
      : null;

  // Build tabs depending on whether a ward is selected
  const tabs = (() => {
    if (selectedWard && wardData) {
      // Ward tabs — 6 tabs, no Crime
      return [
        {
          id: "overview",
          label: "Overview",
          content: <OverviewTab data={null} ward={wardData} />,
        },
        {
          id: "demographics",
          label: "Demographics",
          content: <DemographicsTab data={null} ward={wardData} />,
        },
        {
          id: "housing",
          label: "Housing",
          content: <HousingTab data={null} ward={wardData} />,
        },
        {
          id: "health",
          label: "Health",
          content: <HealthTab data={null} ward={wardData} />,
        },
        {
          id: "education",
          label: "Education",
          content: <EducationTab data={null} ward={wardData} />,
        },
        {
          id: "transport",
          label: "Transport",
          content: <TransportTab data={null} ward={wardData} />,
        },
      ];
    }

    if (districtData) {
      // District tabs — 7 tabs including Crime
      return [
        {
          id: "overview",
          label: "Overview",
          content: <OverviewTab data={districtData} ward={null} />,
        },
        {
          id: "demographics",
          label: "Demographics",
          content: <DemographicsTab data={districtData} ward={null} />,
        },
        {
          id: "housing",
          label: "Housing",
          content: <HousingTab data={districtData} ward={null} />,
        },
        {
          id: "health",
          label: "Health",
          content: <HealthTab data={districtData} ward={null} />,
        },
        {
          id: "crime",
          label: "Crime",
          content: <CrimeTab data={districtData} />,
        },
        {
          id: "education",
          label: "Education",
          content: <EducationTab data={districtData} ward={null} />,
        },
        {
          id: "transport",
          label: "Transport",
          content: <TransportTab data={districtData} ward={null} />,
        },
      ];
    }

    return [];
  })();

  // Panel title and subtitle
  const panelTitle = wardData ? wardData.name : (districtData?.name ?? "");
  const panelSubtitle = wardData
    ? `Ward — ${districtData?.name ?? ""}`
    : "Local Government District";

  return (
    <>
      {/* Map */}
      <MapContainer>
        <DistrictLayer />
        <WardLayer />
        <MapController />
      </MapContainer>

      {/* Title overlay — top-right */}
      <div className="fixed top-4 right-4 z-[1000] bg-[rgba(26,26,26,0.85)] border border-[#333] rounded-lg px-4 py-3 backdrop-blur-sm">
        <h1 className="text-base font-semibold text-[#e0e0e0] tracking-wide">
          The Big Dirty NI Map
        </h1>
        <div className="text-[11px] text-[#888] mt-0.5">Interactive Boundary Map</div>
      </div>

      {/* Compare button — top-left */}
      <button
        className={`fixed top-4 left-4 z-[1000] border rounded-md px-3.5 py-2 text-xs cursor-pointer shadow-md transition-all ${
          comparison.isComparing
            ? "bg-[#1a5276] border-[#2980b9] text-[#7fb3d3]"
            : "bg-[#2a2a2a] text-[#ccc] border-[#444] hover:bg-[#3a3a3a] hover:text-white hover:border-[#666]"
        }`}
        onClick={() => comparison.toggleCompareMode()}
      >
        Compare
      </button>

      {/* Back button — top-left, offset — only shown when not on districts view */}
      {currentView !== "districts" && (
        <button
          className="fixed top-4 left-[60px] z-[1000] bg-[#2a2a2a] text-[#ccc] border border-[#444] rounded-md px-4 py-2 text-sm cursor-pointer shadow-md hover:bg-[#3a3a3a] hover:text-white hover:border-[#666] transition-all flex items-center gap-1.5"
          onClick={handleBack}
        >
          ← All Districts
        </button>
      )}

      {/* Choropleth controls — top-right below title */}
      <ChoroplethControls />

      {/* Legend — bottom-right */}
      <Legend />

      {/* Stats panel */}
      <StatsPanel
        isOpen={panelOpen}
        onClose={handleClose}
        title={panelTitle}
        subtitle={panelSubtitle}
        tabs={tabs}
      />
    </>
  );
}

export default function Home() {
  return (
    <MapProvider>
      <MapApp />
    </MapProvider>
  );
}
