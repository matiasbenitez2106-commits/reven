"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";

// El mapa Leaflet se carga solo en el cliente (usa window).
const OsmMap = dynamic(() => import("./OsmMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-gray-100 dark:bg-stone-800" />,
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
      <div className="flex h-48 items-center justify-center rounded-xl border border-line dark:border-stone-800 bg-gray-50 dark:bg-stone-900 text-sm text-gray-500 dark:text-stone-400">
        <MapPin className="mr-1 h-4 w-4" /> Zona: {label}
      </div>
    );
  }

  return (
    <div className="relative isolate h-48 overflow-hidden rounded-xl border border-line dark:border-stone-800">
      <OsmMap lat={lat} lng={lng} />
      <div className="pointer-events-none absolute bottom-2 left-2 z-[1000] rounded-md bg-surface/90 dark:bg-stone-900/90 px-2 py-1 text-xs text-gray-600 dark:text-stone-300 shadow-sm">
        <MapPin className="mr-1 inline h-3 w-3" /> Zona aproximada · {label}
      </div>
      <div className="pointer-events-none absolute bottom-1 right-1 z-[1000] rounded bg-surface/70 dark:bg-stone-900/70 px-1 text-[9px] leading-tight text-gray-400 dark:text-stone-500">
        © MapTiler · OpenStreetMap
      </div>
    </div>
  );
}
