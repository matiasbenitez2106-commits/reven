import { NextResponse } from "next/server";
import { SubscriptionPlan } from "@prisma/client";
import { getCurrentDbUser } from "@/lib/auth";
import { createSubscriptionCheckout } from "@/lib/mercadopago";
import { activePlan } from "@/lib/subscriptions";
import { prisma } from "@/lib/prisma";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";
import { appBaseUrl } from "@/lib/urls";

const VALID: SubscriptionPlan[] = ["PRO", "PRO_PLUS"];

export async function POST(req: Request) {
  const user = await getCurrentDbUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const plan = body?.plan as SubscriptionPlan;
  if (!VALID.includes(plan)) {
    return NextResponse.json({ error: "Plan inválido" }, { status: 400 });
  }

  // Si ya tiene un plan ACTIVO, NO cobramos de nuevo: el cambio de plan se
  // programa para la próxima renovación (no se pierde lo ya pagado este período).
  const current = activePlan(user.proPlan, user.proUntil);
  if (current) {
    const sub = await prisma.subscription.findUnique({ where: { userId: user.id } });
    const until = user.proUntil
      ? new Date(user.proUntil).toLocaleDateString("es-AR")
      : "el fin del período";

    if (plan === current && !sub?.pendingPlan) {
      return NextResponse.json({
        alreadyActive: true,
        message: `Ya tenés el plan ${SUBSCRIPTION_PLANS[current].label} activo hasta el ${until}.`,
      });
    }

    const newPending = plan === current ? null : plan;
    await prisma.subscription.update({
      where: { userId: user.id },
      data: { pendingPlan: newPending },
    });
    return NextResponse.json({
      scheduled: true,
      message: newPending
        ? `Tu cambio a ${SUBSCRIPTION_PLANS[plan].label} se aplicará el ${until}, cuando se renueve tu plan actual. No se te cobra ahora y seguís con todos tus beneficios hasta esa fecha.`
        : `Listo: seguís con tu plan ${SUBSCRIPTION_PLANS[current].label}. Cancelamos el cambio que tenías programado.`,
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
