import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchMpPayment } from "@/lib/mercadopago";
import { approvePayment } from "@/lib/payments";

// Webhook de MercadoPago. Notifica cambios de estado de un pago.
// Confirmamos el estado consultando la API antes de aplicar nada.
export async function POST(req: Request) {
  const url = new URL(req.url);
  let mpPaymentId = url.searchParams.get("data.id") || url.searchParams.get("id");
  const topic = url.searchParams.get("type") || url.searchParams.get("topic");

  let body: { type?: string; data?: { id?: string | number } } | null = null;
  try {
    body = await req.json();
  } catch {
    /* puede venir vacío */
  }
  if (!mpPaymentId && body?.data?.id) mpPaymentId = String(body.data.id);
  const eventType = topic || body?.type;

  if (eventType && eventType !== "payment") {
    return NextResponse.json({ ignored: true });
  }
  if (!mpPaymentId) return NextResponse.json({ ok: true });

  const info = await fetchMpPayment(mpPaymentId);
  if (!info || !info.externalReference) return NextResponse.json({ ok: true });

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

  return NextResponse.json({ ok: true });
}
