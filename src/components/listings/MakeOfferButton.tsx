"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Tag, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

// Botón "Hacer una oferta" (comprador) + modal con monto y mensaje opcional.
export function MakeOfferButton({ listingId }: { listingId: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openModal() {
    if (!session?.user) {
      router.push(`/ingresar?callbackUrl=/articulos/${listingId}`);
      return;
    }
    setError(null);
    setOpen(true);
  }

  async function submit() {
    const n = Number(amount);
    if (!Number.isInteger(n) || n <= 0) {
      setError("Ingresá un monto válido.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, amount: n, message }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || "No se pudo enviar la oferta.");
      }
      setOpen(false);
      setAmount("");
      setMessage("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="secondary" className="w-full" onClick={openModal}>
        <Tag className="h-4 w-4" /> Hacer una oferta
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-surface dark:bg-stone-900 p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-semibold">
                <Tag className="h-4 w-4 text-brand-600 dark:text-brand-300" /> Hacer una oferta
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 dark:text-stone-500 hover:text-gray-600 dark:hover:text-stone-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-700 dark:text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}

            <label className="label">Tu oferta (ARS)</label>
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
              rows={3}
              maxLength={500}
              placeholder="Contale algo al vendedor..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <p className="mt-2 text-xs text-gray-400 dark:text-stone-500">
              La oferta vence en 48 hs si no hay respuesta.
            </p>

            <div className="mt-4 flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button variant="primary" className="flex-1" loading={loading} onClick={submit}>
                Enviar oferta
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
