"use client";

import { ReactNode, useEffect, useState } from "react";
import BottomSheet from "./BottomSheet";

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

interface StatsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  tabs: Tab[];
  population?: string;
}

export default function StatsPanel({
  isOpen,
  onClose,
  title,
  subtitle,
  tabs,
  population,
}: StatsPanelProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const [activeTab, setActiveTab] = useState<string>(tabs[0]?.id ?? "");

  // Reset to first tab when tabs change
  useEffect(() => {
    if (tabs.length > 0) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs]);

  // Escape key closes panel
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (isMobile) {
    return (
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        subtitle={subtitle}
        tabs={tabs}
        population={population}
      />
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        bottom: 0,
        right: isOpen ? 0 : -480,
        width: 480,
        zIndex: 1001,
        display: "flex",
        flexDirection: "column",
        background: "#1e1e1e",
        color: "white",
        borderLeft: "1px solid #333",
        transition: "right 350ms cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: isOpen ? "-4px 0 20px rgba(0,0,0,0.4)" : "none",
        overflowY: "auto",
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded bg-[#1a1a1a] text-[#777] hover:text-white transition-colors"
        aria-label="Close panel"
      >
        <span className="text-xl leading-none">&times;</span>
      </button>

      {/* Header */}
      <div className="px-5 pt-4 pb-2">
        {subtitle && (
          <div className="text-[11px] uppercase tracking-wider text-[#999] mb-0.5">
            {subtitle}
          </div>
        )}
        <h2 className="text-[18px] font-semibold text-white pr-8">{title}</h2>
      </div>

      {/* Tab bar */}
      <div
        className="sticky top-0 z-10 bg-[#1a1a1a] border-b border-[#2a2a2a] overflow-x-auto"
        role="tablist"
      >
        <div className="flex px-5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2.5 text-[12px] font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? "text-[#7fb3d3] border-[#2980b9]"
                    : "text-[#777] border-transparent hover:text-[#aaa]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab panels */}
      <div className="flex-1 overflow-y-auto">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            id={`tabpanel-${tab.id}`}
            role="tabpanel"
            hidden={activeTab !== tab.id}
          >
            {tab.content}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-2 border-t border-[#2a2a2a]">
        <p className="text-[10px] text-[#555]">
          Sources: NISRA Census 2021, NIMDM 2017, PSNI, Land &amp; Property
          Services, Electoral Office NI
        </p>
      </div>
    </div>
  );
}
