import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { reportSchema } from "@/lib/validations";
import { REPORT_REASON_LABELS } from "@/lib/constants";
import { notifyAdmin, escapeHtml } from "@/lib/email";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/ratelimit";
import { appBaseUrl } from "@/lib/urls";

// Crear una denuncia sobre una publicación
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const limited = await enforceRateLimit(req, "report", RATE_LIMITS.report, user.id);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const listingId: string | undefined = body?.listingId;
  const parsed = reportSchema.safeParse(body);
  if (!listingId || !parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { sellerId: true, status: true, title: true },
  });
  if (!listing || listing.status === "DELETED") {
    return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 });
  }
  if (listing.sellerId === user.id) {
    return NextResponse.json(
      { error: "No podés denunciar tu propia publicación." },
      { status: 400 }
    );
  }

  // Una denuncia por usuario y publicación (idempotente)
  const existing = await prisma.report.findUnique({
    where: { reporterId_listingId: { reporterId: user.id, listingId } },
  });
  if (existing) return NextResponse.json({ ok: true, already: true });

  await prisma.report.create({
    data: {
      listingId,
      reporterId: user.id,
      reason: parsed.data.reason,
      details: parsed.data.details || null,
    },
  });

  // Notificación al admin (no bloquea la respuesta si falla)
  const baseUrl = appBaseUrl(req);
  const detailsHtml = parsed.data.details
    ? `<p><b>Detalle:</b> ${escapeHtml(parsed.data.details)}</p>`
    : "";
  await notifyAdmin(
    "🚩 Nueva denuncia en trato",
    `<p>Se denunció la publicación <b>${escapeHtml(listing.title)}</b>.</p>
     <p><b>Motivo:</b> ${REPORT_REASON_LABELS[parsed.data.reason]}</p>
     ${detailsHtml}
     <p><a href="${baseUrl}/admin/reportes">Revisar en el panel</a></p>`
  );

  return NextResponse.json({ ok: true });
}
