import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { reviewSchema } from "@/lib/validations";
import { canReviewListing } from "@/lib/listings";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/ratelimit";

// Crear una reseña tras una venta, en DOBLE sentido (comprador→vendedor o
// vendedor→comprador). El target y el rol los decide SIEMPRE el servidor.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const limited = await enforceRateLimit(req, "review", RATE_LIMITS.write, user.id);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const listingId: string | undefined = body?.listingId;
  // Validamos rating (1..5) y comment con el reviewSchema que ya existe.
  const parsed = reviewSchema.pick({ rating: true, comment: true }).safeParse(body);
  if (!listingId || !parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  // El SERVIDOR decide elegibilidad, target y targetRole: no se confía en el cliente.
  const elig = await canReviewListing(user.id, listingId);
  if (!elig.canReview || !elig.targetId || !elig.targetRole) {
    return NextResponse.json(
      {
        error: elig.alreadyReviewed
          ? "Ya dejaste tu calificación."
          : "No podés calificar esta publicación.",
      },
      { status: 403 }
    );
  }

  try {
    const review = await prisma.review.create({
      data: {
        listingId,
        authorId: user.id,
        targetId: elig.targetId,
        targetRole: elig.targetRole,
        rating: parsed.data.rating,
        comment: parsed.data.comment || null,
      },
      select: { id: true },
    });
    return NextResponse.json({ ok: true, id: review.id });
  } catch (e) {
    // @@unique([listingId, authorId]): backstop ante doble carga (carrera).
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Ya dejaste tu calificación." }, { status: 409 });
    }
    throw e;
  }
}
