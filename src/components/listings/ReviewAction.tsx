"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Stars } from "@/components/ui/Stars";
import { cn } from "@/lib/utils";

// Reseña que el usuario ya dejó (si existe).
export interface MyReview {
  rating: number;
  comment: string | null;
}

// Acción genérica de calificación tras una venta. `ctaLabel` adapta el sentido
// (comprador→vendedor o vendedor→comprador). El target lo decide el SERVIDOR.
export function ReviewAction({
  listingId,
  initialReview,
  ctaLabel,
}: {
  listingId: string;
  initialReview: MyReview | null;
  ctaLabel: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Si ya calificó, mostramos su calificación en lugar del botón.
  if (initialReview) {
    return (
      <div className="rounded-lg border border-line dark:border-stone-700 bg-surface dark:bg-stone-900 p-3">
        <p className="mb-1 text-xs font-medium text-gray-500 dark:text-stone-400">Tu calificación</p>
        <Stars value={initialReview.rating} size={18} />
        {initialReview.comment && (
          <p className="mt-1.5 text-sm text-gray-600 dark:text-stone-300">{initialReview.comment}</p>
        )}
      </div>
    );
  }

  async function submit() {
    if (rating < 1) {
      setError("Elegí una calificación de 1 a 5 estrellas.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, rating, comment }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || "No se pudo enviar la calificación.");
      }
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="primary" className="w-full" onClick={() => setOpen(true)}>
        <Star className="h-4 w-4" /> {ctaLabel}
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
                <Star className="h-4 w-4 text-amber-400" /> {ctaLabel}
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

            {/* Selector de estrellas */}
            <div className="mb-4 flex items-center justify-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(n)}
                  className="p-1"
                  aria-label={`${n} ${n === 1 ? "estrella" : "estrellas"}`}
                >
                  <Star
                    className={cn(
                      "h-8 w-8 transition",
                      (hover || rating) >= n
                        ? "fill-amber-400 text-amber-400"
                        : "fill-none text-gray-300 dark:text-stone-600"
                    )}
                  />
                </button>
              ))}
            </div>

            <textarea
              className="input"
              rows={3}
              maxLength={1000}
              placeholder="Comentario (opcional): ¿cómo te fue?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />

            <div className="mt-4 flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button variant="primary" className="flex-1" loading={loading} onClick={submit}>
                Enviar calificación
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
