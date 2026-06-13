import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const schema = z.object({ status: z.enum(["OPEN", "CLOSED"]) });

// Marcar un mensaje de soporte como resuelto / reabrir (solo admin).
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  await prisma.supportMessage
    .update({ where: { id: params.id }, data: { status: parsed.data.status } })
    .catch(() => null);
  return NextResponse.json({ ok: true });
}
