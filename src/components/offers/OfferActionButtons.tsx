"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Repeat, Ban } from "lucide-react";
import { Button } from "@/components/ui/Button";

// Botonera de acciones sobre una oferta. Qué acciones se permiten lo decide
// quien la renderiza (calculado en el servidor con canActOnOffer). El backend
// vuelve a validar todo igual.
export function OfferActionButtons({
  offerId,
  canAccept = false,
  canReject = false,
  canCounter = false,
  canCancel = false,
  onDone,
}: {
  offerId: string;
  canAccept?: boolean;
  canReject?: boolean;
  canCounter?: boolean;
  canCancel?: boolean;
  // Si se pasa, lo llama tras una acción OK (el chat re-fetchea el hilo). Si no,
  // hace router.refresh() (lo que usa /ofertas).
  onDone?: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [counterOpen, setCounterOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function act(action: string, body?: object) {
    setLoading(action);
    setError(null);
    try {
      const res = await fetch(`/api/offers/${offerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...body }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        setError(j?.error || "No se pudo completar la acción");
        return;
      }
      setCounterOpen(false);
      if (onDone) onDone();
      else router.refresh();
    } finally {
      setLoading(null);
    }
  }

  function submitCounter() {
    const n = Number(amount);
    if (!Number.isInteger(n) || n <= 0) {
      setError("Ingresá un monto válido.");
      return;
    }
    act("counter", { amount: n, message });
  }

  if (!canAccept && !canReject && !canCounter && !canCancel) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {error && <p className="w-full text-xs text-red-600 dark:text-red-400">{error}</p>}
      {canAccept && (
        <Button size="sm" variant="primary" loading={loading === "accept"} onClick={() => act("accept")}>
          <Check className="h-4 w-4" /> Aceptar
        </Button>
      )}
      {canCounter && (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setError(null);
            setCounterOpen(true);
          }}
        >
          <Repeat className="h-4 w-4" /> Contraofertar
        </Button>
      )}
      {canReject && (
        <Button size="sm" variant="secondary" loading={loading === "reject"} onClick={() => act("reject")}>
          <X className="h-4 w-4" /> Rechazar
        </Button>
      )}
      {canCancel && (
        <Button size="sm" variant="ghost" loading={loading === "cancel"} onClick={() => act("cancel")}>
          <Ban className="h-4 w-4" /> Cancelar
        </Button>
      )}

      {counterOpen && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setCounterOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-surface dark:bg-stone-900 p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">Contraofertar</h3>
              <button
                onClick={() => setCounterOpen(false)}
                className="text-gray-400 dark:text-stone-500 hover:text-gray-600 dark:hover:text-stone-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <label className="label">Monto (ARS)</label>
            <input
              className="input"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="Ej: 25000"
            />
            <label className="label mt-3">Mensaje (opcional)</label>
            <textarea
              className="input"
              rows={2}
              maxLength={500}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
            <div className="mt-4 flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setCounterOpen(false)}>
                Cancelar
              </Button>
              <Button variant="primary" className="flex-1" loading={loading === "counter"} onClick={submitCounter}>
                Enviar contraoferta
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
