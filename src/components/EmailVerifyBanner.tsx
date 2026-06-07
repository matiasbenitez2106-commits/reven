"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { MailWarning, X } from "lucide-react";

export function EmailVerifyBanner() {
  const { data: session, update } = useSession();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hidden, setHidden] = useState(false);
  const refreshed = useRef(false);

  const user = session?.user;

  // Si la sesión dice que el email NO está verificado, re-consultamos la base UNA vez:
  // si el usuario ya lo verificó (token desactualizado), la sesión se refresca y el
  // cartel desaparece solo, sin tener que cerrar y volver a iniciar sesión.
  useEffect(() => {
    if (user && !user.emailVerified && !refreshed.current) {
      refreshed.current = true;
      void update();
    }
  }, [user, update]);

  if (!user || user.emailVerified || hidden) return null;

  async function resend() {
    setLoading(true);
    try {
      await fetch("/api/auth/resend-verification", { method: "POST" });
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border-b border-yellow-200 bg-yellow-50 text-sm text-yellow-800">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2">
        <MailWarning className="h-4 w-4 shrink-0" />
        <span className="flex-1">
          {sent
            ? "Te reenviamos el email de verificación. Revisá tu casilla (y spam)."
            : "Verificá tu email para asegurar tu cuenta."}
        </span>
        {!sent && (
          <button
            onClick={resend}
            disabled={loading}
            className="font-medium underline disabled:opacity-50"
          >
            {loading ? "Enviando..." : "Reenviar"}
          </button>
        )}
        <button onClick={() => setHidden(true)} aria-label="Cerrar" className="p-1">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
