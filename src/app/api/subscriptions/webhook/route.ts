import { NextResponse } from "next/server";
import { verifyMpWebhook } from "@/lib/mercadopago";
import {
  handleSubscriptionNotification,
  extractMpId,
  extractMpEventType,
} from "@/lib/mp-webhooks";

// Webhook de MercadoPago para SUSCRIPCIONES (preapproval). Se mantiene por
// compatibilidad; el endpoint recomendado a configurar es /api/mercadopago/webhook.
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

  const eventType = extractMpEventType(url, body);
  if (eventType && !eventType.includes("preapproval") && !eventType.includes("subscription")) {
    return NextResponse.json({ ignored: true });
  }

  const id = extractMpId(url, body);
  if (!id) return NextResponse.json({ ok: true });

  await handleSubscriptionNotification(id);
  return NextResponse.json({ ok: true });
}
