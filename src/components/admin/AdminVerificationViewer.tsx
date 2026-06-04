"use client";

import { useState } from "react";
import { Eye, X, Loader2 } from "lucide-react";

interface VData {
  dniNumber: string | null;
  dniFront: string | null;
  dniBack: string | null;
  selfie: string | null;
  livenessScore: number | null;
  matchScore: number | null;
}

function pct(n: number | null): string {
  return n == null ? "—" : `${Math.round(n * 100)}%`;
}

function Img({ label, src }: { label: string; src: string | null }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-gray-500">{label}</p>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={label} className="w-full rounded-lg border border-gray-200" />
      ) : (
        <div className="flex h-24 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
          Sin imagen
        </div>
      )}
    </div>
  );
}

export function AdminVerificationViewer({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<VData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openViewer() {
    setOpen(true);
    if (data || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/verification/${userId}`);
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      setError("No se pudo cargar la documentación.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={openViewer}
        className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-gray-50"
      >
        <Eye className="h-3.5 w-3.5" /> Ver documentos
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Documentación de verificación</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {loading ? (
              <div className="py-10 text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : data ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-700">
                  <b>DNI:</b> {data.dniNumber || "—"} &nbsp;·&nbsp; <b>Liveness:</b>{" "}
                  {pct(data.livenessScore)} &nbsp;·&nbsp; <b>Match:</b> {pct(data.matchScore)}
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Img label="Frente del DNI" src={data.dniFront} />
                  <Img label="Dorso del DNI" src={data.dniBack} />
                  <Img label="Selfie" src={data.selfie} />
                </div>
                <p className="text-xs text-gray-400">
                  Datos sensibles · acceso restringido a administradores.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}
