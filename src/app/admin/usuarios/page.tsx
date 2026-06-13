import Link from "next/link";
import { Search, ShieldCheck, Crown, FileSearch } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AdminUserActions } from "@/components/admin/AdminUserActions";
import { formatRelative } from "@/lib/utils";

export const metadata = { title: "Usuarios · Admin" };
export const dynamic = "force-dynamic";

const VERIF_LABELS: Record<string, string> = {
  UNVERIFIED: "Sin verificar",
  PENDING: "Pendiente",
  VERIFIED: "Verificada",
  REJECTED: "Rechazada",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q || "").trim();

  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      verification: true,
      suspendedAt: true,
      proPlan: true,
      proUntil: true,
      createdAt: true,
      _count: { select: { listings: { where: { status: { not: "DELETED" } } } } },
    },
  });

  return (
    <div>
      <form className="mb-4 flex max-w-md items-center gap-2" action="/admin/usuarios">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-stone-500" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre o email..."
            className="input pl-9"
          />
        </div>
        <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          Buscar
        </button>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-stone-800 text-left text-xs uppercase tracking-wide text-gray-400 dark:text-stone-500">
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Verificación</th>
              <th className="px-4 py-3">Publicaciones</th>
              <th className="px-4 py-3">Alta</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-stone-800">
            {users.map((u) => (
              <tr key={u.id} className={u.suspendedAt ? "opacity-60" : ""}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Link href={`/usuarios/${u.id}`} className="hover:text-brand-600 dark:hover:text-brand-300">
                      {u.firstName} {u.lastName}
                    </Link>
                    {u.role === "ADMIN" && (
                      <span className="rounded bg-brand-100 dark:bg-brand-800/40 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700 dark:text-brand-300">
                        ADMIN
                      </span>
                    )}
                    {u.proPlan && u.proUntil && u.proUntil > new Date() && (
                      <Crown className="h-3.5 w-3.5 text-amber-500" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-stone-400">{u.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 text-xs ${
                      u.verification === "VERIFIED"
                        ? "text-brand-700 dark:text-brand-300"
                        : u.verification === "PENDING"
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-gray-500 dark:text-stone-400"
                    }`}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {VERIF_LABELS[u.verification] ?? u.verification}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-stone-300">{u._count.listings}</td>
                <td className="px-4 py-3 text-xs text-gray-500 dark:text-stone-400">
                  {formatRelative(u.createdAt)}
                </td>
                <td className="px-4 py-3">
                  {u.suspendedAt ? (
                    <span className="rounded bg-red-50 dark:bg-red-950/40 px-1.5 py-0.5 text-[11px] font-semibold text-red-600 dark:text-red-400">
                      Suspendida
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400 dark:text-stone-500">Activa</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <Link
                      href={`/admin/identidad/${u.id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-stone-800 px-2 py-1 text-xs font-medium text-gray-600 dark:text-stone-300 hover:bg-gray-50 dark:hover:bg-stone-800"
                    >
                      <FileSearch className="h-3.5 w-3.5" /> Identidad
                    </Link>
                    {u.role !== "ADMIN" && (
                      <AdminUserActions userId={u.id} suspended={!!u.suspendedAt} />
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400 dark:text-stone-500">
                  No se encontraron usuarios{q ? ` para "${q}"` : ""}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-gray-400 dark:text-stone-500">
        Se muestran hasta 100 resultados. Usá la búsqueda para encontrar a alguien puntual.
      </p>
    </div>
  );
}
