import { redirect } from "next/navigation";
import { CheckCircle, Info, Crown, Clock, AlertCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/auth";
import { activePlan } from "@/lib/subscriptions";
import { isMpConfigured } from "@/lib/mercadopago";
import { PlanCards } from "@/components/subscription/PlanCards";
import { CancelButton } from "@/components/subscription/CancelButton";
import { ProBadge } from "@/components/ProBadge";
import { formatDate, formatRelative } from "@/lib/utils";

export const metadata = { title: "Suscripción de vendedor" };

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const user = await getCurrentDbUser();
  if (!user) redirect("/ingresar");

  const sub = await prisma.subscription.findUnique({ where: { userId: user.id } });
  const plan = activePlan(user.proPlan, user.proUntil);
  const status = searchParams?.status;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <Crown className="h-6 w-6 text-indigo-600 dark:text-indigo-400" /> Suscripción de vendedor
      </h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-stone-400">
        Más visibilidad y destacados incluidos para vender más rápido.
      </p>

      {status === "success" && plan && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-950/40 p-3 text-sm text-green-700 dark:text-green-300">
          <CheckCircle className="h-4 w-4 shrink-0" /> ¡Suscripción activada! Ya tenés tus beneficios PRO.
        </div>
      )}
      {status === "pending" && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 p-3 text-sm text-amber-800 dark:text-amber-300">
          <Clock className="h-4 w-4 shrink-0" /> Estamos confirmando tu pago. Apenas se acredite vas a
          tener los beneficios PRO (puede tardar unos minutos).
        </div>
      )}
      {status === "failure" && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" /> No se pudo completar el pago. Probá de nuevo o
          usá otro medio de pago.
        </div>
      )}

      {/* Suscripción pendiente de confirmación del pago */}
      {sub && sub.status === "PENDING" && !plan && (
        <div className="card mt-6 flex items-start gap-2 p-5">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="font-medium">Suscripción pendiente</p>
            <p className="text-sm text-gray-600 dark:text-stone-300">
              Estamos esperando la confirmación del pago de MercadoPago. Apenas se acredite, se
              activan tus beneficios PRO automáticamente.
            </p>
          </div>
        </div>
      )}

      {plan && sub && (
        <div className="card mt-6 p-5">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-stone-400">Tu plan:</span>
            <ProBadge plan={plan} />
            {sub.status === "CANCELLED" && (
              <span className="rounded-full bg-yellow-100 dark:bg-yellow-900/40 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:text-yellow-300">
                Cancelada
              </span>
            )}
          </div>
          <dl className="mt-3 space-y-1 text-sm text-gray-600 dark:text-stone-300">
            <div>
              {sub.status === "CANCELLED" ? "Activa hasta el " : "Se renueva el "}
              <strong>{formatDate(sub.currentPeriodEnd)}</strong>{" "}
              <span className="text-gray-400 dark:text-stone-500">({formatRelative(sub.currentPeriodEnd)})</span>.
            </div>
            {sub.status === "CANCELLED" && (
              <div className="text-gray-500 dark:text-stone-400">
                Cancelaste la renovación: no se harán más cobros y luego de esa fecha volvés al plan
                gratuito.
              </div>
            )}
            <div>
              Destacados incluidos: <strong>{sub.boostsUsed}</strong> de{" "}
              <strong>{sub.boostsIncluded}</strong> usados este mes.
            </div>
          </dl>
          {sub.status !== "CANCELLED" && (
            <div className="mt-4">
              <CancelButton />
            </div>
          )}
        </div>
      )}

      <div className="mt-6">
        <PlanCards currentPlan={plan} />
      </div>

      {!isMpConfigured() && (
        <div className="mt-6 flex items-start gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 p-3 text-xs text-blue-800 dark:text-blue-300">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <strong>Modo demo:</strong> MercadoPago no está configurado, así que la suscripción se
            activa automáticamente para que pruebes el flujo. Con <code>MP_ACCESS_TOKEN</code> se usa
            cobro recurrente real.
          </span>
        </div>
      )}
    </div>
  );
}
