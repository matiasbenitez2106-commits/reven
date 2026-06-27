"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2, CheckCircle, RotateCcw, Sparkles, X, Store } from "lucide-react";
import { ListingStatus } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

// Comprador candidato: alguien que escribió por esta publicación (de las conversaciones).
export interface OwnerBuyer {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

export function ListingOwnerActions({
  listingId,
  status,
  buyers = [],
}: {
  listingId: string;
  status: ListingStatus;
  buyers?: OwnerBuyer[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [sellOpen, setSellOpen] = useState(false);
  // null = "lo vendí por fuera de Trato"; string = id del comprador elegido
  const [selected, setSelected] = useState<string | null>(null);

  async function setStatus(s: "ACTIVE" | "SOLD", soldToId: string | null = null) {
    setLoading(s);
    try {
      const res = await fetch(`/api/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(s === "SOLD" ? { status: s, soldToId } : { status: s }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        alert(j?.error || "No se pudo completar la acción");
        return;
      }
      setSellOpen(false);
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function remove() {
    if (!confirm("¿Eliminar esta publicación? No se puede deshacer.")) return;
    setLoading("del");
    await fetch(`/api/listings/${listingId}`, { method: "DELETE" });
    setLoading(null);
    router.push("/mis-publicaciones");
    router.refresh();
  }

  const optionCls = (active: boolean) =>
    cn(
      "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition",
      active
        ? "border-brand-600 bg-brand-50 dark:border-brand-400 dark:bg-brand-900/30"
        : "border-line dark:border-stone-700 hover:bg-surface-hover dark:hover:bg-stone-800"
    );

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/articulos/${listingId}/editar`}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-line dark:border-stone-700 bg-surface dark:bg-stone-900 px-4 text-sm font-medium hover:bg-surface-hover dark:hover:bg-stone-800"
        >
          <Pencil className="h-4 w-4" /> Editar
        </Link>
        {status !== "SOLD" && (
          <Link
            href={`/articulos/${listingId}/destacar`}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-4 text-sm font-medium text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40"
          >
            <Sparkles className="h-4 w-4" /> Destacar
          </Link>
        )}
        {status !== "SOLD" ? (
          <Button
            variant="secondary"
            onClick={() => {
              setSelected(null);
              setSellOpen(true);
            }}
          >
            <CheckCircle className="h-4 w-4" /> Marcar vendido
          </Button>
        ) : (
          <Button variant="secondary" loading={loading === "ACTIVE"} onClick={() => setStatus("ACTIVE")}>
            <RotateCcw className="h-4 w-4" /> Reactivar
          </Button>
        )}
        <Button variant="danger" loading={loading === "del"} onClick={remove}>
          <Trash2 className="h-4 w-4" /> Eliminar
        </Button>
      </div>

      {/* Al marcar vendido: elegir a quién (comprador que escribió) o "por fuera". */}
      {sellOpen && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSellOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-surface dark:bg-stone-900 p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-semibold">
                <CheckCircle className="h-4 w-4 text-brand-600 dark:text-brand-300" /> Marcar como vendido
              </h3>
              <button
                onClick={() => setSellOpen(false)}
                className="text-gray-400 dark:text-stone-500 hover:text-gray-600 dark:hover:text-stone-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-3 text-sm text-gray-500 dark:text-stone-400">
              {buyers.length > 0
                ? "¿A quién se la vendiste? Elegí al comprador que te escribió."
                : "Todavía nadie te escribió por esta publicación."}
            </p>

            <div className="max-h-72 space-y-1.5 overflow-y-auto">
              {buyers.map((b) => (
                <button key={b.id} onClick={() => setSelected(b.id)} className={optionCls(selected === b.id)}>
                  <Avatar firstName={b.firstName} lastName={b.lastName} src={b.avatarUrl} size={32} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {b.firstName} {b.lastName}
                  </span>
                  {selected === b.id && (
                    <CheckCircle className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-300" />
                  )}
                </button>
              ))}

              <button onClick={() => setSelected(null)} className={optionCls(selected === null)}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-sunken dark:bg-stone-800">
                  <Store className="h-4 w-4 text-gray-500 dark:text-stone-400" />
                </span>
                <span className="min-w-0 flex-1 text-sm font-medium">Lo vendí por fuera de Trato</span>
                {selected === null && (
                  <CheckCircle className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-300" />
                )}
              </button>
            </div>

            <div className="mt-5 flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setSellOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                loading={loading === "SOLD"}
                onClick={() => setStatus("SOLD", selected)}
              >
                Confirmar venta
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
