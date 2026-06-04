import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { verificationSubmitSchema } from "@/lib/validations";
import { uploadImage } from "@/lib/storage";
import { encrypt } from "@/lib/crypto";
import { runIdentityCheck } from "@/lib/identity";
import { notifyAdmin } from "@/lib/email";

// Estado de verificación del usuario actual
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const detail = await prisma.verification.findUnique({
    where: { userId: user.id },
    select: {
      status: true,
      rejectionReason: true,
      livenessScore: true,
      matchScore: true,
      createdAt: true,
      reviewedAt: true,
    },
  });

  return NextResponse.json({ status: detail?.status ?? "UNVERIFIED", detail });
}

// Envío de documentación de verificación
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const current = await prisma.user.findUnique({
    where: { id: user.id },
    select: { verification: true },
  });
  if (current?.verification === "VERIFIED") {
    return NextResponse.json({ error: "Tu identidad ya está verificada." }, { status: 400 });
  }

  const json = await req.json().catch(() => null);
  const parsed = verificationSubmitSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { dniNumber, dniFront, dniBack, selfie } = parsed.data;

  // Subida de imágenes a almacenamiento privado
  const [front, back, self] = await Promise.all([
    uploadImage(dniFront, "verification"),
    uploadImage(dniBack, "verification"),
    uploadImage(selfie, "verification"),
  ]);

  // Chequeo de identidad (mock / Onfido)
  const result = await runIdentityCheck({ dniNumber, dniFront, dniBack, selfie });
  const status = result.decision;

  // Guardado: datos sensibles ENCRIPTADOS (AES-256-GCM)
  const data = {
    status,
    provider: result.provider,
    providerRef: result.providerRef,
    dniFrontUrlEnc: encrypt(front.url),
    dniBackUrlEnc: encrypt(back.url),
    selfieUrlEnc: encrypt(self.url),
    dniNumberEnc: encrypt(dniNumber),
    livenessScore: result.livenessScore,
    matchScore: result.matchScore,
    rejectionReason: status === "REJECTED" ? "No se pudo confirmar tu identidad." : null,
    reviewedAt: status === "PENDING" ? null : new Date(),
    reviewedBy: result.provider === "mock" ? "system" : null,
  };

  await prisma.$transaction([
    prisma.verification.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...data },
      update: data,
    }),
    prisma.user.update({ where: { id: user.id }, data: { verification: status } }),
  ]);

  // Si queda en revisión manual, avisamos al admin
  if (status === "PENDING") {
    const baseUrl = new URL(req.url).origin;
    await notifyAdmin(
      "🪪 Nueva verificación pendiente en Reven",
      `<p>Un usuario envió documentación para verificar su identidad.</p>
       <p><a href="${baseUrl}/admin/verificaciones">Revisar en el panel</a></p>`
    );
  }

  return NextResponse.json({ status });
}
