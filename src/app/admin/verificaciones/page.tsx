import { ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatRelative } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { AdminVerificationActions } from "@/components/admin/AdminVerificationActions";
import { AdminVerificationViewer } from "@/components/admin/AdminVerificationViewer";

export const metadata = { title: "Verificaciones · Admin" };

export default async function AdminVerificationsPage() {
  const users = await prisma.user.findMany({
    where: { verification: "PENDING" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      city: true,
      province: true,
      avatarUrl: true,
      verificationData: {
        select: { livenessScore: true, matchScore: true, provider: true, createdAt: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  if (users.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-2 p-12 text-center text-gray-500">
        <ShieldCheck className="h-10 w-10 text-gray-300" />
        <p>No hay verificaciones pendientes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {users.map((u) => (
        <div key={u.id} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Avatar firstName={u.firstName} lastName={u.lastName} src={u.avatarUrl} size={44} />
            <div className="min-w-0">
              <p className="truncate font-medium">
                {u.firstName} {u.lastName}
              </p>
              <p className="truncate text-xs text-gray-500">
                {u.email} · {u.city}, {u.province}
              </p>
              {u.verificationData && (
                <p className="mt-1 text-xs text-gray-400">
                  Liveness: {fmt(u.verificationData.livenessScore)} · Match:{" "}
                  {fmt(u.verificationData.matchScore)} · {u.verificationData.provider} ·{" "}
                  {formatRelative(u.verificationData.createdAt)}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AdminVerificationViewer userId={u.id} />
            <AdminVerificationActions userId={u.id} />
          </div>
        </div>
      ))}
    </div>
  );
}

function fmt(n: number | null): string {
  return n == null ? "—" : `${Math.round(n * 100)}%`;
}
