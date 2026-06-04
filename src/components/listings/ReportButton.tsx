"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Flag, X, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { REPORT_REASON_LABELS } from "@/lib/constants";

export function ReportButton({ listingId }: { listingId: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("FRAUD");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openDialog() {
    if (!session?.user) {
      router.push(`/ingresar?callbackUrl=/articulos/${listingId}`);
      return;
    }
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, reason, details }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "No se pudo enviar la denuncia.");
      }
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={openDialog}
        className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-red-600"
      >
        <Flag className="h-3.5 w-3.5" /> Denunciar publicación
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-semibold">
                <Flag className="h-4 w-4 text-red-600" /> Denunciar publicación
              </h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {done ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
                <p className="font-medium">¡Gracias por avisar!</p>
                <p className="text-sm text-gray-500">
                  Nuestro equipo va a revisar esta publicación.
                </p>
                <button
                  onClick={() => setOpen(false)}
                  className="mt-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                  </div>
                )}
                <div>
                  <label className="label">Motivo</label>
                  <select className="input" value={reason} onChange={(e) => setReason(e.target.value)}>
                    {Object.entries(REPORT_REASON_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Detalles (opcional)</label>
                  <textarea
                    className="input"
                    rows={3}
                    maxLength={1000}
                    placeholder="Contanos qué está mal..."
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Enviar denuncia
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
