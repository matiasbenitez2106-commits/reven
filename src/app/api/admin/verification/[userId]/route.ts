import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { decryptNullable } from "@/lib/crypto";
import { signedImageUrl, isCloudinaryPublicId } from "@/lib/storage";

// Convierte el valor guardado (publicId de Cloudinary o URL/ruta legacy) en algo visible.
function toViewable(value: string | null): string | null {
  if (!value) return null;
  return isCloudinaryPublicId(value) ? signedImageUrl(value) : value;
}

// Devuelve la documentación de verificación DESENCRIPTADA (solo ADMIN).
// Datos sensibles: acceso restringido al rol admin (regla de negocio).
export async function GET(_req: Request, { params }: { params: { userId: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const v = await prisma.verification.findUnique({ where: { userId: params.userId } });
  if (!v) return NextResponse.json({ error: "Sin documentación" }, { status: 404 });

  try {
    return NextResponse.json({
      dniNumber: decryptNullable(v.dniNumberEnc),
      dniFront: toViewable(decryptNullable(v.dniFrontUrlEnc)),
      dniBack: toViewable(decryptNullable(v.dniBackUrlEnc)),
      selfie: toViewable(decryptNullable(v.selfieUrlEnc)),
      livenessScore: v.livenessScore,
      matchScore: v.matchScore,
      status: v.status,
    });
  } catch {
    return NextResponse.json({ error: "No se pudo desencriptar" }, { status: 500 });
  }
}
