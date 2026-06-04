import { MapPin } from "lucide-react";

// Mapa de ubicación APROXIMADA (no muestra dirección exacta).
// Usa Mapbox Static Images si hay token público; si no, un placeholder con la zona.
// El círculo translúcido representa un radio aproximado (~500 m).
export function LocationMap({
  lat,
  lng,
  label,
}: {
  lat: number | null;
  lng: number | null;
  label: string;
}) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (lat == null || lng == null) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-500">
        <MapPin className="mr-1 h-4 w-4" /> Zona: {label}
      </div>
    );
  }

  const overlay = (
    <>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-28 w-28 rounded-full bg-brand-500/20 ring-4 ring-brand-500/30" />
      </div>
      <div className="absolute bottom-2 left-2 rounded bg-white/90 px-2 py-1 text-xs text-gray-600">
        <MapPin className="mr-1 inline h-3 w-3" /> Zona aproximada · {label}
      </div>
    </>
  );

  if (!token) {
    return (
      <div className="relative h-48 overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-brand-50 to-gray-100">
        {overlay}
      </div>
    );
  }

  const url = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${lng},${lat},14,0/600x300@2x?access_token=${token}`;

  return (
    <div className="relative h-48 overflow-hidden rounded-xl border border-gray-200">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="Ubicación aproximada" className="h-full w-full object-cover" />
      {overlay}
    </div>
  );
}
