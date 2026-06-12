"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, Loader2, AlertCircle } from "lucide-react";

export function IncludedBoostButton({
  listingId,
  remaining,
}: {
  listingId: string;
  remaining: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function use() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/subscriptions/use-boost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "No se pudo aplicar el destacado.");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950/40 p-4">
      <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300">
        <Crown className="h-5 w-5" />
        <p className="text-sm font-medium">
          Tu plan incluye destacados gratis — te quedan {remaining} este mes.
        </p>
      </div>
      <button
        onClick={use}
        disabled={loading}
        className="mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Usar destacado incluido (7 días)
      </button>
      {error && (
        <p className="mt-2 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="h-3.5 w-3.5" /> {error}
        </p>
      )}
    </div>
  );
}
