"use client";

import { ReactNode, useEffect, useState } from "react";
import BottomSheet from "@/components/StatsPanel/BottomSheet";

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
  summary?: ReactNode;
}

export default function StatsPanel({
  isOpen,
  onClose,
  title,
  subtitle,
  tabs,
  summary,
}: StatsPanelProps) {
  const [activeTab, setActiveTab] = useState<string>(tabs[0]?.id ?? "");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (tabs.length > 0) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 768px)");
    const updateMobile = () => setIsMobile(media.matches);

    updateMobile();
    media.addEventListener("change", updateMobile);
    return () => media.removeEventListener("change", updateMobile);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
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
        summary={summary}
      />
    );
  }

  return (
    <div id="panel" className={isOpen ? "open" : ""}>
      <button className="panel-close" onClick={onClose} aria-label="Close panel">
        &times;
      </button>

      <div className="panel-header">
        {subtitle && <div className="panel-type">{subtitle}</div>}
        <h2>{title}</h2>
      </div>

      <div className="tab-bar" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={`tabpanel-${tab.id}`}
          role="tabpanel"
          className={`tab-content ${activeTab === tab.id ? "active" : ""}`}
        >
          {tab.content}
        </div>
      ))}

      <div className="panel-footer">
        Sources: NISRA Census 2021, NIMDM 2017, PSNI, Land &amp; Property
        Services, Electoral Office NI
      </div>
    </div>
  );
}
