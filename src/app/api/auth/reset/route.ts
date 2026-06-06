import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { consumeAuthToken } from "@/lib/tokens";

// Restablece la contraseña usando un token válido
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const token = String(body?.token || "");
  const newPassword = String(body?.newPassword || "");

  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 8 caracteres." },
      { status: 400 }
    );
  }

  const userId = await consumeAuthToken(token, "PASSWORD_RESET");
  if (!userId) {
    return NextResponse.json({ error: "El link es inválido o ya venció." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  return NextResponse.json({ ok: true });
}
