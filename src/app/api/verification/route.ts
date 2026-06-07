import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { verificationSubmitSchema } from "@/lib/validations";
import { uploadPrivateImage } from "@/lib/storage";
import { encrypt } from "@/lib/crypto";
import { purgeVerificationImages } from "@/lib/account";
import { runIdentityCheck } from "@/lib/identity";
import { notifyAdmin } from "@/lib/email";
import { notify } from "@/lib/notifications";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/ratelimit";

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

  const limited = await enforceRateLimit(req, "verification", RATE_LIMITS.verification, user.id);
  if (limited) return limited;

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

  const { dniNumber, dniFront, dniBack, selfie, matchScore, livenessScore } = parsed.data;

  // Imágenes de un intento anterior (las purgamos: conservamos solo la última versión)
  const previous = await prisma.verification.findUnique({
    where: { userId: user.id },
    select: { dniFrontUrlEnc: true, dniBackUrlEnc: true, selfieUrlEnc: true },
  });

  // Subida con entrega PRIVADA (no quedan en el CDN público). Las imágenes se
  // CONSERVAN encriptadas para poder responder a requerimientos de la justicia/policía
  // ante un delito. Acceso restringido a administradores (ver visor/export admin).
  const [front, back, self] = await Promise.all([
    uploadPrivateImage(dniFront, "verification"),
    uploadPrivateImage(dniBack, "verification"),
    uploadPrivateImage(selfie, "verification"),
  ]);

  // Decisión: si el cliente mandó scores de reconocimiento facial (face-api),
  // decidimos con ellos; si no, caemos al proveedor (mock/Onfido).
  let status: "VERIFIED" | "REJECTED" | "PENDING";
  let provider: string;
  let providerRef: string | null = null;
  let mScore: number | null;
  let lScore: number | null;
  let rejectionReason: string | null = null;

  if (matchScore != null || livenessScore != null) {
    provider = "face-api";
    mScore = matchScore ?? null;
    lScore = livenessScore ?? null;
    if (mScore == null) {
      status = "PENDING"; // no se detectó cara en alguna foto → revisión manual
    } else if (mScore >= 0.5 && (lScore ?? 0) >= 0.4) {
      status = "VERIFIED";
    } else if (mScore < 0.4) {
      status = "REJECTED";
      rejectionReason = "La cara de la selfie no coincide con la del DNI.";
    } else {
      status = "PENDING"; // zona gris → revisión manual
    }
  } else {
    const result = await runIdentityCheck({ dniNumber, dniFront, dniBack, selfie });
    status = result.decision;
    provider = result.provider;
    providerRef = result.providerRef;
    mScore = result.matchScore;
    lScore = result.livenessScore;
    if (status === "REJECTED") rejectionReason = "No se pudo confirmar tu identidad.";
  }

  // Purga de las imágenes del INTENTO ANTERIOR (evita duplicados/huérfanos en Cloudinary)
  if (previous) await purgeVerificationImages(previous);

  // Guardado: datos sensibles ENCRIPTADOS (AES-256-GCM).
  const data = {
    status,
    provider,
    providerRef,
    // Para Cloudinary guardamos el publicId (la imagen es privada); en dev local, la ruta.
    dniFrontUrlEnc: encrypt(front.publicId ?? front.url),
    dniBackUrlEnc: encrypt(back.publicId ?? back.url),
    selfieUrlEnc: encrypt(self.publicId ?? self.url),
    dniNumberEnc: encrypt(dniNumber),
    livenessScore: lScore,
    matchScore: mScore,
    rejectionReason,
    reviewedAt: status === "PENDING" ? null : new Date(),
    reviewedBy: status === "PENDING" ? null : "system",
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

  if (status === "VERIFIED") {
    await notify({
      userId: user.id,
      type: "VERIFICATION",
      title: "¡Tu identidad fue verificada! ✅",
      body: "Ya podés publicar y contactar vendedores.",
      link: "/cuenta",
    });
  } else if (status === "REJECTED") {
    await notify({
      userId: user.id,
      type: "VERIFICATION",
      title: "Tu verificación fue rechazada",
      body: "Podés reintentar con fotos más nítidas.",
      link: "/verificacion",
    });
  }

  return NextResponse.json({ status });
}
