"use client";

import { createContext, useContext, useRef, useState } from "react";
import type { MapView, WardWithGeometry } from "@/lib/types";
import type GeoJSON from "geojson";

export interface WardCache {
  wards: WardWithGeometry[];
  geoJSON: GeoJSON.FeatureCollection;
}

interface MapState {
  currentView: MapView;
  selectedDistrict: string | null;
  selectedWard: string | null;
  wardCache: Map<string, WardCache>;
  isLoadingWards: boolean;
  isPinMode: boolean;
  pendingPin: { lat: number; lng: number } | null;
}

interface MapStateActions {
  setView: (view: MapView) => void;
  selectDistrict: (slug: string | null) => void;
  selectWard: (slug: string | null) => void;
  loadWardData: (lgdSlug: string) => Promise<WardCache | null>;
  setLoadingWards: (loading: boolean) => void;
  togglePinMode: () => void;
  setPendingPin: (coords: { lat: number; lng: number } | null) => void;
  clearPendingPin: () => void;
}

type MapStateContextValue = MapState & MapStateActions;

export const MapStateContext = createContext<MapStateContextValue | null>(null);

export function useMapState(): MapStateContextValue {
  const ctx = useContext(MapStateContext);
  if (!ctx) throw new Error("useMapState must be used within MapProvider");
  return ctx;
}

export function useMapStateProvider(): MapStateContextValue {
  const [currentView, setCurrentView] = useState<MapView>("districts");
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedWard, setSelectedWard] = useState<string | null>(null);
  const [isLoadingWards, setIsLoadingWards] = useState(false);
  const [wardCache, setWardCache] = useState<Map<string, WardCache>>(new Map());
  const [isPinMode, setIsPinMode] = useState(false);
  const [pendingPin, setPendingPinState] = useState<{ lat: number; lng: number } | null>(null);

  const cacheRef = useRef<Map<string, WardCache>>(new Map());

  function setView(view: MapView) {
    setCurrentView(view);
  }

  function selectDistrict(slug: string | null) {
    setSelectedDistrict(slug);
  }

  function selectWard(slug: string | null) {
    setSelectedWard(slug);
  }

  function setLoadingWards(loading: boolean) {
    setIsLoadingWards(loading);
  }

  function togglePinMode() {
    setIsPinMode((prev) => !prev);
    setPendingPinState(null);
  }

  function setPendingPin(coords: { lat: number; lng: number } | null) {
    setPendingPinState(coords);
  }

  function clearPendingPin() {
    setPendingPinState(null);
  }

  async function loadWardData(lgdSlug: string): Promise<WardCache | null> {
    const cached = cacheRef.current.get(lgdSlug);
    if (cached) return cached;

    setIsLoadingWards(true);
    try {
      const res = await fetch(`/data/wards/${lgdSlug}.json`);
      if (!res.ok) return null;

      const data = await res.json();
      const wards: WardWithGeometry[] = data.wards ?? [];

      const geoJSON: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: wards.map((ward) => ({
          type: "Feature" as const,
          geometry: ward.geometry,
          properties: {
            name: ward.name,
            slug: ward.slug,
            lgd: data.lgd ?? lgdSlug,
          },
        })),
      };

      const entry: WardCache = { wards, geoJSON };
      cacheRef.current.set(lgdSlug, entry);
      setWardCache(new Map(cacheRef.current));
      return entry;
    } catch {
      return null;
    } finally {
      setIsLoadingWards(false);
    }
  }

  return {
    currentView,
    selectedDistrict,
    selectedWard,
    wardCache,
    isLoadingWards,
    isPinMode,
    pendingPin,
    setView,
    selectDistrict,
    selectWard,
    loadWardData,
    setLoadingWards,
    togglePinMode,
    setPendingPin,
    clearPendingPin,
  };
}
