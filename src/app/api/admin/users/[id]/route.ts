import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { deleteUserAccount } from "@/lib/account";

const actionSchema = z.object({ action: z.enum(["suspend", "unsuspend"]) });

// Suspender / reactivar una cuenta (solo admin). Suspender bloquea el login
// (ver authorize en lib/auth) y pausa todas sus publicaciones activas.
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

  const target = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, role: true, suspendedAt: true },
  });
  if (!target) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  if (target.id === admin.id) {
    return NextResponse.json({ error: "No podés suspenderte a vos mismo" }, { status: 400 });
  }
  if (target.role === "ADMIN") {
    return NextResponse.json({ error: "No se puede suspender a otro admin" }, { status: 400 });
  }

  if (parsed.data.action === "suspend") {
    await prisma.$transaction([
      prisma.user.update({ where: { id: target.id }, data: { suspendedAt: new Date() } }),
      prisma.listing.updateMany({
        where: { sellerId: target.id, status: "ACTIVE" },
        data: { status: "PAUSED" },
      }),
    ]);
  } else {
    await prisma.user.update({ where: { id: target.id }, data: { suspendedAt: null } });
  }

  return NextResponse.json({ ok: true });
}

// Eliminación DEFINITIVA de una cuenta (solo admin). Borra datos del usuario y
// purga sus imágenes (DNI/selfie/publicaciones/avatar) de Cloudinary.
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const target = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, role: true },
  });
  if (!target) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  if (target.id === admin.id) {
    return NextResponse.json({ error: "No podés eliminar tu propia cuenta de admin" }, { status: 400 });
  }
  if (target.role === "ADMIN") {
    return NextResponse.json({ error: "No se puede eliminar a otro admin" }, { status: 400 });
  }

  try {
    await deleteUserAccount(target.id);
  } catch (e) {
    console.error("Admin delete user error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo eliminar la cuenta." },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
