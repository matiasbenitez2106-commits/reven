"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { AlertCircle, Heart, Info } from "lucide-react";
import { Button } from "@/components/ui/Button";

// Fecha en formato argentino, cálida: "18 de junio de 2026".
function fmtFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function BajaScreen({ deletionScheduledFor }: { deletionScheduledFor: string }) {
  const router = useRouter();
  const { update } = useSession();
  const [loading, setLoading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null); // aviso del endpoint (bloqueada / vencida)
  const [error, setError] = useState<string | null>(null); // problema inesperado (conexión)

  async function onReactivar() {
    setLoading(true);
    setAviso(null);
    setError(null);
    try {
      const res = await fetch("/api/me/reactivate", { method: "POST" });
      const j = await res.json().catch(() => ({}));
      if (res.ok && j.ok) {
        // Refrescamos la sesión para que el portero deje de desviarnos, y volvemos.
        await update();
        router.push("/cuenta");
        router.refresh();
        return;
      }
      // El endpoint devolvió un aviso claro (bloqueada por denuncia, plazo vencido…).
      setAviso(j.message || "No pudimos reactivar tu cuenta. Escribinos a soporte.");
      setLoading(false);
    } catch {
      setError("Hubo un problema de conexión. Probá de nuevo en un momento.");
      setLoading(false);
    }
  }

  async function onSalir() {
    setSigningOut(true);
    await signOut({ callbackUrl: "/" });
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="card p-6 text-center sm:p-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-900/40">
          <Heart className="h-6 w-6 text-brand-600 dark:text-brand-300" />
        </div>

        <h1 className="mt-4 text-xl font-bold text-gray-900 dark:text-stone-100">
          Tu cuenta está en proceso de baja
        </h1>

        <p className="mt-3 text-sm text-gray-600 dark:text-stone-300">
          Pediste dar de baja tu cuenta, así que la pusimos <strong>en pausa</strong>. Por ahora no
          aparecés en trato y tus publicaciones están ocultas, pero <strong>no perdiste nada</strong>:
          si te arrepentís, volvés con un clic y queda todo como estaba.
        </p>

        <div className="mt-4 rounded-lg bg-surface-sunken dark:bg-stone-800/60 p-3 text-sm text-gray-700 dark:text-stone-200">
          Si no hacés nada, vamos a borrar tu cuenta y todos tus datos el{" "}
          <strong>{fmtFecha(deletionScheduledFor)}</strong>. Eso no se puede deshacer.
        </div>

        {aviso && (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-left text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            <Info className="mt-0.5 h-4 w-4 shrink-0" /> {aviso}
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-left text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <Button onClick={onReactivar} loading={loading} disabled={signingOut} size="lg">
            Reactivar mi cuenta
          </Button>
          <Button variant="ghost" onClick={onSalir} loading={signingOut} disabled={loading}>
            Cerrar sesión
          </Button>
        </div>
      </div>
    </div>
  );
}
