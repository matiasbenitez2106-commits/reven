import Link from "next/link";
import { Search, ShieldCheck, Crown, FileSearch } from "lucide-react";
import type { Prisma } from "@prisma/client";
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
  searchParams: { q?: string; estado?: string };
}) {
  const q = (searchParams.q || "").trim();

  // Filtro rápido por estado (Todas / En gracia / Bloqueadas).
  const estadoRaw = (searchParams.estado || "").trim();
  const estado: "" | "gracia" | "bloqueadas" =
    estadoRaw === "gracia" || estadoRaw === "bloqueadas" ? estadoRaw : "";

  // Armamos la búsqueda: texto libre + filtro de estado (se combinan con "y").
  const where: Prisma.UserWhereInput = {};
  if (q) {
    where.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
    ];
  }
  if (estado === "gracia") {
    // En gracia: tiene fecha de borrado y NO está bloqueada por denuncia.
    where.deletionScheduledFor = { not: null };
    where.legalHoldAt = null;
  } else if (estado === "bloqueadas") {
    where.legalHoldAt = { not: null };
  }

  const users = await prisma.user.findMany({
    where,
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
      // NUEVO: estado de baja en dos fases.
      deletionScheduledFor: true,
      legalHoldAt: true,
      proPlan: true,
      proUntil: true,
      createdAt: true,
      _count: { select: { listings: { where: { status: { not: "DELETED" } } } } },
    },
  });

  // NUEVO: cuántas denuncias abiertas (PENDING) tiene cada cuenta BLOQUEADA.
  // Una sola consulta extra, solo para las bloqueadas (no una por usuario).
  const blockedIds = users.filter((u) => u.legalHoldAt).map((u) => u.id);
  const openReports = blockedIds.length
    ? await prisma.report.findMany({
        where: { status: "PENDING", listing: { sellerId: { in: blockedIds } } },
        select: { listing: { select: { sellerId: true } } },
      })
    : [];
  const openReportsBySeller = new Map<string, number>();
  for (const r of openReports) {
    const s = r.listing.sellerId;
    openReportsBySeller.set(s, (openReportsBySeller.get(s) ?? 0) + 1);
  }

  // Helpers de fecha (formato argentino) y días restantes.
  const now = new Date();
  const fmtFecha = (d: Date) =>
    d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const diasRestantes = (d: Date) =>
    Math.max(0, Math.ceil((d.getTime() - now.getTime()) / 86_400_000));

  // Link de cada filtro, preservando la búsqueda de texto si la hay.
  const mkHref = (e: "" | "gracia" | "bloqueadas") => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (e) p.set("estado", e);
    const s = p.toString();
    return `/admin/usuarios${s ? `?${s}` : ""}`;
  };

  return (
    <div>
      <form className="mb-3 flex max-w-md items-center gap-2" action="/admin/usuarios">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-stone-500" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre o email..."
            className="input pl-9"
          />
        </div>
        {/* Mantener el filtro de estado al buscar por texto. */}
        <input type="hidden" name="estado" value={estado} />
        <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          Buscar
        </button>
      </form>

      {/* NUEVO: filtros rápidos de estado. */}
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
        {(
          [
            { key: "", label: "Todas" },
            { key: "gracia", label: "En gracia" },
            { key: "bloqueadas", label: "Bloqueadas" },
          ] as const
        ).map((f) => (
          <Link
            key={f.key || "todas"}
            href={mkHref(f.key)}
            className={`rounded-full px-3 py-1 font-medium ${
              estado === f.key
                ? "bg-brand-600 text-white"
                : "border border-gray-200 dark:border-stone-800 text-gray-600 dark:text-stone-300 hover:bg-gray-50 dark:hover:bg-stone-800"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

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
              <tr key={u.id} className={u.suspendedAt || u.legalHoldAt ? "opacity-60" : ""}>
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

                {/* MODIFICADO: estado con baja en dos fases. Prioridad:
                    Bloqueada > En baja / Baja vencida > Suspendida > Activa. */}
                <td className="px-4 py-3">
                  {u.legalHoldAt ? (
                    <div>
                      <span className="rounded bg-red-100 dark:bg-red-950/60 px-1.5 py-0.5 text-[11px] font-semibold text-red-700 dark:text-red-300">
                        Bloqueada
                      </span>
                      <p className="mt-1 text-[11px] text-gray-500 dark:text-stone-400">
                        desde {fmtFecha(u.legalHoldAt)} · {openReportsBySeller.get(u.id) ?? 0} denuncia
                        {(openReportsBySeller.get(u.id) ?? 0) === 1 ? "" : "s"} abierta
                        {(openReportsBySeller.get(u.id) ?? 0) === 1 ? "" : "s"}
                      </p>
                    </div>
                  ) : u.deletionScheduledFor ? (
                    u.deletionScheduledFor > now ? (
                      <div>
                        <span className="rounded bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                          En baja
                        </span>
                        <p className="mt-1 text-[11px] text-gray-500 dark:text-stone-400">
                          borra {fmtFecha(u.deletionScheduledFor)} · faltan {diasRestantes(u.deletionScheduledFor)} días
                        </p>
                      </div>
                    ) : (
                      <div>
                        <span className="rounded bg-orange-100 dark:bg-orange-950/50 px-1.5 py-0.5 text-[11px] font-semibold text-orange-700 dark:text-orange-300">
                          Baja vencida
                        </span>
                        <p className="mt-1 text-[11px] text-gray-500 dark:text-stone-400">
                          venció {fmtFecha(u.deletionScheduledFor)} · pendiente de borrado
                        </p>
                      </div>
                    )
                  ) : u.suspendedAt ? (
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
                      <FileSearch className="h-3.5 w-3.5" /> Ver DNI
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
