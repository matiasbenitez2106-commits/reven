"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function HomeSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = q.trim();
    router.push(value ? `/buscar?q=${encodeURIComponent(value)}` : "/buscar");
  }

  return (
    <form onSubmit={onSubmit} className="relative mx-auto mt-6 max-w-xl">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="¿Qué estás buscando? Ej: iPhone, bici, sillón..."
        className="h-14 w-full rounded-full border border-gray-300 bg-white pl-12 pr-28 text-base shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
      >
        Buscar
      </button>
    </form>
  );
}
