"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function ContactSellerButton({
  listingId,
  sellerId,
}: {
  listingId: string;
  sellerId: string;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [needsVerify, setNeedsVerify] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const user = session?.user;

  async function contact() {
    if (!user) {
      router.push(`/ingresar?callbackUrl=/articulos/${listingId}`);
      return;
    }
    setLoading(true);
    setError(null);
    setNeedsVerify(false);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      if (res.status === 403) {
        setNeedsVerify(true);
        return;
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "No se pudo iniciar la conversación.");
      }
      const conv = await res.json();
      router.push(`/mensajes/${conv.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  // El dueño no se contacta a sí mismo
  if (user && user.id === sellerId) return null;

  return (
    <div>
      <Button onClick={contact} loading={loading} className="w-full">
        <MessageCircle className="h-4 w-4" /> Contactar al vendedor
      </Button>
      {needsVerify && (
        <p className="mt-2 text-xs text-red-600">
          Verificá tu identidad para contactar vendedores.{" "}
          <Link href="/verificacion" className="font-medium underline">
            Verificar ahora
          </Link>
        </p>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
