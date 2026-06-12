import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Sparkles, CheckCircle, XCircle, Clock, Info } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isMpConfigured } from "@/lib/mercadopago";
import { BoostPlans } from "@/components/listings/BoostPlans";
import { formatRelative } from "@/lib/utils";
import { activePlan } from "@/lib/subscriptions";
import { IncludedBoostButton } from "@/components/subscription/IncludedBoostButton";

export const metadata = { title: "Destacar publicación" };

export default async function BoostPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { status?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar");

  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    select: { id: true, title: true, sellerId: true, status: true, featuredUntil: true },
  });
  if (!listing || listing.status === "DELETED") notFound();
  if (listing.sellerId !== user.id) redirect(`/articulos/${listing.id}`);

  const now = new Date();
  const featuredActive = listing.featuredUntil && listing.featuredUntil > now;
  const status = searchParams?.status;

  const sub = await prisma.subscription.findUnique({ where: { userId: user.id } });
  const includedRemaining =
    sub && sub.status === "ACTIVE" && sub.currentPeriodEnd > now
      ? Math.max(0, sub.boostsIncluded - sub.boostsUsed)
      : 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href={`/articulos/${listing.id}`} className="text-sm text-gray-500 dark:text-stone-400 hover:text-brand-600 dark:hover:text-brand-300">
        ← Volver a la publicación
      </Link>
      <h1 className="mt-2 flex items-center gap-2 text-2xl font-bold">
        <Sparkles className="h-6 w-6 text-amber-500" /> Destacar publicación
      </h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-stone-400">“{listing.title}”</p>

      {status === "success" && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-950/40 p-3 text-sm text-green-700 dark:text-green-300">
          <CheckCircle className="h-4 w-4 shrink-0" /> ¡Pago aprobado! Tu publicación ya está destacada.
        </div>
      )}
      {status === "failure" && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-700 dark:text-red-300">
          <XCircle className="h-4 w-4 shrink-0" /> El pago no se completó. Probá de nuevo.
        </div>
      )}
      {status === "pending" && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/40 p-3 text-sm text-yellow-800 dark:text-yellow-300">
          <Clock className="h-4 w-4 shrink-0" /> Tu pago está pendiente de acreditación.
        </div>
      )}

      {featuredActive && (
        <div className="mt-4 rounded-lg bg-amber-50 dark:bg-amber-950/40 p-3 text-sm text-amber-900 dark:text-amber-200">
          <Sparkles className="mr-1 inline h-4 w-4" /> Ya está destacada. Vence{" "}
          {formatRelative(listing.featuredUntil!)}. Podés extenderla:
        </div>
      )}

      {includedRemaining > 0 && (
        <div className="mt-6">
          <IncludedBoostButton listingId={listing.id} remaining={includedRemaining} />
          <p className="mt-4 text-sm font-medium text-gray-500 dark:text-stone-400">O comprá un destacado:</p>
        </div>
      )}

      <div className="mt-6">
        <BoostPlans listingId={listing.id} />
      </div>

      {!isMpConfigured() && (
        <div className="mt-6 flex items-start gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 p-3 text-xs text-blue-800 dark:text-blue-300">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <strong>Modo demo:</strong> MercadoPago no está configurado, así que el pago se
            aprueba automáticamente para que puedas probar el flujo. Configurá{" "}
            <code>MP_ACCESS_TOKEN</code> para usar pagos reales.
          </span>
        </div>
      )}
    </div>
  );
}
