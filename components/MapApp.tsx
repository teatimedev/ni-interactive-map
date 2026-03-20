"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
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
import { ComparisonContent } from "@/components/ComparePanel";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

const ComparePanel = dynamic(() => import("@/components/ComparePanel"), { ssr: false });

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
const Search = dynamic(() => import("@/components/Search"), { ssr: false });

interface MapAppProps {
  initialDistrict?: string;
  initialWard?: string;
}

export default function MapApp({ initialDistrict, initialWard }: MapAppProps) {
  const {
    currentView,
    selectedDistrict,
    selectedWard,
    wardCache,
    isLoadingWards,
    selectDistrict,
    selectWard,
    setView,
    loadWardData,
  } = useMapState();
  const comparison = useComparison();

  const [panelOpen, setPanelOpen] = useState(false);
  const [initialised, setInitialised] = useState(false);
  const [wardLoadFailed, setWardLoadFailed] = useState(false);

  // Initialise from route props on first mount
  useEffect(() => {
    if (initialised) return;
    if (!initialDistrict) {
      setInitialised(true);
      return;
    }

    async function init() {
      selectDistrict(initialDistrict!);
      setView("district-detail");
      setWardLoadFailed(false);
      const result = await loadWardData(initialDistrict!);
      if (!result) setWardLoadFailed(true);

      if (initialWard) {
        selectWard(initialWard);
        setView("ward-detail");
      }

      setPanelOpen(true);
      setInitialised(true);
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-initialise when route props change (e.g. navigating between district pages)
  useEffect(() => {
    if (!initialised) return;
    if (!initialDistrict) return;

    async function reinit() {
      selectDistrict(initialDistrict!);
      setView("district-detail");
      setWardLoadFailed(false);
      const result = await loadWardData(initialDistrict!);
      if (!result) setWardLoadFailed(true);

      if (initialWard) {
        selectWard(initialWard);
        setView("ward-detail");
      } else {
        selectWard(null);
      }

      setPanelOpen(true);
    }

    reinit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDistrict, initialWard]);

  // Open panel when a district is selected
  useEffect(() => {
    if (selectedDistrict !== null) {
      setPanelOpen(true);
    }
  }, [selectedDistrict]);

  // Open comparison panel when two districts are selected
  useEffect(() => {
    if (comparison.selections.length === 2) {
      setPanelOpen(true);
    }
  }, [comparison.selections]);

  function handleClose() {
    setPanelOpen(false);
  }

  function handleBack() {
    setView("districts");
    selectDistrict(null);
    selectWard(null);
    setPanelOpen(false);
  }

  async function handleRetry() {
    if (!selectedDistrict) return;
    setWardLoadFailed(false);
    const result = await loadWardData(selectedDistrict);
    if (!result) setWardLoadFailed(true);
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

  // Comparison data — look up both districts when two are selected
  const compDistrict1 =
    comparison.selections.length === 2
      ? (districts.find((d) => d.slug === comparison.selections[0]) ?? null)
      : null;
  const compDistrict2 =
    comparison.selections.length === 2
      ? (districts.find((d) => d.slug === comparison.selections[1]) ?? null)
      : null;

  // Loading skeleton tab (shown while wards are fetching)
  const loadingTab = [
    {
      id: "loading",
      label: "Loading…",
      content: <LoadingSkeleton />,
    },
  ];

  // Error tab (shown when ward fetch failed)
  const errorTab = [
    {
      id: "error",
      label: "Error",
      content: (
        <div className="px-5 py-8 text-center">
          <div className="text-[#888] text-sm mb-3">Couldn&apos;t load ward data.</div>
          <button
            onClick={handleRetry}
            className="px-3 py-1.5 bg-[#2a2a2a] text-[#ccc] border border-[#444] rounded text-xs hover:bg-[#3a3a3a] min-h-[44px]"
          >
            Tap to retry
          </button>
        </div>
      ),
    },
  ];

  // Build tabs depending on whether a ward is selected
  const tabs = (() => {
    // Show loading skeleton while ward data is being fetched
    if (isLoadingWards && panelOpen) return loadingTab;
    // Show error state if the ward fetch failed
    if (wardLoadFailed && panelOpen) return errorTab;

    // Comparison takes priority when two districts are selected
    if (compDistrict1 && compDistrict2) {
      return [
        {
          id: "comparison",
          label: "Comparison",
          content: <ComparisonContent district1={compDistrict1} district2={compDistrict2} />,
        },
      ];
    }

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
  const panelTitle =
    compDistrict1 && compDistrict2
      ? `${compDistrict1.name} vs ${compDistrict2.name}`
      : wardData
      ? wardData.name
      : (districtData?.name ?? "");

  const panelSubtitle =
    compDistrict1 && compDistrict2
      ? "Comparison"
      : wardData
      ? `Ward — ${districtData?.name ?? ""}`
      : "Local Government District";

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Map */}
      <MapContainer>
        <DistrictLayer />
        <WardLayer />
        <MapController />
      </MapContainer>

      {/* Title overlay — top-right on desktop, bottom-centre on mobile */}
      <div className="fixed top-4 right-4 z-[1000] bg-[rgba(26,26,26,0.85)] border border-[#333] rounded-lg px-4 py-3 backdrop-blur-sm max-sm:top-auto max-sm:bottom-4 max-sm:right-4 max-sm:left-4 max-sm:text-center">
        <h1 className="text-base font-semibold text-[#e0e0e0] tracking-wide">
          The Big Dirty NI Map
        </h1>
        <div className="text-[11px] text-[#888] mt-0.5">Interactive Boundary Map</div>
      </div>

      {/* Compare button — top-left */}
      <button
        aria-label="Toggle comparison mode"
        aria-pressed={comparison.isComparing}
        className={`fixed top-4 left-4 z-[1000] border rounded-md px-3.5 py-2 text-xs cursor-pointer shadow-md transition-all min-h-[44px] min-w-[44px] ${
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
          aria-label="Return to all districts"
          className="fixed top-4 left-[60px] z-[1000] bg-[#2a2a2a] text-[#ccc] border border-[#444] rounded-md px-4 py-2 text-sm cursor-pointer shadow-md hover:bg-[#3a3a3a] hover:text-white hover:border-[#666] transition-all flex items-center gap-1.5 min-h-[44px]"
          onClick={handleBack}
        >
          ← All Districts
        </button>
      )}

      {/* Accessible live region for screen readers */}
      <div aria-live="polite" className="sr-only">
        {selectedDistrict ? `Selected: ${districtData?.name ?? selectedDistrict}` : ""}
        {selectedWard ? `, ${wardData?.name ?? selectedWard}` : ""}
      </div>

      {/* Search bar — top-left after compare and back buttons */}
      <Search />

      {/* Choropleth controls — top-right below title */}
      <ChoroplethControls />

      {/* Legend — bottom-right */}
      <Legend />

      {/* Comparison bottom bar */}
      {comparison.isComparing && <ComparePanel />}

      {/* Stats panel */}
      <StatsPanel
        isOpen={panelOpen}
        onClose={handleClose}
        title={panelTitle}
        subtitle={panelSubtitle}
        tabs={tabs}
      />
    </div>
  );
}
