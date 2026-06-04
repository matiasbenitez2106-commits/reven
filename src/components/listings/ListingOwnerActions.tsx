"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2, CheckCircle, RotateCcw, Sparkles } from "lucide-react";
import { ListingStatus } from "@prisma/client";
import { Button } from "@/components/ui/Button";

export function ListingOwnerActions({
  listingId,
  status,
}: {
  listingId: string;
  status: ListingStatus;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function setStatus(s: "ACTIVE" | "SOLD") {
    setLoading(s);
    await fetch(`/api/listings/${listingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: s }),
    });
    setLoading(null);
    router.refresh();
  }

  async function remove() {
    if (!confirm("¿Eliminar esta publicación? No se puede deshacer.")) return;
    setLoading("del");
    await fetch(`/api/listings/${listingId}`, { method: "DELETE" });
    setLoading(null);
    router.push("/mis-publicaciones");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={`/articulos/${listingId}/editar`}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium hover:bg-gray-50"
      >
        <Pencil className="h-4 w-4" /> Editar
      </Link>
      {status !== "SOLD" && (
        <Link
          href={`/articulos/${listingId}/destacar`}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 text-sm font-medium text-amber-800 hover:bg-amber-100"
        >
          <Sparkles className="h-4 w-4" /> Destacar
        </Link>
      )}
      {status !== "SOLD" ? (
        <Button variant="secondary" loading={loading === "SOLD"} onClick={() => setStatus("SOLD")}>
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
  );
}
