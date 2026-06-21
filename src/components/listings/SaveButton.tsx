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
        className="flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 dark:bg-stone-900/90 shadow hover:bg-white"
      >
        <Heart className={cn("h-4 w-4", fav ? "fill-red-500 text-red-500" : "text-gray-600 dark:text-stone-300")} />
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
          ? "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400"
          : "border-line dark:border-stone-700 bg-surface dark:bg-stone-900 text-gray-700 dark:text-stone-200 hover:bg-gray-50 dark:hover:bg-stone-800"
      )}
    >
      <Heart className={cn("h-4 w-4", fav && "fill-current")} />
      {fav ? "Guardado" : "Guardar"}
    </button>
  );
}
