"use client";

import { createContext, useContext, useState } from "react";
import type { ChoroplethMetric } from "@/lib/types";

interface ChoroplethState {
  metric: ChoroplethMetric | null;
  setMetric: (metric: ChoroplethMetric | null) => void;
}

export const ChoroplethContext = createContext<ChoroplethState | null>(null);

export function useChoropleth(): ChoroplethState {
  const ctx = useContext(ChoroplethContext);
  if (!ctx) throw new Error("useChoropleth must be used within MapProvider");
  return ctx;
}

export function useChoroplethProvider(): ChoroplethState {
  const [metric, setMetric] = useState<ChoroplethMetric | null>(null);

  return { metric, setMetric };
}
