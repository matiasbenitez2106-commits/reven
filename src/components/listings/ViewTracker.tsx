"use client";

import { useEffect } from "react";

// Cuenta una visita por sesión (evita inflar con recargas).
export function ViewTracker({ listingId }: { listingId: string }) {
  useEffect(() => {
    const key = `reven_viewed_${listingId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* sessionStorage no disponible */
    }
    fetch(`/api/listings/${listingId}/view`, { method: "POST" }).catch(() => {});
  }, [listingId]);

  return null;
}
