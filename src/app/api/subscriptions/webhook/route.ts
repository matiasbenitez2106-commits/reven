import { NextResponse } from "next/server";
import { SubscriptionPlan } from "@prisma/client";
import { fetchMpPreapproval } from "@/lib/mercadopago";
import { activateSubscription } from "@/lib/subscriptions";

// Webhook de MercadoPago para suscripciones (preapproval).
export async function POST(req: Request) {
  const url = new URL(req.url);
  const topic = url.searchParams.get("type") || url.searchParams.get("topic");
  let id = url.searchParams.get("data.id") || url.searchParams.get("id");

  let body: { type?: string; data?: { id?: string | number } } | null = null;
  try {
    body = await req.json();
  } catch {
    /* puede venir vacío */
  }
  if (!id && body?.data?.id) id = String(body.data.id);
  const eventType = String(topic || body?.type || "");

  // Solo eventos de suscripción/preapproval
  if (eventType && !eventType.includes("preapproval") && !eventType.includes("subscription")) {
    return NextResponse.json({ ignored: true });
  }
  if (!id) return NextResponse.json({ ok: true });

  const info = await fetchMpPreapproval(id);
  if (!info || !info.externalReference) return NextResponse.json({ ok: true });

  if (info.status === "authorized") {
    const [userId, plan] = info.externalReference.split(":");
    if (userId && (plan === "PRO" || plan === "PRO_PLUS")) {
      await activateSubscription(userId, plan as SubscriptionPlan, id);
    }
  }
  return NextResponse.json({ ok: true });
}
