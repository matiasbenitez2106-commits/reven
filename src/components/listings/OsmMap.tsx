"use client";

import { MapContainer, TileLayer, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Mapa estilo Apple Maps (tiles cálidos de CARTO Voyager, gratis, sin API key):
// tonos crema, parques verdes, agua celeste. Círculo celeste de zona aproximada.
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
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
      />
      <Circle
        center={[lat, lng]}
        radius={500}
        pathOptions={{
          color: "#007aff",
          weight: 1.5,
          fillColor: "#007aff",
          fillOpacity: 0.12,
        }}
      />
    </MapContainer>
  );
}
