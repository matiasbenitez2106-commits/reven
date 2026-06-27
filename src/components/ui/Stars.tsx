import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

// Estrellas de solo lectura para mostrar una calificación (1..5).
export function Stars({
  value,
  size = 16,
  className,
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      aria-label={`${value} de 5 estrellas`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          style={{ width: size, height: size }}
          className={cn(
            n <= value
              ? "fill-amber-400 text-amber-400"
              : "fill-none text-gray-300 dark:text-stone-600"
          )}
        />
      ))}
    </span>
  );
}
