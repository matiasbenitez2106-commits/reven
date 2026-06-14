import { prisma } from "./prisma";
import { BOOST_PLANS } from "./constants";

/**
 * Aprueba un pago y extiende el destacado de la publicación.
 * Idempotente: si ya está aprobado, no duplica el período.
 * El destacado se acumula (si ya estaba vigente, suma los días desde el vencimiento).
 */
export async function approvePayment(
  paymentId: string,
  mpPaymentId?: string,
  paidAmount?: number | null
): Promise<boolean> {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) return false;
  if (payment.status === "APPROVED") return true;

  // Anti-fraude: el monto realmente pagado (según la API de MP) debe cubrir el
  // precio del destacado fijado por el servidor. Si pagaron de menos, no aprobamos.
  if (paidAmount != null && paidAmount < payment.amount) {
    await prisma.payment
      .update({ where: { id: paymentId }, data: { status: "REJECTED", mpPaymentId } })
      .catch(() => {});
    console.error(
      `Pago ${paymentId}: monto insuficiente (pagó ${paidAmount}, requiere ${payment.amount}).`
    );
    return false;
  }

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
