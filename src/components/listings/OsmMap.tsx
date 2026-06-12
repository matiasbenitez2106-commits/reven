"use client";

import { MapContainer, TileLayer, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Mapa estilo Apple Maps (tiles cálidos de CARTO Voyager, gratis, sin API key):
// tonos crema, parques verdes, agua celeste. Círculo celeste de zona aproximada.
export default function OsmMap({ lat, lng }: { lat: number; lng: number }) {
  const key = process.env.NEXT_PUBLIC_MAPTILER_KEY;
  const tileUrl = key
    ? `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}@2x.png?key=${key}`
    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

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
      <TileLayer url={tileUrl} subdomains="abcd" />
      <Circle
        center={[lat, lng]}
        radius={500}
        pathOptions={{
          color: "#66785B",
          weight: 1.5,
          fillColor: "#66785B",
          fillOpacity: 0.12,
        }}
      />
    </MapContainer>
  );
}
