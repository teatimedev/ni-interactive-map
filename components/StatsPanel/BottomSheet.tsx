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
  population?: string;
}

type SnapPoint = "peek" | "half" | "full" | "closed";

// Heights from bottom of viewport (in vh or px) for each snap point
const SHEET_HEIGHT_VH = 90;

function getSnapOffset(snap: SnapPoint, sheetHeightPx: number): number {
  switch (snap) {
    case "closed":
      return sheetHeightPx; // fully off-screen
    case "peek":
      return sheetHeightPx - 80; // only 80px visible
    case "half":
      return sheetHeightPx - sheetHeightPx * 0.45; // 45vh visible
    case "full":
      return 0; // fully open
  }
}

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  tabs,
  population,
}: BottomSheetProps) {
  const [snap, setSnap] = useState<SnapPoint>("peek");
  const [dragOffset, setDragOffset] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>(tabs[0]?.id ?? "");
  const [sheetHeightPx, setSheetHeightPx] = useState(0);

  const touchStartY = useRef<number>(0);
  const touchStartOffset = useRef<number>(0);
  const lastTouchY = useRef<number>(0);
  const lastTouchTime = useRef<number>(0);

  // Calculate sheet height in px from viewport height
  useEffect(() => {
    const updateHeight = () => {
      setSheetHeightPx(window.innerHeight * (SHEET_HEIGHT_VH / 100));
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  // Reset to peek when opened
  useEffect(() => {
    if (isOpen) {
      setSnap("peek");
    }
  }, [isOpen]);

  // Reset to first tab when tabs change
  useEffect(() => {
    if (tabs.length > 0) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs]);

  const snapOffset =
    sheetHeightPx > 0 ? getSnapOffset(snap, sheetHeightPx) : sheetHeightPx;
  const currentOffset =
    dragOffset !== null ? dragOffset : isOpen ? snapOffset : sheetHeightPx;

  function expandToHalf() {
    if (snap === "peek") {
      setSnap("half");
    }
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY;
    touchStartOffset.current = currentOffset;
    lastTouchY.current = e.touches[0].clientY;
    lastTouchTime.current = e.timeStamp;
  }

  function handleTouchMove(e: React.TouchEvent) {
    const deltaY = e.touches[0].clientY - touchStartY.current;
    const newOffset = Math.max(
      0,
      Math.min(sheetHeightPx, touchStartOffset.current + deltaY)
    );
    setDragOffset(newOffset);
    lastTouchY.current = e.touches[0].clientY;
    lastTouchTime.current = e.timeStamp;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (dragOffset === null) return;

    const deltaTime = e.timeStamp - lastTouchTime.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    // Velocity in px/ms (positive = downward)
    const velocity = deltaTime > 0 ? deltaY / deltaTime : 0;

    const peekOffset = getSnapOffset("peek", sheetHeightPx);
    const halfOffset = getSnapOffset("half", sheetHeightPx);
    const fullOffset = getSnapOffset("full", sheetHeightPx);

    let nextSnap: SnapPoint;

    // Fast flick detection (velocity threshold: 0.5 px/ms)
    if (velocity < -0.5) {
      // Fast flick up
      if (snap === "peek") nextSnap = "half";
      else if (snap === "half") nextSnap = "full";
      else nextSnap = "full";
    } else if (velocity > 0.5) {
      // Fast flick down
      if (snap === "full") nextSnap = "half";
      else if (snap === "half") nextSnap = "peek";
      else {
        // swiping down from peek → close
        nextSnap = "closed";
      }
    } else {
      // Snap to nearest based on position
      const distances: { snap: SnapPoint; dist: number }[] = [
        { snap: "full", dist: Math.abs(dragOffset - fullOffset) },
        { snap: "half", dist: Math.abs(dragOffset - halfOffset) },
        { snap: "peek", dist: Math.abs(dragOffset - peekOffset) },
      ];
      distances.sort((a, b) => a.dist - b.dist);
      nextSnap = distances[0].snap;
    }

    setDragOffset(null);
    if (nextSnap === "closed") {
      setSnap("peek");
      onClose();
    } else {
      setSnap(nextSnap);
    }
  }

  // Don't render at all if not open and no drag in progress
  if (!isOpen && dragOffset === null) return null;

  return (
    <>
      {/* Backdrop — only visible at half/full */}
      {(snap === "half" || snap === "full") && dragOffset === null && (
        <div
          className="fixed inset-0 z-[1000] bg-black/30"
          onClick={() => setSnap("peek")}
        />
      )}

      <div
        className="fixed bottom-0 left-0 right-0 z-[1001] bg-[var(--bg-panel,#1a1a1a)] rounded-t-xl shadow-[0_-4px_20px_rgba(0,0,0,0.4)]"
        style={{
          transform: `translateY(${currentOffset}px)`,
          height: `${SHEET_HEIGHT_VH}vh`,
          transition: dragOffset !== null ? "none" : "transform 300ms cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* Drag handle */}
        <div
          className="flex justify-center py-2 cursor-grab active:cursor-grabbing select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-10 h-1 bg-[#555] rounded-full" />
        </div>

        {/* Peek content — always visible, tapping expands to half */}
        <div
          className="px-4 pb-2 flex justify-between items-center cursor-pointer select-none"
          onClick={expandToHalf}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div>
            {subtitle && (
              <div className="text-[11px] text-[var(--text-secondary,#999)] uppercase tracking-wider">
                {subtitle}
              </div>
            )}
            <div className="text-sm font-semibold text-white">{title}</div>
          </div>
          {population && (
            <div className="text-xs text-[var(--text-secondary,#999)]">
              Pop: {population}
            </div>
          )}
        </div>

        {/* Tab bar + scrollable content (visible at half and full) */}
        <div
          className="overflow-y-auto"
          style={{ height: `calc(${SHEET_HEIGHT_VH}vh - 80px)` }}
        >
          {/* Tab bar */}
          <div
            className="sticky top-0 z-10 bg-[var(--bg-panel,#1a1a1a)] border-b border-[#2a2a2a] overflow-x-auto"
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
                    aria-controls={`bs-tabpanel-${tab.id}`}
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
          <div>
            {tabs.map((tab) => (
              <div
                key={tab.id}
                id={`bs-tabpanel-${tab.id}`}
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
      </div>
    </>
  );
}
