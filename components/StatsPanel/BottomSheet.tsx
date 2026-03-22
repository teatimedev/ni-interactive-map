"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  tabs: Tab[];
  summary?: ReactNode;
}

const CLOSE_THRESHOLD = 72;
const VELOCITY_THRESHOLD = 0.45;
const EXPAND_THRESHOLD = 50;

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  tabs,
  summary,
}: BottomSheetProps) {
  const [activeTab, setActiveTab] = useState<string>(tabs[0]?.id ?? "");
  const [collapsed, setCollapsed] = useState(true);
  const [dragOffset, setDragOffset] = useState(0);
  const startYRef = useRef(0);
  const startTimeRef = useRef(0);
  const draggingRef = useRef(false);

  useEffect(() => {
    if (tabs.length > 0) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs]);

  // Reset to collapsed when opening
  useEffect(() => {
    if (isOpen) {
      setCollapsed(true);
    } else {
      setDragOffset(0);
      draggingRef.current = false;
    }
  }, [isOpen]);

  function handleTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    startYRef.current = e.touches[0].clientY;
    startTimeRef.current = e.timeStamp;
    draggingRef.current = true;
  }

  function handleTouchMove(e: React.TouchEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    const deltaY = e.touches[0].clientY - startYRef.current;

    if (collapsed) {
      // In collapsed: allow drag up (negative) or drag down (positive)
      setDragOffset(deltaY);
    } else {
      // In expanded: only allow drag down (positive)
      setDragOffset(Math.max(0, deltaY));
    }
  }

  function handleTouchEnd(e: React.TouchEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    draggingRef.current = false;

    const deltaY = e.changedTouches[0].clientY - startYRef.current;
    const elapsed = e.timeStamp - startTimeRef.current;
    const velocity = elapsed > 0 ? deltaY / elapsed : 0;

    if (collapsed) {
      // Drag up from collapsed → expand
      if (deltaY < -EXPAND_THRESHOLD || velocity < -VELOCITY_THRESHOLD) {
        setDragOffset(0);
        setCollapsed(false);
        return;
      }
      // Drag down from collapsed → close
      if (deltaY > CLOSE_THRESHOLD || velocity > VELOCITY_THRESHOLD) {
        setDragOffset(0);
        onClose();
        return;
      }
    } else {
      // Drag down from expanded → collapse (not close)
      if (deltaY > CLOSE_THRESHOLD || velocity > VELOCITY_THRESHOLD) {
        setDragOffset(0);
        setCollapsed(true);
        return;
      }
    }

    setDragOffset(0);
  }

  function handleCollapsedTap() {
    if (!draggingRef.current) {
      setCollapsed(false);
    }
  }

  if (!isOpen) return null;

  return (
    <>
      {!collapsed && (
        <div className="panel-mobile-backdrop" onClick={() => setCollapsed(true)} aria-hidden="true" />
      )}

      <div
        id="panel"
        className={`open mobile-bottom-sheet ${collapsed ? "collapsed" : ""}`}
        style={{
          transform: `translateY(${dragOffset}px)`,
          transition: draggingRef.current ? "none" : "transform 280ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div
          className="bottom-sheet-drag-zone"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={collapsed ? handleCollapsedTap : undefined}
        >
          <div className="bottom-sheet-handle" />
        </div>

        <button className="panel-close" onClick={onClose} aria-label="Close panel">
          &times;
        </button>

        <div
          className="panel-header"
          onClick={collapsed ? handleCollapsedTap : undefined}
        >
          {subtitle && <div className="panel-type">{subtitle}</div>}
          <h2>{title}</h2>
          {collapsed && summary && (
            <div className="bottom-sheet-summary">{summary}</div>
          )}
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

        <div className="bottom-sheet-content">
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
      </div>
    </>
  );
}
