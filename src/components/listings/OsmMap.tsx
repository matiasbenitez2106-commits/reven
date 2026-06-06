"use client";

import { MapContainer, TileLayer, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Mapa minimalista (tiles claros de CARTO Positron, gratis, sin API key).
// No interactivo: se ve como un mapa estático y prolijo, acorde a la UI.
export default function OsmMap({ lat, lng }: { lat: number; lng: number }) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={14}
      zoomControl={false}
      dragging={false}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      touchZoom={false}
      keyboard={false}
      attributionControl={false}
      style={{ height: "100%", width: "100%", background: "#f8fafc" }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
      />
      <Circle
        center={[lat, lng]}
        radius={500}
        pathOptions={{
          color: "#177853",
          weight: 1.5,
          fillColor: "#229668",
          fillOpacity: 0.15,
        }}
      />
    </MapContainer>
  );
}
