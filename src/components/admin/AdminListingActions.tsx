"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pause, Play, Trash2 } from "lucide-react";

// Acciones de moderación de una publicación en la tabla del admin.
export function AdminListingActions({
  listingId,
  status,
}: {
  listingId: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function act(action: "pause" | "activate" | "delete") {
    if (action === "delete" && !confirm("¿Eliminar esta publicación? No se puede deshacer."))
      return;
    setLoading(action);
    try {
      const r = await fetch(`/api/admin/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => null);
        alert(j?.error || "No se pudo completar la acción");
      }
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  const btn =
    "inline-flex items-center gap-1 rounded-lg border border-line dark:border-stone-800 px-2 py-1 text-xs font-medium text-gray-600 dark:text-stone-300 transition hover:bg-surface-hover dark:hover:bg-stone-800 disabled:opacity-50";

  return (
    <div className="flex items-center gap-1.5">
      {status === "ACTIVE" && (
        <button onClick={() => act("pause")} disabled={!!loading} className={btn}>
          <Pause className="h-3.5 w-3.5" /> {loading === "pause" ? "..." : "Pausar"}
        </button>
      )}
      {status === "PAUSED" && (
        <button onClick={() => act("activate")} disabled={!!loading} className={btn}>
          <Play className="h-3.5 w-3.5" /> {loading === "activate" ? "..." : "Activar"}
        </button>
      )}
      <button
        onClick={() => act("delete")}
        disabled={!!loading}
        className="inline-flex items-center gap-1 rounded-lg border border-red-200 dark:border-red-900 px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 transition hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50"
      >
        <Trash2 className="h-3.5 w-3.5" /> {loading === "delete" ? "..." : "Eliminar"}
      </button>
    </div>
  );
}
