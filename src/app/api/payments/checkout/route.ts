import { NextResponse } from "next/server";
import { PaymentType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/auth";
import { BOOST_PLANS } from "@/lib/constants";
import { createCheckout } from "@/lib/mercadopago";
import { appBaseUrl } from "@/lib/urls";

const VALID: PaymentType[] = ["BOOST_3", "FEATURED_7", "FEATURED_14"];

export async function POST(req: Request) {
  const user = await getCurrentDbUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const listingId: string | undefined = body?.listingId;
  const type = body?.type as PaymentType;

  if (!listingId || !VALID.includes(type)) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, sellerId: true, title: true, status: true },
  });
  if (!listing || listing.status === "DELETED") {
    return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 });
  }
  if (listing.sellerId !== user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const plan = BOOST_PLANS[type];
  const payment = await prisma.payment.create({
    data: { userId: user.id, listingId, type, amount: plan.price, status: "PENDING" },
  });

  const baseUrl = appBaseUrl(req);
  try {
    const checkout = await createCheckout({
      paymentId: payment.id,
      type,
      listingId,
      listingTitle: listing.title,
      payerEmail: user.email,
      baseUrl,
    });
    if (checkout.preferenceId) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { mpPreferenceId: checkout.preferenceId },
      });
    }
    return NextResponse.json({ redirectUrl: checkout.redirectUrl, mock: checkout.mock });
  } catch (e) {
    console.error("Checkout error:", e);
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "REJECTED" } });
    return NextResponse.json({ error: "No se pudo iniciar el pago." }, { status: 502 });
  }
}
