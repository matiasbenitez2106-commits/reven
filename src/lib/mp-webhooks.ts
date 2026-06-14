import { SubscriptionPlan } from "@prisma/client";
import { prisma } from "./prisma";
import { fetchMpPayment, fetchMpPreapproval } from "./mercadopago";
import { approvePayment } from "./payments";
import { activateSubscription } from "./subscriptions";
import { SUBSCRIPTION_PLANS } from "./constants";

// Lógica compartida de los webhooks de MercadoPago.
// Siempre confirmamos el estado consultando la API de MP antes de aplicar nada
// (no confiamos en el cuerpo de la notificación).

/** Procesa una notificación de PAGO (destacados / Checkout Pro). */
export async function handlePaymentNotification(mpPaymentId: string): Promise<void> {
  const info = await fetchMpPayment(mpPaymentId);
  if (!info || !info.externalReference) return;

  if (info.status === "approved") {
    // Pasamos el monto realmente pagado para validarlo contra el precio del destacado.
    await approvePayment(info.externalReference, mpPaymentId, info.amount);
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
      // Anti-fraude: el importe recurrente autorizado debe cubrir el precio del plan.
      const expected = SUBSCRIPTION_PLANS[plan as SubscriptionPlan].price;
      if (info.amount != null && info.amount < expected) {
        console.error(
          `Preapproval ${preapprovalId}: monto ${info.amount} < precio del plan ${plan} (${expected}). No se activa.`
        );
        return;
      }
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
