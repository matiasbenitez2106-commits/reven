"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Trash2, X } from "lucide-react";

// Botón "Completar baja" para cuentas BLOQUEADAS. Llama al endpoint con todas las
// salvaguardas en el servidor (POST /api/admin/users/{id}/complete-deletion).
export function CompleteDeletionButton({
  userId,
  email,
  openReports,
}: {
  userId: string;
  email: string;
  openReports: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // El texto escrito habilita el borrado solo si coincide con el email de la cuenta
  // (mismo criterio que el servidor: sin distinguir mayúsculas, recortando espacios).
  const matches = text.trim().toLowerCase() === email.trim().toLowerCase();

  // CASO 1: todavía hay denuncias abiertas → botón apagado, con explicación.
  if (openReports > 0) {
    return (
      <span
        title="Resolvé las denuncias abiertas antes de completar la baja"
        className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg border border-line dark:border-stone-800 px-2 py-1 text-xs font-medium text-gray-400 dark:text-stone-600"
      >
        <Trash2 className="h-3.5 w-3.5" /> Completar baja
      </span>
    );
  }

  async function onConfirm() {
    if (!matches) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/admin/users/${userId}/complete-deletion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: text.trim() }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.ok) {
        setDone(true);
        setLoading(false);
        return;
      }
      // El endpoint devolvió un error claro: lo mostramos y NO borramos nada.
      setError(j.error || "No se pudo completar la baja.");
      setLoading(false);
    } catch {
      setError("Hubo un problema de conexión. Probá de nuevo en un momento.");
      setLoading(false);
    }
  }

  function closeDone() {
    setOpen(false);
    setDone(false);
    setText("");
    router.refresh(); // la cuenta borrada ya no debería aparecer en la lista
  }

  // CASO 2: sin denuncias → botón activo + diálogo con confirmación por email.
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-lg border border-red-300 dark:border-red-800 px-2 py-1 text-xs font-medium text-red-700 dark:text-red-300 transition hover:bg-red-50 dark:hover:bg-red-950/40"
      >
        <Trash2 className="h-3.5 w-3.5" /> Completar baja
      </button>

      {open && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-surface dark:bg-stone-900 p-6 shadow-xl">
            {done ? (
              <>
                <div className="flex items-start gap-2 text-brand-700 dark:text-brand-300">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold">Baja completada</h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-stone-300">
                      Se borró la cuenta y todos sus datos de forma definitiva.
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex justify-end">
                  <button
                    onClick={closeDone}
                    className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                  >
                    Listo
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-stone-100">
                    Completar la baja de esta cuenta
                  </h3>
                  <button
                    onClick={() => !loading && setOpen(false)}
                    className="rounded-lg p-1 text-gray-400 dark:text-stone-500 hover:bg-gray-100 dark:hover:bg-stone-800"
                    aria-label="Cerrar"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <p className="mt-2 text-sm text-gray-600 dark:text-stone-300">
                  Esto borra <strong>de forma definitiva</strong> la cuenta y todos sus datos
                  (incluidas las imágenes de verificación). No se puede deshacer. Para confirmar,
                  escribí el email de la cuenta:
                </p>
                <p className="mt-2 rounded-lg bg-gray-50 dark:bg-stone-800/60 px-3 py-2 text-sm font-medium text-gray-700 dark:text-stone-200">
                  {email}
                </p>

                {error && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-700 dark:text-red-300">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
                  </div>
                )}

                <input
                  className="input mt-4"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Escribí el email exacto"
                  autoFocus
                  autoComplete="off"
                />

                <div className="mt-5 flex justify-end gap-2">
                  <button
                    onClick={() => setOpen(false)}
                    disabled={loading}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 dark:text-stone-200 hover:bg-gray-100 dark:hover:bg-stone-800 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={onConfirm}
                    disabled={!matches || loading}
                    className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:pointer-events-none disabled:opacity-50"
                  >
                    {loading ? "Borrando..." : "Borrar definitivamente"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
