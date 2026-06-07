import { SubscriptionPlan } from "@prisma/client";
import { prisma } from "./prisma";
import { fetchMpPayment, fetchMpPreapproval } from "./mercadopago";
import { approvePayment } from "./payments";
import { activateSubscription } from "./subscriptions";

// Lógica compartida de los webhooks de MercadoPago.
// Siempre confirmamos el estado consultando la API de MP antes de aplicar nada
// (no confiamos en el cuerpo de la notificación).

/** Procesa una notificación de PAGO (destacados / Checkout Pro). */
export async function handlePaymentNotification(mpPaymentId: string): Promise<void> {
  const info = await fetchMpPayment(mpPaymentId);
  if (!info || !info.externalReference) return;

  if (info.status === "approved") {
    await approvePayment(info.externalReference, mpPaymentId);
  } else if (info.status === "rejected" || info.status === "cancelled") {
    await prisma.payment
      .update({
        where: { id: info.externalReference },
        data: {
          status: info.status === "rejected" ? "REJECTED" : "CANCELLED",
          mpPaymentId,
        },
      })
      .catch(() => {});
  }
}

/** Procesa una notificación de SUSCRIPCIÓN (preapproval). */
export async function handleSubscriptionNotification(preapprovalId: string): Promise<void> {
  const info = await fetchMpPreapproval(preapprovalId);
  if (!info || !info.externalReference) return;

  if (info.status === "authorized") {
    const [userId, plan] = info.externalReference.split(":");
    if (userId && (plan === "PRO" || plan === "PRO_PLUS")) {
      await activateSubscription(userId, plan as SubscriptionPlan, preapprovalId);
    }
  }
}

/**
 * Extrae el id del recurso (data.id / id) de una notificación de MercadoPago,
 * mirando primero la query string y luego el cuerpo.
 */
export function extractMpId(url: URL, body: { data?: { id?: string | number } } | null): string | null {
  return (
    url.searchParams.get("data.id") ||
    url.searchParams.get("id") ||
    (body?.data?.id != null ? String(body.data.id) : null)
  );
}

/** Tipo de evento (type/topic) de una notificación de MercadoPago. */
export function extractMpEventType(
  url: URL,
  body: { type?: string; topic?: string } | null
): string {
  return String(
    url.searchParams.get("type") ||
      url.searchParams.get("topic") ||
      body?.type ||
      body?.topic ||
      ""
  );
}
