import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Categorías para los filtros/búsqueda de la app (público).
export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    select: { slug: true, name: true },
  });
  return NextResponse.json({ categories });
}
