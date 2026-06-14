import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { verificationSubmitSchema } from "@/lib/validations";
import { uploadPrivateImage } from "@/lib/storage";
import { encrypt, hashSensitive } from "@/lib/crypto";
import { purgeVerificationImages } from "@/lib/account";
import { notifyAdmin } from "@/lib/email";
import { notify } from "@/lib/notifications";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/ratelimit";
import { appBaseUrl } from "@/lib/urls";

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

  // Límite de tamaño de cada imagen (data URI) — evita DoS / abuso de cuota de Cloudinary.
  const MAX_IMG = 11_000_000; // ~8MB de imagen ≈ 11MB en base64
  if (dniFront.length > MAX_IMG || dniBack.length > MAX_IMG || selfie.length > MAX_IMG) {
    return NextResponse.json(
      { error: "Alguna de las fotos es demasiado grande (máx. 8MB cada una)." },
      { status: 413 }
    );
  }

  // 1 cuenta por persona física: si este Nº de DNI ya está VERIFICADO en OTRA cuenta,
  // bloqueamos. Comparamos por hash (nunca en claro). Solo contra VERIFIED para no
  // permitir que intentos PENDING ajenos "traben" (DoS) el DNI de una persona real;
  // los duplicados que queden en revisión los resuelve un admin.
  const dniHash = hashSensitive(dniNumber);
  const dup = await prisma.verification.findFirst({
    where: { dniHash, userId: { not: user.id }, status: "VERIFIED" },
    select: { id: true },
  });
  if (dup) {
    return NextResponse.json(
      {
        error:
          "Ese DNI ya está asociado a otra cuenta. Cada persona puede tener una sola cuenta en trato.",
      },
      { status: 409 }
    );
  }

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
  // SEGURIDAD: los scores faciales se calculan en el NAVEGADOR (face-api), así que un
  // cliente malicioso podría falsificarlos. NO se usan para aprobar por su cuenta: se
  // guardan como AYUDA para el admin y TODA verificación pasa por REVISIÓN MANUAL
  // (queda PENDING) antes de habilitar la cuenta. Ver SECURITY.md.
  const status: "VERIFIED" | "REJECTED" | "PENDING" = "PENDING";
  const provider = matchScore != null || livenessScore != null ? "face-api" : "manual";
  const providerRef: string | null = null;
  const mScore: number | null = matchScore ?? null;
  const lScore: number | null = livenessScore ?? null;
  const rejectionReason: string | null = null;

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
    dniHash,
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
    const baseUrl = appBaseUrl(req);
    await notifyAdmin(
      "🪪 Nueva verificación pendiente en trato",
      `<p>Un usuario envió documentación para verificar su identidad.</p>
       <p><a href="${baseUrl}/admin/verificaciones">Revisar en el panel</a></p>`
    );
  }

  await notify({
    userId: user.id,
    type: "VERIFICATION",
    title: "Recibimos tu verificación 🪪",
    body: "Estamos revisando tu identidad. Te avisamos apenas quede aprobada (suele ser rápido).",
    link: "/verificacion",
  });

  return NextResponse.json({ status });
}
