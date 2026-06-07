import { NextResponse } from "next/server";
import { verifyMpWebhook } from "@/lib/mercadopago";
import {
  handlePaymentNotification,
  handleSubscriptionNotification,
  extractMpId,
  extractMpEventType,
} from "@/lib/mp-webhooks";

// Webhook ÚNICO de MercadoPago. MercadoPago admite una sola URL de notificaciones
// por aplicación, con varios eventos seleccionados (Pagos + Suscripciones).
// Acá validamos la firma y enrutamos según el tipo de evento.
//
// Configurá en MercadoPago esta URL para los eventos "Pagos" y "Suscripciones":
//   https://TU-DOMINIO/api/mercadopago/webhook
export async function POST(req: Request) {
  if (!verifyMpWebhook(req)) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  const url = new URL(req.url);
  let body: { type?: string; topic?: string; data?: { id?: string | number } } | null = null;
  try {
    body = await req.json();
  } catch {
    /* puede venir vacío */
  }

  const id = extractMpId(url, body);
  const eventType = extractMpEventType(url, body);
  if (!id) return NextResponse.json({ ok: true });

  const isSubscription =
    eventType.includes("preapproval") || eventType.includes("subscription");
  const isPayment = eventType.includes("payment") || eventType === "";

  if (isSubscription) {
    await handleSubscriptionNotification(id);
  } else if (isPayment) {
    await handlePaymentNotification(id);
  } else {
    return NextResponse.json({ ignored: true });
  }

  return NextResponse.json({ ok: true });
}
