"use client";

import { useEffect, useState, useCallback } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";

interface Pin {
  id: number;
  lat: number;
  lng: number;
  label: string;
  created_at: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const pinIcon = new L.DivIcon({
  className: "",
  html: '<div class="pin-marker-icon"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
});

export default function PinLayer({ refreshKey }: { refreshKey: number }) {
  const [pins, setPins] = useState<Pin[]>([]);

  const fetchPins = useCallback(async () => {
    try {
      const res = await fetch("/api/pins");
      const data = await res.json();
      setPins(data.pins ?? []);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchPins();
  }, [fetchPins, refreshKey]);

  async function handleReport(id: number) {
    try {
      await fetch("/api/pins", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      fetchPins();
    } catch {
      // silently fail
    }
  }

  return (
    <>
      {pins.map((pin) => (
        <Marker key={pin.id} position={[pin.lat, pin.lng]} icon={pinIcon}>
          <Popup>
            <div className="pin-popup-label">{pin.label}</div>
            <div className="pin-popup-time">{timeAgo(pin.created_at)}</div>
            <button className="pin-popup-report" onClick={() => handleReport(pin.id)}>
              Report
            </button>
          </Popup>
        </Marker>
      ))}
    </>
  );
}
