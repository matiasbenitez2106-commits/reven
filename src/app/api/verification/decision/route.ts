import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// Revisión manual de verificaciones (solo ADMIN).
// Útil para aprobar/rechazar casos en estado PENDING o probar el flujo.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const userId: string | undefined = body?.userId;
  const decision: string | undefined = body?.decision;
  const reason: string | undefined = body?.reason;

  if (!userId || (decision !== "VERIFIED" && decision !== "REJECTED")) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.verification.update({
      where: { userId },
      data: {
        status: decision,
        rejectionReason: decision === "REJECTED" ? reason || "Rechazado por revisión manual." : null,
        reviewedAt: new Date(),
        reviewedBy: user.id,
      },
    }),
    prisma.user.update({ where: { id: userId }, data: { verification: decision } }),
  ]);

  return NextResponse.json({ ok: true });
}
