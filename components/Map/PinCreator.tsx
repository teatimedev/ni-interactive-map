"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Marker } from "react-leaflet";
import L from "leaflet";
import { useAuth } from "@/hooks/useAuth";
import { findWardForPoint } from "@/lib/geo-utils";
import type { WardCache } from "@/hooks/useMapState";

interface PinDragMarkerProps {
  lat: number;
  lng: number;
  onMove: (lat: number, lng: number) => void;
}

function createDraggablePinIcon() {
  return new L.DivIcon({
    className: "",
    html: `<div class="pin-marker-icon pin-draggable"></div>
           <div class="pin-drag-label">hold &amp; drag</div>`,
    iconSize: [40, 44],
    iconAnchor: [20, 44],
  });
}

/** Draggable marker rendered inside MapContainer */
export function PinDragMarker({ lat, lng, onMove }: PinDragMarkerProps) {
  const markerRef = useRef<L.Marker>(null);
  const icon = useMemo(() => createDraggablePinIcon(), []);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker) {
          const pos = marker.getLatLng();
          onMove(pos.lat, pos.lng);
        }
      },
    }),
    [onMove]
  );

  return (
    <Marker
      position={[lat, lng]}
      icon={icon}
      draggable
      ref={markerRef}
      eventHandlers={eventHandlers}
    />
  );
}

/** Label input form rendered outside MapContainer as fixed overlay */
interface PinCreatorFormProps {
  lat: number;
  lng: number;
  onCreated: () => void;
  onCancel: () => void;
  wardCache?: Map<string, WardCache>;
}

export default function PinCreatorForm({ lat, lng, onCreated, onCancel, wardCache }: PinCreatorFormProps) {
  const { getToken } = useAuth();
  const [label, setLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(t);
  }, []);

  async function handleSubmit() {
    if (label.trim().length < 3) return;
    setSubmitting(true);
    setError("");
    try {
      const token = await getToken();
      const res = await fetch("/api/pins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          lat, lng, label: label.trim(),
          ...(wardCache ? findWardForPoint(lat, lng, wardCache) ?? {} : {}),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onCreated();
      } else {
        setError(data.error || "Failed to drop pin");
      }
    } catch {
      setError("Network error");
    }
    setSubmitting(false);
  }

  return (
    <div className="pin-creator">
      <div className="pin-creator-header">
        <h3>Drop a pin</h3>
        <span className="pin-creator-drag-hint">Drag the pin to adjust</span>
      </div>
      <input
        ref={inputRef}
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value.slice(0, 50))}
        onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); if (e.key === "Escape") onCancel(); }}
        placeholder="Unreal chippy, avoid this area..."
        disabled={submitting}
      />
      <div className="pin-creator-footer">
        <span className="pin-creator-counter">{label.length}/50</span>
        <div className="pin-creator-actions">
          <button className="btn-map" style={{ fontSize: 11, padding: "5px 10px" }} onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn-map pin-active"
            style={{ fontSize: 11, padding: "5px 10px" }}
            disabled={submitting || label.trim().length < 3}
            onClick={handleSubmit}
          >
            {submitting ? "Dropping..." : "Drop Pin"}
          </button>
        </div>
      </div>
      {error && <div style={{ fontSize: 11, color: "var(--negative)", marginTop: 6 }}>{error}</div>}
    </div>
  );
}
