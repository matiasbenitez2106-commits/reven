import { NextResponse } from "next/server";
import { SubscriptionPlan } from "@prisma/client";
import { getCurrentDbUser } from "@/lib/auth";
import { createSubscriptionCheckout } from "@/lib/mercadopago";

const VALID: SubscriptionPlan[] = ["PRO", "PRO_PLUS"];

export async function POST(req: Request) {
  const user = await getCurrentDbUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const plan = body?.plan as SubscriptionPlan;
  if (!VALID.includes(plan)) {
    return NextResponse.json({ error: "Plan inválido" }, { status: 400 });
  }

  const baseUrl = new URL(req.url).origin || process.env.NEXTAUTH_URL || "";
  try {
    const checkout = await createSubscriptionCheckout({
      plan,
      payerEmail: user.email,
      baseUrl,
      externalReference: `${user.id}:${plan}`,
    });
    return NextResponse.json({ redirectUrl: checkout.redirectUrl, mock: checkout.mock });
  } catch (e) {
    console.error("Subscription checkout error:", e);
    return NextResponse.json({ error: "No se pudo iniciar la suscripción." }, { status: 502 });
  }
}
