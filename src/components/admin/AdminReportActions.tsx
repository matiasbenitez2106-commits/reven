"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Ban, Trash2, Loader2 } from "lucide-react";

export function AdminReportActions({
  reportId,
  listingId,
}: {
  reportId: string;
  listingId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function setStatus(status: string) {
    setLoading(status);
    await fetch(`/api/admin/reports/${reportId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoading(null);
    router.refresh();
  }

  async function removeListing() {
    if (!confirm("¿Eliminar la publicación denunciada? No se puede deshacer.")) return;
    setLoading("del");
    await fetch(`/api/listings/${listingId}`, { method: "DELETE" });
    await fetch(`/api/admin/reports/${reportId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ACTIONED" }),
    });
    setLoading(null);
    router.refresh();
  }

  const btn =
    "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium disabled:opacity-50";

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => setStatus("REVIEWED")}
        disabled={loading !== null}
        className={`${btn} border-gray-300 bg-white text-gray-700 hover:bg-gray-50`}
      >
        {loading === "REVIEWED" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        Revisado
      </button>
      <button
        onClick={() => setStatus("DISMISSED")}
        disabled={loading !== null}
        className={`${btn} border-gray-300 bg-white text-gray-700 hover:bg-gray-50`}
      >
        {loading === "DISMISSED" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />}
        Desestimar
      </button>
      <button
        onClick={removeListing}
        disabled={loading !== null}
        className={`${btn} border-red-200 bg-red-50 text-red-700 hover:bg-red-100`}
      >
        {loading === "del" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        Eliminar publicación
      </button>
    </div>
  );
}
