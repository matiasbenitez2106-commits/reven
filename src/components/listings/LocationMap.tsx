"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";

// El mapa Leaflet se carga solo en el cliente (usa window).
const OsmMap = dynamic(() => import("./OsmMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-gray-100" />,
});

// Ubicación APROXIMADA (no muestra dirección exacta). Gratis, sin API key.
export function LocationMap({
  lat,
  lng,
  label,
}: {
  lat: number | null;
  lng: number | null;
  label: string;
}) {
  if (lat == null || lng == null) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-500">
        <MapPin className="mr-1 h-4 w-4" /> Zona: {label}
      </div>
    );
  }

  return (
    <div className="relative h-48 overflow-hidden rounded-xl border border-gray-200">
      <OsmMap lat={lat} lng={lng} />
      <div className="pointer-events-none absolute bottom-2 left-2 z-[1000] rounded-md bg-white/90 px-2 py-1 text-xs text-gray-600 shadow-sm">
        <MapPin className="mr-1 inline h-3 w-3" /> Zona aproximada · {label}
      </div>
    </div>
  );
}
