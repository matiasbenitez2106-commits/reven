"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, RotateCcw } from "lucide-react";

// Cerrar / reabrir un mensaje de soporte en el panel.
export function AdminSupportActions({ id, closed }: { id: string; closed: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/support/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: closed ? "OPEN" : "CLOSED" }),
      });
      if (!r.ok) alert("No se pudo actualizar el mensaje");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-stone-800 px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-stone-300 transition hover:bg-gray-50 dark:hover:bg-stone-800 disabled:opacity-50"
    >
      {closed ? <RotateCcw className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
      {loading ? "..." : closed ? "Reabrir" : "Marcar resuelto"}
    </button>
  );
}
