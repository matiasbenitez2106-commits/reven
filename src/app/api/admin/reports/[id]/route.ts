import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { notify } from "@/lib/notifications";

const VALID = ["PENDING", "REVIEWED", "DISMISSED", "ACTIONED"];
const STATUS_TEXT: Record<string, string> = {
  REVIEWED: "revisada",
  DISMISSED: "desestimada",
  ACTIONED: "resuelta (se tomó acción)",
  PENDING: "reabierta",
};

// Actualiza el estado de una denuncia (solo ADMIN)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const status: string | undefined = body?.status;
  if (!status || !VALID.includes(status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const report = await prisma.report.update({
    where: { id: params.id },
    data: {
      status: status as "PENDING" | "REVIEWED" | "DISMISSED" | "ACTIONED",
      reviewedAt: new Date(),
      reviewedBy: user.id,
    },
    select: { reporterId: true, listingId: true },
  });

  await notify({
    userId: report.reporterId,
    type: "REPORT",
    title: `Tu denuncia fue ${STATUS_TEXT[status] ?? "actualizada"}`,
    body: "Gracias por ayudarnos a mantener Reven seguro.",
    link: `/articulos/${report.listingId}`,
  });

  return NextResponse.json({ ok: true });
}
