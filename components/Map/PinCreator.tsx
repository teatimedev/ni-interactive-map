"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

interface PinCreatorProps {
  lat: number;
  lng: number;
  onCreated: () => void;
  onCancel: () => void;
}

export default function PinCreator({ lat, lng, onCreated, onCancel }: PinCreatorProps) {
  const { getToken } = useAuth();
  const [label, setLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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
        body: JSON.stringify({ lat, lng, label: label.trim() }),
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
      <h3>Drop a pin</h3>
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value.slice(0, 50))}
        onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); if (e.key === "Escape") onCancel(); }}
        placeholder="Unreal chippy, avoid this area..."
        autoFocus
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
