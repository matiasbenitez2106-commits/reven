import Link from "next/link";
import { Search, Flag } from "lucide-react";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { AdminListingActions } from "@/components/admin/AdminListingActions";
import { formatPrice, formatRelative } from "@/lib/utils";

export const metadata = { title: "Publicaciones · Admin" };
export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: "Activa", cls: "bg-brand-100 dark:bg-brand-800/40 text-brand-700 dark:text-brand-300" },
  PAUSED: { label: "Pausada", cls: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300" },
  SOLD: { label: "Vendida", cls: "bg-gray-100 dark:bg-stone-800 text-gray-600 dark:text-stone-300" },
  DELETED: { label: "Eliminada", cls: "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400" },
};

const FILTERS = [
  { key: "", label: "Todas" },
  { key: "ACTIVE", label: "Activas" },
  { key: "PAUSED", label: "Pausadas" },
  { key: "SOLD", label: "Vendidas" },
  { key: "DELETED", label: "Eliminadas" },
];

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: { q?: string; estado?: string };
}) {
  const q = (searchParams.q || "").trim();
  const estado = (searchParams.estado || "").trim();

  const where: Prisma.ListingWhereInput = {
    ...(estado
      ? { status: estado as Prisma.ListingWhereInput["status"] }
      : { status: { not: "DELETED" } }),
    ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
  };

  const listings = await prisma.listing.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      title: true,
      price: true,
      status: true,
      createdAt: true,
      viewCount: true,
      seller: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { reports: true } },
    },
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <form className="flex max-w-md flex-1 items-center gap-2" action="/admin/publicaciones">
          {estado && <input type="hidden" name="estado" value={estado} />}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-stone-500" />
            <input name="q" defaultValue={q} placeholder="Buscar por título..." className="input pl-9" />
          </div>
          <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            Buscar
          </button>
        </form>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <Link
              key={f.key}
              href={`/admin/publicaciones${f.key ? `?estado=${f.key}` : ""}${q ? `${f.key ? "&" : "?"}q=${encodeURIComponent(q)}` : ""}`}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                estado === f.key
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-line dark:border-stone-800 text-gray-600 dark:text-stone-300 hover:bg-gray-50 dark:hover:bg-stone-800"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-line dark:border-stone-800 text-left text-xs uppercase tracking-wide text-gray-400 dark:text-stone-500">
              <th className="px-4 py-3">Publicación</th>
              <th className="px-4 py-3">Vendedor</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Vistas</th>
              <th className="px-4 py-3">Denuncias</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line dark:divide-stone-800">
            {listings.map((l) => {
              const st = STATUS_LABELS[l.status] ?? STATUS_LABELS.ACTIVE;
              return (
                <tr key={l.id}>
                  <td className="max-w-[260px] px-4 py-3">
                    <Link
                      href={`/articulos/${l.id}`}
                      className="block truncate font-medium hover:text-brand-600 dark:hover:text-brand-300"
                    >
                      {l.title}
                    </Link>
                    <p className="text-xs text-gray-400 dark:text-stone-500">{formatRelative(l.createdAt)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/usuarios/${l.seller.id}`}
                      className="text-gray-600 dark:text-stone-300 hover:text-brand-600 dark:hover:text-brand-300"
                    >
                      {l.seller.firstName} {l.seller.lastName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-medium">{formatPrice(Number(l.price))}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${st.cls}`}>
                      {st.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-stone-400">{l.viewCount}</td>
                  <td className="px-4 py-3">
                    {l._count.reports > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400">
                        <Flag className="h-3.5 w-3.5" /> {l._count.reports}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-stone-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      {l.status !== "DELETED" && (
                        <AdminListingActions listingId={l.id} status={l.status} />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {listings.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400 dark:text-stone-500">
                  No hay publicaciones con ese filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-gray-400 dark:text-stone-500">Se muestran hasta 100 resultados.</p>
    </div>
  );
}
