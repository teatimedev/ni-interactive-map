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
import PinCreator from "@/components/Map/PinCreator";

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
const PinLayer = dynamic(() => import("@/components/Map/PinLayer"), { ssr: false });

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
    isPinMode,
    pendingPin,
    selectDistrict,
    selectWard,
    setView,
    loadWardData,
    togglePinMode,
    clearPendingPin,
  } = useMapState();
  const comparison = useComparison();

  const [panelOpen, setPanelOpen] = useState(false);
  const [initialised, setInitialised] = useState(false);
  const [wardLoadFailed, setWardLoadFailed] = useState(false);
  const [pinRefreshKey, setPinRefreshKey] = useState(0);

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

  // Re-initialise when route props change
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

  useEffect(() => {
    if (selectedDistrict !== null) setPanelOpen(true);
  }, [selectedDistrict]);

  useEffect(() => {
    if (selectedWard !== null) setPanelOpen(true);
  }, [selectedWard]);

  useEffect(() => {
    if (comparison.selections.length === 2) setPanelOpen(true);
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

  function handleTogglePinMode() {
    if (comparison.isComparing) comparison.toggleCompareMode();
    togglePinMode();
  }

  function handleToggleCompare() {
    if (isPinMode) togglePinMode();
    comparison.toggleCompareMode();
  }

  function handlePinCreated() {
    clearPendingPin();
    setPinRefreshKey((k) => k + 1);
  }

  const districtData = selectedDistrict
    ? (districts.find((d) => d.slug === selectedDistrict) ?? null)
    : null;

  const wardData =
    selectedWard && selectedDistrict
      ? (wardCache.get(selectedDistrict)?.wards.find((w) => w.slug === selectedWard) ?? null)
      : null;

  const compDistrict1 =
    comparison.selections.length === 2
      ? (districts.find((d) => d.slug === comparison.selections[0]) ?? null)
      : null;
  const compDistrict2 =
    comparison.selections.length === 2
      ? (districts.find((d) => d.slug === comparison.selections[1]) ?? null)
      : null;

  const loadingTab = [{ id: "loading", label: "Loading\u2026", content: <LoadingSkeleton /> }];

  const errorTab = [{
    id: "error",
    label: "Error",
    content: (
      <div className="px-5 py-8 text-center">
        <div className="text-[#888] text-sm mb-3">Couldn&apos;t load ward data.</div>
        <button onClick={handleRetry} className="btn-map min-h-[44px]">Tap to retry</button>
      </div>
    ),
  }];

  const tabs = (() => {
    if (isLoadingWards && panelOpen) return loadingTab;
    if (wardLoadFailed && panelOpen) return errorTab;

    if (compDistrict1 && compDistrict2) {
      return [{
        id: "comparison",
        label: "Comparison",
        content: <ComparisonContent district1={compDistrict1} district2={compDistrict2} />,
      }];
    }

    if (selectedWard && wardData) {
      return [
        { id: "overview", label: "Overview", content: <OverviewTab data={null} ward={wardData} districtSlug={selectedDistrict ?? ""} /> },
        { id: "demographics", label: "Demographics", content: <DemographicsTab data={null} ward={wardData} /> },
        { id: "housing", label: "Housing", content: <HousingTab data={null} ward={wardData} /> },
        { id: "health", label: "Health", content: <HealthTab data={null} ward={wardData} /> },
        { id: "education", label: "Education", content: <EducationTab data={null} ward={wardData} /> },
        { id: "transport", label: "Transport", content: <TransportTab data={null} ward={wardData} /> },
      ];
    }

    if (districtData) {
      return [
        { id: "overview", label: "Overview", content: <OverviewTab data={districtData} ward={null} /> },
        { id: "demographics", label: "Demographics", content: <DemographicsTab data={districtData} ward={null} /> },
        { id: "housing", label: "Housing", content: <HousingTab data={districtData} ward={null} /> },
        { id: "health", label: "Health", content: <HealthTab data={districtData} ward={null} /> },
        { id: "crime", label: "Crime", content: <CrimeTab data={districtData} /> },
        { id: "education", label: "Education", content: <EducationTab data={districtData} ward={null} /> },
        { id: "transport", label: "Transport", content: <TransportTab data={districtData} ward={null} /> },
      ];
    }

    return [];
  })();

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
      ? `Ward \u2014 ${districtData?.name ?? ""}`
      : "Local Government District";

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Map */}
      <MapContainer>
        <DistrictLayer />
        <WardLayer />
        <PinLayer refreshKey={pinRefreshKey} />
        <MapController onMapClick={() => { if (panelOpen && !comparison.isComparing) setPanelOpen(false); }} />
      </MapContainer>

      {/* Floating capsule nav */}
      <nav className="top-nav">
        <div className="capsule capsule-brand">
          <span className="capsule-dot" />
          <span className="capsule-title">The Big Dirty NI Map</span>
          <span className="capsule-sub">NI Boundary Map</span>
        </div>

        <div className="top-nav-right">
          <ChoroplethControls panelOpen={panelOpen} inline />

          <div className="capsule" style={{ gap: 3 }}>
            <button
              aria-label="Toggle comparison mode"
              aria-pressed={comparison.isComparing}
              className={`capsule-btn ${comparison.isComparing ? "active" : ""}`}
              onClick={handleToggleCompare}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 3h5v5"/><path d="M8 21H3v-5"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
              Compare
            </button>
            <span className="capsule-sep" />
            <button
              aria-label="Toggle pin dropping mode"
              aria-pressed={isPinMode}
              className={`capsule-btn ${isPinMode ? "pin-active" : ""}`}
              onClick={handleTogglePinMode}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              Drop Pin
            </button>
            {currentView !== "districts" && (
              <>
                <span className="capsule-sep" />
                <button
                  aria-label="Return to all districts"
                  className="capsule-btn"
                  onClick={handleBack}
                >
                  &larr; Back
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Pin mode hint */}
      {isPinMode && !pendingPin && (
        <div className="pin-hint">Tap the map to place your pin</div>
      )}

      {/* Pin creator popup */}
      {pendingPin && (
        <PinCreator
          lat={pendingPin.lat}
          lng={pendingPin.lng}
          onCreated={handlePinCreated}
          onCancel={clearPendingPin}
        />
      )}

      <div aria-live="polite" className="sr-only">
        {selectedDistrict ? `Selected: ${districtData?.name ?? selectedDistrict}` : ""}
        {selectedWard ? `, ${wardData?.name ?? selectedWard}` : ""}
      </div>

      <Search />
      <Legend />

      {comparison.isComparing && <ComparePanel />}

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
