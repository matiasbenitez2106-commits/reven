import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isMpConfigured } from "@/lib/mercadopago";
import { approvePayment } from "@/lib/payments";

// Aprobación simulada (solo en modo mock, sin MercadoPago configurado).
// Simula el retorno exitoso del checkout para poder probar el flujo de destacados.
export async function GET(req: Request) {
  if (isMpConfigured()) {
    return NextResponse.json({ error: "No disponible con MercadoPago configurado." }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/ingresar", req.url));

  const paymentId = new URL(req.url).searchParams.get("paymentId");
  if (!paymentId) return NextResponse.json({ error: "Falta paymentId" }, { status: 400 });

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { id: true, userId: true, listingId: true },
  });
  if (!payment || payment.userId !== user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  await approvePayment(paymentId, `mock_${Date.now().toString(36)}`);
  return NextResponse.redirect(
    new URL(`/articulos/${payment.listingId}/destacar?status=success`, req.url)
  );
}
