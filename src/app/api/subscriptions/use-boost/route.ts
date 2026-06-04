import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { redeemIncludedBoost } from "@/lib/subscriptions";

// Usa un destacado incluido en la suscripción (sin pago)
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const listingId: string | undefined = body?.listingId;
  if (!listingId) return NextResponse.json({ error: "Falta listingId" }, { status: 400 });

  const result = await redeemIncludedBoost(user.id, listingId);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
