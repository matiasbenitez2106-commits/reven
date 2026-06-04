"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function CancelButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function cancel() {
    if (!confirm("¿Cancelar la renovación? Mantenés los beneficios hasta el fin del período.")) {
      return;
    }
    setLoading(true);
    await fetch("/api/subscriptions/cancel", { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  return (
    <Button variant="secondary" loading={loading} onClick={cancel}>
      Cancelar renovación
    </Button>
  );
}
