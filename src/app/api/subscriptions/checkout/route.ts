import { NextResponse } from "next/server";
import { SubscriptionPlan } from "@prisma/client";
import { getCurrentDbUser } from "@/lib/auth";
import { createSubscriptionCheckout } from "@/lib/mercadopago";
import { activePlan } from "@/lib/subscriptions";
import { prisma } from "@/lib/prisma";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";
import { appBaseUrl } from "@/lib/urls";

const VALID: SubscriptionPlan[] = ["PRO", "PRO_PLUS"];
// Jerarquía de planes (para distinguir suba de baja).
const RANK: Record<SubscriptionPlan, number> = { PRO: 1, PRO_PLUS: 2 };

export async function POST(req: Request) {
  const user = await getCurrentDbUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const plan = body?.plan as SubscriptionPlan;
  if (!VALID.includes(plan)) {
    return NextResponse.json({ error: "Plan inválido" }, { status: 400 });
  }

  // Si ya tiene un plan ACTIVO:
  const current = activePlan(user.proPlan, user.proUntil);
  if (current) {
    const sub = await prisma.subscription.findUnique({ where: { userId: user.id } });
    const until = user.proUntil
      ? new Date(user.proUntil).toLocaleDateString("es-AR")
      : "el fin del período";

    // Mismo plan: nada que cobrar (o cancelar un cambio programado).
    if (plan === current) {
      if (!sub?.pendingPlan) {
        return NextResponse.json({
          alreadyActive: true,
          message: `Ya tenés el plan ${SUBSCRIPTION_PLANS[current].label} activo hasta el ${until}.`,
        });
      }
      await prisma.subscription.update({ where: { userId: user.id }, data: { pendingPlan: null } });
      return NextResponse.json({
        scheduled: true,
        message: `Listo: seguís con tu plan ${SUBSCRIPTION_PLANS[current].label}. Cancelamos el cambio que tenías programado.`,
      });
    }

    // BAJA de plan (p.ej. PRO+ → PRO): se programa para la próxima renovación SIN
    // cobro (no se pierde lo ya pagado; los beneficios siguen hasta esa fecha).
    if (RANK[plan] < RANK[current]) {
      await prisma.subscription.update({ where: { userId: user.id }, data: { pendingPlan: plan } });
      return NextResponse.json({
        scheduled: true,
        message: `Tu cambio a ${SUBSCRIPTION_PLANS[plan].label} se aplicará el ${until}, cuando se renueve tu plan. No se te cobra ahora y seguís con todos tus beneficios hasta esa fecha.`,
      });
    }

    // SUBA de plan (PRO → PRO+): requiere pago. Para no cobrar dos veces ni dejar
    // suscripciones cruzadas, pedimos cancelar la actual y suscribirse a la nueva.
    return NextResponse.json({
      upgrade: true,
      message: `Para pasar a ${SUBSCRIPTION_PLANS[plan].label}, cancelá tu plan actual desde acá: mantenés los beneficios hasta el ${until} y, al terminar, te suscribís a ${SUBSCRIPTION_PLANS[plan].label}.`,
    });
  }

  const baseUrl = appBaseUrl(req);
  try {
    const checkout = await createSubscriptionCheckout({
      plan,
      payerEmail: user.email,
      baseUrl,
      externalReference: `${user.id}:${plan}`,
    });
    return NextResponse.json({ redirectUrl: checkout.redirectUrl, mock: checkout.mock });
  } catch (e) {
    console.error("Subscription checkout error:", e);
    return NextResponse.json({ error: "No se pudo iniciar la suscripción." }, { status: 502 });
  }
}
