"use client";

import { createContext, useContext, useState } from "react";

interface ComparisonState {
  isComparing: boolean;
  selections: string[];
  toggleCompareMode: () => void;
  addSelection: (slug: string) => void;
  clearSelections: () => void;
}

export const ComparisonContext = createContext<ComparisonState | null>(null);

export function useComparison(): ComparisonState {
  const ctx = useContext(ComparisonContext);
  if (!ctx) throw new Error("useComparison must be used within MapProvider");
  return ctx;
}

export function useComparisonProvider(): ComparisonState {
  const [isComparing, setIsComparing] = useState(false);
  const [selections, setSelections] = useState<string[]>([]);

  function toggleCompareMode() {
    setIsComparing((prev) => {
      if (prev) setSelections([]);
      return !prev;
    });
  }

  function addSelection(slug: string) {
    setSelections((prev) => {
      if (prev.includes(slug) || prev.length >= 2) return prev;
      return [...prev, slug];
    });
  }

  function clearSelections() {
    setSelections([]);
  }

  return { isComparing, selections, toggleCompareMode, addSelection, clearSelections };
}
