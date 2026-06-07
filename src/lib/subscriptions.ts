import { SubscriptionPlan } from "@prisma/client";
import { prisma } from "./prisma";
import { SUBSCRIPTION_PLANS, INCLUDED_BOOST_DAYS } from "./constants";
import { notify } from "./notifications";

export const SUBSCRIPTION_PERIOD_DAYS = 30;

/** Plan PRO vigente del usuario (o null si no tiene/venció). */
export function activePlan(
  proPlan: SubscriptionPlan | null | undefined,
  proUntil: Date | null | undefined
): SubscriptionPlan | null {
  if (proPlan && proUntil && new Date(proUntil) > new Date()) return proPlan;
  return null;
}

/** Activa (o renueva) la suscripción y desnormaliza el estado PRO en el usuario. */
export async function activateSubscription(
  userId: string,
  plan: SubscriptionPlan,
  mpPreapprovalId?: string
) {
  const cfg = SUBSCRIPTION_PLANS[plan];
  const now = new Date();
  const periodEnd = new Date(now.getTime() + SUBSCRIPTION_PERIOD_DAYS * 86400000);

  await prisma.$transaction([
    prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan,
        status: "ACTIVE",
        currentPeriodEnd: periodEnd,
        boostsIncluded: cfg.boosts,
        boostsUsed: 0,
        mpPreapprovalId: mpPreapprovalId ?? null,
      },
      update: {
        plan,
        status: "ACTIVE",
        currentPeriodEnd: periodEnd,
        boostsIncluded: cfg.boosts,
        boostsUsed: 0,
        ...(mpPreapprovalId ? { mpPreapprovalId } : {}),
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { proPlan: plan, proUntil: periodEnd },
    }),
  ]);

  await notify({
    userId,
    type: "SUBSCRIPTION",
    title: `Tu plan ${cfg.label} está activo 🎉`,
    body: `Beneficios PRO activos hasta el ${periodEnd.toLocaleDateString("es-AR")}.`,
    link: "/suscripcion",
  });
}

/**
 * Cancela la renovación. Mantiene el acceso PRO hasta fin del período vigente
 * (no se reembolsa ni se corta de inmediato).
 */
export async function cancelSubscription(userId: string) {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub) return;
  await prisma.subscription.update({
    where: { userId },
    data: { status: "CANCELLED" },
  });
  // proUntil queda como está: el ranking/badge sigue activo hasta que venza.
}

/** Usa un destacado incluido en la suscripción (sin pagar). */
export async function redeemIncludedBoost(
  userId: string,
  listingId: string
): Promise<{ ok: boolean; error?: string }> {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  const now = new Date();

  if (!sub || sub.status !== "ACTIVE" || sub.currentPeriodEnd <= now) {
    return { ok: false, error: "No tenés una suscripción activa." };
  }
  if (sub.boostsUsed >= sub.boostsIncluded) {
    return { ok: false, error: "Ya usaste todos los destacados incluidos de este mes." };
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { sellerId: true, status: true, featuredUntil: true },
  });
  if (!listing || listing.status === "DELETED") {
    return { ok: false, error: "Publicación no encontrada." };
  }
  if (listing.sellerId !== userId) {
    return { ok: false, error: "No autorizado." };
  }

  const base =
    listing.featuredUntil && listing.featuredUntil > now ? listing.featuredUntil : now;
  const featuredUntil = new Date(base.getTime() + INCLUDED_BOOST_DAYS * 86400000);

  await prisma.$transaction([
    prisma.listing.update({ where: { id: listingId }, data: { featuredUntil } }),
    prisma.subscription.update({
      where: { userId },
      data: { boostsUsed: { increment: 1 } },
    }),
  ]);
  return { ok: true };
}
