"use client";

import { type ReactNode } from "react";
import { MapStateContext, useMapStateProvider } from "@/hooks/useMapState";
import { ChoroplethContext, useChoroplethProvider } from "@/hooks/useChoropleth";
import { ComparisonContext, useComparisonProvider } from "@/hooks/useComparison";

export function MapProvider({ children }: { children: ReactNode }) {
  const mapState = useMapStateProvider();
  const choropleth = useChoroplethProvider();
  const comparison = useComparisonProvider();

  return (
    <MapStateContext.Provider value={mapState}>
      <ChoroplethContext.Provider value={choropleth}>
        <ComparisonContext.Provider value={comparison}>
          {children}
        </ComparisonContext.Provider>
      </ChoroplethContext.Provider>
    </MapStateContext.Provider>
  );
}
