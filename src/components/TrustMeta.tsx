import { cn } from "@/lib/utils";

/**
 * Línea sutil de confianza: "Miembro desde [mes año] · N ventas". Reutilizada por
 * el perfil y la tarjeta del vendedor del detalle, para no duplicar el texto ni el
 * formato. Si la persona no tiene ventas, NO estampa "0 ventas": muestra solo
 * "Miembro desde [mes año]".
 */
export function TrustMeta({
  createdAt,
  salesCount,
  className,
}: {
  createdAt: Date | string;
  salesCount: number;
  className?: string;
}) {
  const memberSince = new Date(createdAt).toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });
  return (
    <p className={cn("text-xs text-gray-400 dark:text-stone-500", className)}>
      Miembro desde {memberSince}
      {salesCount > 0 && (
        <>
          {" · "}
          {salesCount} {salesCount === 1 ? "venta" : "ventas"}
        </>
      )}
    </p>
  );
}
