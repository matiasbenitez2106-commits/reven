import { redirect } from "next/navigation";
import { CheckCircle, Info, Crown } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/auth";
import { activePlan } from "@/lib/subscriptions";
import { isMpConfigured } from "@/lib/mercadopago";
import { PlanCards } from "@/components/subscription/PlanCards";
import { CancelButton } from "@/components/subscription/CancelButton";
import { ProBadge } from "@/components/ProBadge";
import { formatRelative } from "@/lib/utils";

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
        <Crown className="h-6 w-6 text-indigo-600" /> Suscripción de vendedor
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Más visibilidad y destacados incluidos para vender más rápido.
      </p>

      {status === "success" && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          <CheckCircle className="h-4 w-4 shrink-0" /> ¡Suscripción activada! Ya tenés tus beneficios PRO.
        </div>
      )}

      {plan && sub && (
        <div className="card mt-6 p-5">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Tu plan:</span>
            <ProBadge plan={plan} />
            {sub.status === "CANCELLED" && (
              <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                Cancelada
              </span>
            )}
          </div>
          <dl className="mt-3 space-y-1 text-sm text-gray-600">
            <div>
              {sub.status === "CANCELLED" ? "Activa hasta" : "Se renueva"}{" "}
              {formatRelative(sub.currentPeriodEnd)}.
            </div>
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
        <div className="mt-6 flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-xs text-blue-800">
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
