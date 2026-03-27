"use client";

import { useState, useEffect } from "react";
import { timeAgo } from "@/lib/utils";

interface RecentPin {
  label: string;
  username: string | null;
  ward_slug: string | null;
  created_at: string;
}

interface ActivityPillProps {
  onClick: () => void;
}

export default function ActivityPill({ onClick }: ActivityPillProps) {
  const [pins, setPins] = useState<RecentPin[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetch("/api/pins/recent?limit=5")
      .then((r) => r.json())
      .then((data) => setPins(data.pins ?? []))
      .catch(() => {});
  }, []);

  // Rotate through pins every 8 seconds
  useEffect(() => {
    if (pins.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % pins.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [pins.length]);

  if (pins.length === 0) return null;

  const pin = pins[currentIndex];
  const wardName = pin.ward_slug?.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <button className="activity-pill" onClick={onClick} title="What's happening across NI">
      <span className="activity-pill-icon">📍</span>
      <span className="activity-pill-text">
        <strong>{pin.username ?? "someone"}</strong>
        {": "}
        {pin.label.length > 35 ? pin.label.slice(0, 35) + "…" : pin.label}
        {wardName && <span className="activity-pill-ward"> — {wardName}</span>}
        <span className="activity-pill-time">{timeAgo(pin.created_at)}</span>
      </span>
    </button>
  );
}
