// Utilidades de geolocalización: distancia (Haversine) y geocoding.

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Distancia en kilómetros entre dos puntos (fórmula de Haversine). */
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export interface LatLng {
  lat: number;
  lng: number;
}

/** Bounding box aproximado para acotar consultas por radio antes de calcular Haversine. */
export function boundingBox(center: LatLng, radiusKm: number) {
  const latDelta = radiusKm / 111; // ~111 km por grado de latitud
  const lngDelta = radiusKm / (111 * Math.cos(toRad(center.lat)) || 1);
  return {
    minLat: center.lat - latDelta,
    maxLat: center.lat + latDelta,
    minLng: center.lng - lngDelta,
    maxLng: center.lng + lngDelta,
  };
}

// Diccionario mínimo de ciudades argentinas para fallback sin Mapbox.
const AR_CITIES: Record<string, LatLng> = {
  caba: { lat: -34.6037, lng: -58.3816 },
  "buenos aires": { lat: -34.6037, lng: -58.3816 },
  "la plata": { lat: -34.9215, lng: -57.9545 },
  "mar del plata": { lat: -38.0055, lng: -57.5426 },
  cordoba: { lat: -31.4201, lng: -64.1888 },
  "córdoba": { lat: -31.4201, lng: -64.1888 },
  rosario: { lat: -32.9442, lng: -60.6505 },
  mendoza: { lat: -32.8895, lng: -68.8458 },
  "san miguel de tucuman": { lat: -26.8083, lng: -65.2176 },
  tucuman: { lat: -26.8083, lng: -65.2176 },
  salta: { lat: -24.7821, lng: -65.4232 },
  "santa fe": { lat: -31.6333, lng: -60.7 },
  neuquen: { lat: -38.9516, lng: -68.0591 },
  "neuquén": { lat: -38.9516, lng: -68.0591 },
  "bahia blanca": { lat: -38.7196, lng: -62.2724 },
  resistencia: { lat: -27.4514, lng: -58.9867 },
  posadas: { lat: -27.3621, lng: -55.9 },
  "san juan": { lat: -31.5375, lng: -68.5364 },
  "san salvador de jujuy": { lat: -24.1858, lng: -65.2995 },
  jujuy: { lat: -24.1858, lng: -65.2995 },
  corrientes: { lat: -27.4806, lng: -58.8341 },
};

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

/**
 * Geocodifica una consulta ("ciudad, provincia") a coordenadas.
 * Usa Mapbox si hay token; si no, recurre al diccionario de ciudades AR.
 * Devuelve null si no encuentra nada.
 */
export async function geocode(query: string): Promise<LatLng | null> {
  // 1. MapTiler (usa la misma key que los mapas). Confiable y preciso.
  const mtKey = process.env.MAPTILER_KEY || process.env.NEXT_PUBLIC_MAPTILER_KEY;
  if (mtKey) {
    try {
      const url =
        `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json` +
        `?key=${mtKey}&country=ar&limit=1`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const c = data.features?.[0]?.center; // [lng, lat]
        if (Array.isArray(c) && c.length === 2) return { lng: c[0], lat: c[1] };
      }
    } catch (err) {
      console.error("MapTiler geocoding falló, usando fallback:", err);
    }
  }

  const token = process.env.MAPBOX_TOKEN;
  if (token) {
    try {
      const url =
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
        `?country=ar&limit=1&access_token=${token}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const feature = data.features?.[0];
        if (feature?.center) {
          return { lng: feature.center[0], lat: feature.center[1] };
        }
      }
    } catch (err) {
      console.error("Mapbox geocoding falló, usando fallback:", err);
    }
  }

  // Nominatim (OpenStreetMap) — gratis, sin API key
  try {
    const url =
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ar&q=` +
      encodeURIComponent(query);
    const res = await fetch(url, {
      headers: { "User-Agent": "trato/1.0 (https://reven-reven-projects.vercel.app)" },
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.[0]?.lat && data?.[0]?.lon) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    }
  } catch (err) {
    console.error("Nominatim geocoding falló, usando fallback:", err);
  }

  // Fallback por diccionario de ciudades AR: probamos cada parte de la consulta
  // (barrio, ciudad, provincia) y limpiamos prefijos como "Ciudad de" / "Provincia de".
  for (const part of query.split(",")) {
    const p = normalize(part);
    const cleaned = p
      .replace(/^ciudad (aut[oó]noma )?de /, "")
      .replace(/^provincia de /, "");
    if (AR_CITIES[p]) return AR_CITIES[p];
    if (AR_CITIES[cleaned]) return AR_CITIES[cleaned];
  }
  return null;
}
