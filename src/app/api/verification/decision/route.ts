import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { notify } from "@/lib/notifications";

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

  // Al APROBAR, re-validamos la unicidad por DNI: no puede haber dos cuentas
  // VERIFICADAS con el mismo documento (1 cuenta por persona física).
  if (decision === "VERIFIED") {
    const target = await prisma.verification.findUnique({
      where: { userId },
      select: { dniHash: true },
    });
    if (target?.dniHash) {
      const dup = await prisma.verification.findFirst({
        where: { dniHash: target.dniHash, userId: { not: userId }, status: "VERIFIED" },
        select: { id: true },
      });
      if (dup) {
        return NextResponse.json(
          { error: "Ese DNI ya está verificado en otra cuenta. No se puede aprobar un duplicado." },
          { status: 409 }
        );
      }
    }
  }

  // Nota: las imágenes de identidad se CONSERVAN (no se purgan al decidir) para poder
  // responder a requerimientos de la justicia/policía ante un eventual delito.
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

  await notify({
    userId,
    type: "VERIFICATION",
    title: decision === "VERIFIED" ? "¡Tu identidad fue verificada! ✅" : "Tu verificación fue rechazada",
    body: decision === "VERIFIED" ? "Ya podés publicar y contactar vendedores." : reason || "Podés reintentar con fotos más nítidas.",
    link: decision === "VERIFIED" ? "/cuenta" : "/verificacion",
  });

  return NextResponse.json({ ok: true });
}
