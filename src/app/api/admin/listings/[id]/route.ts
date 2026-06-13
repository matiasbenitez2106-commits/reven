import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const actionSchema = z.object({ action: z.enum(["pause", "activate", "delete"]) });

// Moderación de publicaciones (solo admin): pausar, reactivar o eliminar (soft).
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  }

  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    select: { id: true, status: true },
  });
  if (!listing || listing.status === "DELETED") {
    return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 });
  }

  const status =
    parsed.data.action === "pause"
      ? ("PAUSED" as const)
      : parsed.data.action === "activate"
        ? ("ACTIVE" as const)
        : ("DELETED" as const);

  await prisma.listing.update({ where: { id: listing.id }, data: { status } });
  return NextResponse.json({ ok: true });
}
