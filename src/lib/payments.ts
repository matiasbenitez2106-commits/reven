import { prisma } from "./prisma";
import { BOOST_PLANS } from "./constants";

/**
 * Aprueba un pago y extiende el destacado de la publicación.
 * Idempotente: si ya está aprobado, no duplica el período.
 * El destacado se acumula (si ya estaba vigente, suma los días desde el vencimiento).
 */
export async function approvePayment(paymentId: string, mpPaymentId?: string): Promise<boolean> {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) return false;
  if (payment.status === "APPROVED") return true;

  const plan = BOOST_PLANS[payment.type];
  const now = new Date();
  const listing = await prisma.listing.findUnique({
    where: { id: payment.listingId },
    select: { featuredUntil: true },
  });

  const base =
    listing?.featuredUntil && listing.featuredUntil > now ? listing.featuredUntil : now;
  const featuredUntil = new Date(base.getTime() + plan.days * 24 * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: paymentId },
      data: { status: "APPROVED", mpPaymentId: mpPaymentId ?? payment.mpPaymentId },
    }),
    prisma.listing.update({
      where: { id: payment.listingId },
      data: { featuredUntil },
    }),
  ]);
  return true;
}
