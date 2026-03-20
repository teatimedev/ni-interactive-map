"use client";

import { MapContainer as LeafletMap, TileLayer, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const NI_CENTER: [number, number] = [54.6, -7.0];

export default function MapContainer({ children }: { children?: React.ReactNode }) {
  return (
    <LeafletMap
      center={NI_CENTER}
      zoom={8}
      minZoom={7}
      maxZoom={15}
      maxBounds={[[53.5, -9.0], [55.8, -4.5]]}
      maxBoundsViscosity={1.0}
      zoomControl={false}
      attributionControl={true}
      className="absolute inset-0 z-[1]"
      style={{ background: "#1a1a1a" }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        subdomains="abcd"
        maxZoom={19}
      />
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={19}
        pane="overlayPane"
      />
      <ZoomControl position="topright" />
      {children}
    </LeafletMap>
  );
}
