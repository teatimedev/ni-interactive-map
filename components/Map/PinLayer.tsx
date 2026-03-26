"use client";

import { useEffect, useState, useCallback } from "react";
import { Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import { useAuth } from "@/hooks/useAuth";
import { timeAgo } from "@/lib/utils";

interface Pin {
  id: number;
  lat: number;
  lng: number;
  label: string;
  username: string | null;
  user_id: string | null;
  created_at: string;
}

function createPinIcon(username: string | null) {
  return new L.DivIcon({
    className: "",
    html: `<div class="pin-marker-icon"></div>${username ? `<div class="pin-username-label">${username}</div>` : ""}`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createClusterIcon(cluster: any) {
  const count = cluster.getChildCount();
  let sizeClass = "pin-cluster-small";
  if (count >= 20) sizeClass = "pin-cluster-large";
  else if (count >= 5) sizeClass = "pin-cluster-medium";

  return new L.DivIcon({
    html: `<div class="pin-cluster ${sizeClass}"><span>${count}</span></div>`,
    className: "",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

export default function PinLayer({ refreshKey }: { refreshKey: number }) {
  const [pins, setPins] = useState<Pin[]>([]);
  const [reportedIds, setReportedIds] = useState<Set<number>>(new Set());
  const { user, isAdmin, getToken } = useAuth();

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
      setReportedIds((prev) => new Set(prev).add(id));
      fetchPins();
    } catch {
      // silently fail
    }
  }

  async function handleDelete(id: number) {
    const token = await getToken();
    if (!token) return;
    try {
      await fetch("/api/pins", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });
      fetchPins();
    } catch {
      // silently fail
    }
  }

  return (
    <MarkerClusterGroup
      chunkedLoading
      maxClusterRadius={50}
      spiderfyOnMaxZoom
      disableClusteringAtZoom={15}
      iconCreateFunction={createClusterIcon}
    >
      {pins.map((pin) => (
        <Marker key={pin.id} position={[pin.lat, pin.lng]} icon={createPinIcon(pin.username)}>
          <Popup>
            <div className="pin-popup-card">
              <div className="pin-popup-label">{pin.label}</div>
              {pin.username && <div className="pin-popup-user">by {pin.username}</div>}
              <div className="pin-popup-time">{timeAgo(pin.created_at)}</div>
              <div className="pin-popup-actions">
                {reportedIds.has(pin.id) ? (
                  <span className="pin-popup-report reported">Reported ✓</span>
                ) : (
                  <button className="pin-popup-report" onClick={() => handleReport(pin.id)}>
                    Report
                  </button>
                )}
                {(isAdmin || (user && pin.user_id === user.id)) && (
                  <button className="pin-popup-delete" onClick={() => handleDelete(pin.id)}>
                    Delete
                  </button>
                )}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MarkerClusterGroup>
  );
}
