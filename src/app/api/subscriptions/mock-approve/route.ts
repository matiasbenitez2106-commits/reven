import { NextResponse } from "next/server";
import { SubscriptionPlan } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { isMpConfigured } from "@/lib/mercadopago";
import { activateSubscription } from "@/lib/subscriptions";

// Activación simulada (solo en modo demo, sin MercadoPago configurado).
export async function GET(req: Request) {
  if (isMpConfigured()) {
    return NextResponse.json({ error: "No disponible con MercadoPago configurado." }, { status: 403 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/ingresar", req.url));

  const plan = new URL(req.url).searchParams.get("plan") as SubscriptionPlan;
  if (plan !== "PRO" && plan !== "PRO_PLUS") {
    return NextResponse.json({ error: "Plan inválido" }, { status: 400 });
  }

  await activateSubscription(user.id, plan, "mock");
  return NextResponse.redirect(new URL("/suscripcion?status=success", req.url));
}
