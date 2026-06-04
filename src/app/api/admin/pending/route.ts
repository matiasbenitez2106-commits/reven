import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// Contadores de pendientes para el badge del admin
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ reports: 0, verifications: 0, total: 0 });
  }
  const [reports, verifications] = await Promise.all([
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.user.count({ where: { verification: "PENDING" } }),
  ]);
  return NextResponse.json({ reports, verifications, total: reports + verifications });
}
