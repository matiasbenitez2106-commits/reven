"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, MapPin, Check } from "lucide-react";
import { CONDITION_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/Button";

const DISTANCES = [
  { value: "", label: "Cualquier distancia" },
  { value: "5", label: "Hasta 5 km" },
  { value: "10", label: "Hasta 10 km" },
  { value: "25", label: "Hasta 25 km" },
  { value: "50", label: "Hasta 50 km" },
  { value: "100", label: "Hasta 100 km" },
];

export function SearchFilters({
  categories,
}: {
  categories: { slug: string; name: string }[];
}) {
  const router = useRouter();
  const sp = useSearchParams();

  const [q, setQ] = useState(sp.get("q") ?? "");
  const [category, setCategory] = useState(sp.get("category") ?? "");
  const [minPrice, setMinPrice] = useState(sp.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(sp.get("maxPrice") ?? "");
  const [condition, setCondition] = useState(sp.get("condition") ?? "");
  const [distance, setDistance] = useState(sp.get("distance") ?? "");
  const [coords, setCoords] = useState<{ lat: string; lng: string } | null>(
    sp.get("lat") && sp.get("lng")
      ? { lat: sp.get("lat")!, lng: sp.get("lng")! }
      : null
  );

  function buildAndGo(over?: { lat?: string; lng?: string }) {
    const params = new URLSearchParams();
    const sort = sp.get("sort");
    if (sort) params.set("sort", sort);
    if (q.trim()) params.set("q", q.trim());
    if (category) params.set("category", category);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (condition) params.set("condition", condition);
    if (distance) params.set("distance", distance);
    const lat = over?.lat ?? coords?.lat;
    const lng = over?.lng ?? coords?.lng;
    if (lat && lng) {
      params.set("lat", lat);
      params.set("lng", lng);
    }
    router.push(`/buscar?${params.toString()}`);
  }

  function useMyLocation() {
    navigator.geolocation?.getCurrentPosition((pos) => {
      const c = { lat: String(pos.coords.latitude), lng: String(pos.coords.longitude) };
      setCoords(c);
      buildAndGo(c);
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        buildAndGo();
      }}
      className="card space-y-4 p-4"
    >
      <div className="flex items-center gap-2 font-semibold">
        <SlidersHorizontal className="h-4 w-4" /> Filtros
      </div>

      <div>
        <label className="label">Buscar</label>
        <input
          className="input"
          placeholder="Palabra clave"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div>
        <label className="label">Categoría</label>
        <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Todas</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Precio (ARS)</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            className="input"
            placeholder="Mín"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
          <span className="text-gray-400">—</span>
          <input
            type="number"
            min={0}
            className="input"
            placeholder="Máx"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="label">Condición</label>
        <select className="input" value={condition} onChange={(e) => setCondition(e.target.value)}>
          <option value="">Cualquiera</option>
          {Object.entries(CONDITION_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Distancia</label>
        <select className="input" value={distance} onChange={(e) => setDistance(e.target.value)}>
          {DISTANCES.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={useMyLocation}
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
        >
          {coords ? <Check className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
          {coords ? "Ubicación activada" : "Usar mi ubicación"}
        </button>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1">
          Aplicar
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push("/buscar")}>
          Limpiar
        </Button>
      </div>
    </form>
  );
}
