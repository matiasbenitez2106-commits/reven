import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { cancelSubscription } from "@/lib/subscriptions";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  await cancelSubscription(user.id);
  return NextResponse.json({ ok: true });
}
