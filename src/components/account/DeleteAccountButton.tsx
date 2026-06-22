"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { AlertCircle, Trash2, X, Info } from "lucide-react";
import { Button } from "@/components/ui/Button";

const CONFIRM_WORD = "ELIMINAR";

export function DeleteAccountButton() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockedMsg, setBlockedMsg] = useState<string | null>(null);

  async function onDelete() {
    if (text.trim().toUpperCase() !== CONFIRM_WORD) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/me", { method: "DELETE" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "No se pudo procesar la baja.");
      if (j.blocked) {
        // Camino del bloqueo: no se cierra sesión; se muestra el aviso sobrio.
        setBlockedMsg(
          j.message || "Tu baja quedó pendiente por una disputa abierta en tu cuenta."
        );
        setLoading(false);
        return;
      }
      // Baja programada (gracia 90 días): cerramos sesión.
      await signOut({ callbackUrl: "/" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado.");
      setLoading(false);
    }
  }

  return (
    <div className="card border-red-200 dark:border-red-900 p-6">
      <h2 className="flex items-center gap-2 font-semibold text-red-700 dark:text-red-300">
        <Trash2 className="h-4 w-4" /> Dar de baja mi cuenta
      </h2>
      <p className="mt-2 text-sm text-gray-600 dark:text-stone-300">
        Al dar de baja, tu cuenta queda <strong>en pausa durante 90 días</strong> y tus
        publicaciones se ocultan. Dentro de ese plazo podés reactivarla y no perdés nada. Si no la
        reactivás, a los 90 días se borran de forma definitiva todos tus datos. Te avisamos por email.
      </p>
      <div className="mt-4">
        <Button
          variant="ghost"
          onClick={() => setOpen(true)}
          className="border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40"
        >
          Dar de baja mi cuenta
        </Button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-surface dark:bg-stone-900 p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-stone-100">¿Dar de baja tu cuenta?</h3>
              <button
                onClick={() => !loading && setOpen(false)}
                className="rounded-lg p-1 text-gray-400 dark:text-stone-500 hover:bg-surface-hover dark:hover:bg-stone-800"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {blockedMsg ? (
              <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 p-3 text-sm text-amber-800 dark:text-amber-300">
                <Info className="mt-0.5 h-4 w-4 shrink-0" /> {blockedMsg}
              </div>
            ) : (
              <>
                <p className="mt-2 text-sm text-gray-600 dark:text-stone-300">
                  Tu cuenta va a quedar <strong>en pausa 90 días</strong>. Te mandamos un email con la
                  fecha exacta y un link para reactivarla. Si no hacés nada, a los 90 días se borran{" "}
                  <strong>definitivamente</strong> todos tus datos. Para confirmar, escribí{" "}
                  <strong>{CONFIRM_WORD}</strong>.
                </p>

                {error && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-700 dark:text-red-300">
                    <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                  </div>
                )}

                <input
                  className="input mt-4"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={CONFIRM_WORD}
                  autoFocus
                />
              </>
            )}

            <div className="mt-5 flex justify-end gap-2">
              {blockedMsg ? (
                <Button variant="ghost" onClick={() => { setOpen(false); setBlockedMsg(null); }}>
                  Entendido
                </Button>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
                    Cancelar
                  </Button>
                  <Button
                    variant="danger"
                    onClick={onDelete}
                    loading={loading}
                    disabled={text.trim().toUpperCase() !== CONFIRM_WORD}
                  >
                    Dar de baja
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
