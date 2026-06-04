"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SORT_OPTIONS } from "@/lib/constants";

export function SortSelect() {
  const router = useRouter();
  const sp = useSearchParams();

  function change(value: string) {
    const params = new URLSearchParams(Array.from(sp.entries()));
    params.set("sort", value);
    params.delete("page");
    router.push(`/buscar?${params.toString()}`);
  }

  return (
    <select
      className="input w-auto"
      value={sp.get("sort") ?? "recent"}
      onChange={(e) => change(e.target.value)}
      aria-label="Ordenar por"
    >
      {SORT_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
