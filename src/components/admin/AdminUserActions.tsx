"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, RotateCcw } from "lucide-react";

// Acción sobre una cuenta en la tabla de usuarios: suspender / reactivar.
export function AdminUserActions({
  userId,
  suspended,
}: {
  userId: string;
  suspended: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function suspendToggle() {
    const action = suspended ? "unsuspend" : "suspend";
    if (
      !suspended &&
      !confirm("¿Suspender esta cuenta? No podrá ingresar y sus publicaciones se pausan.")
    )
      return;
    setLoading("suspend");
    try {
      const r = await fetch(`/api/admin/users/${userId}`, {
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

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={suspendToggle}
        disabled={loading !== null}
        className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition disabled:opacity-50 ${
          suspended
            ? "border-brand-200 dark:border-brand-700 text-brand-700 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/30"
            : "border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
        }`}
      >
        {suspended ? <RotateCcw className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
        {loading === "suspend" ? "..." : suspended ? "Reactivar" : "Suspender"}
      </button>
    </div>
  );
}
