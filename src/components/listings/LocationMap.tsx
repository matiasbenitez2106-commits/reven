import { MapPin } from "lucide-react";

// Mapa de ubicación APROXIMADA (no muestra dirección exacta).
// Usa OpenStreetMap embebido (gratis, sin API key ni tarjeta).
// El círculo translúcido representa la zona aproximada (~500 m).
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

  // Bounding box de ~600 m alrededor del punto (sin marcador = zona aproximada)
  const d = 0.006;
  const bbox = `${lng - d}%2C${lat - d}%2C${lng + d}%2C${lat + d}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`;

  return (
    <div className="relative h-48 overflow-hidden rounded-xl border border-gray-200">
      <iframe
        title="Ubicación aproximada"
        src={src}
        className="h-full w-full"
        style={{ border: 0 }}
        loading="lazy"
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-24 w-24 rounded-full bg-brand-500/20 ring-4 ring-brand-500/30" />
      </div>
      <div className="pointer-events-none absolute bottom-2 left-2 rounded bg-white/90 px-2 py-1 text-xs text-gray-600 shadow">
        <MapPin className="mr-1 inline h-3 w-3" /> Zona aproximada · {label}
      </div>
    </div>
  );
}
