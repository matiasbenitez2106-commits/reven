"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";

export function AdminVerificationActions({ userId }: { userId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function decide(decision: "VERIFIED" | "REJECTED") {
    let reason: string | undefined;
    if (decision === "REJECTED") {
      reason = prompt("Motivo del rechazo (opcional):") || undefined;
    }
    setLoading(decision);
    await fetch("/api/verification/decision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, decision, reason }),
    });
    setLoading(null);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => decide("VERIFIED")}
        disabled={loading !== null}
        className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {loading === "VERIFIED" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        Aprobar
      </button>
      <button
        onClick={() => decide("REJECTED")}
        disabled={loading !== null}
        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
      >
        {loading === "REJECTED" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
        Rechazar
      </button>
    </div>
  );
}
