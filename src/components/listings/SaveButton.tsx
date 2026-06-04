"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function SaveButton({
  listingId,
  initialFavorited,
  variant = "full",
}: {
  listingId: string;
  initialFavorited: boolean;
  variant?: "full" | "icon";
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [fav, setFav] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!session?.user) {
      router.push(`/ingresar?callbackUrl=/articulos/${listingId}`);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      if (res.ok) {
        const j = await res.json();
        setFav(j.favorited);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  if (variant === "icon") {
    return (
      <button
        onClick={toggle}
        disabled={loading}
        aria-label={fav ? "Quitar de favoritos" : "Guardar"}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow hover:bg-white"
      >
        <Heart className={cn("h-4 w-4", fav ? "fill-red-500 text-red-500" : "text-gray-600")} />
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-medium transition disabled:opacity-50",
        fav
          ? "border-red-200 bg-red-50 text-red-600"
          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
      )}
    >
      <Heart className={cn("h-4 w-4", fav && "fill-current")} />
      {fav ? "Guardado" : "Guardar"}
    </button>
  );
}
