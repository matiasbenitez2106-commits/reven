"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

// Refresca el JWT de la sesión al montar (re-lee datos del usuario desde la base).
// Útil después de verificar el email, para que el estado se actualice sin re-login.
export function SessionRefresh() {
  const { update } = useSession();
  useEffect(() => {
    void update();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
