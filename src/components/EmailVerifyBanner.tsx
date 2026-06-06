"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { MailWarning, X } from "lucide-react";

export function EmailVerifyBanner() {
  const { data: session } = useSession();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hidden, setHidden] = useState(false);

  const user = session?.user;
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
