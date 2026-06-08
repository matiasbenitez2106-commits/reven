"use client";

import { useEffect } from "react";

// Registra el service worker para habilitar la instalación como PWA.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* sin SW la app sigue funcionando, solo no se ofrece "Instalar" */
      });
    }
  }, []);
  return null;
}
