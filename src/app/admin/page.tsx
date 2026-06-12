import Link from "next/link";
import { Flag, ShieldCheck, Package, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { REPORT_REASON_LABELS } from "@/lib/constants";
import { formatRelative } from "@/lib/utils";

export const metadata = { title: "Admin" };

export default async function AdminOverviewPage() {
  const [pendingReports, pendingVerifs, totalListings, totalUsers, recent] = await Promise.all([
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.user.count({ where: { verification: "PENDING" } }),
    prisma.listing.count({ where: { status: { not: "DELETED" } } }),
    prisma.user.count(),
    prisma.report.findMany({
      where: { status: "PENDING" },
      include: { listing: { select: { id: true, title: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const cards = [
    { label: "Denuncias pendientes", value: pendingReports, icon: Flag, href: "/admin/reportes", alert: pendingReports > 0 },
    { label: "Verificaciones pendientes", value: pendingVerifs, icon: ShieldCheck, href: "/admin/verificaciones", alert: pendingVerifs > 0 },
    { label: "Publicaciones", value: totalListings, icon: Package, href: "/buscar", alert: false },
    { label: "Usuarios", value: totalUsers, icon: Users, href: "#", alert: false },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.label}
              href={c.href}
              className={`card p-4 ${c.alert ? "ring-2 ring-red-200" : ""}`}
            >
              <Icon className={`h-5 w-5 ${c.alert ? "text-red-600 dark:text-red-400" : "text-gray-400 dark:text-stone-500"}`} />
              <p className="mt-2 text-2xl font-bold">{c.value}</p>
              <p className="text-xs text-gray-500 dark:text-stone-400">{c.label}</p>
            </Link>
          );
        })}
      </div>

      <div className="card mt-6 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Denuncias recientes</h2>
          <Link href="/admin/reportes" className="text-sm text-brand-600 dark:text-brand-300 hover:underline">
            Ver todas
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400 dark:text-stone-500">No hay denuncias pendientes 🎉</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-stone-800">
            {recent.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <Link href={`/articulos/${r.listing.id}`} className="min-w-0 truncate hover:text-brand-600 dark:hover:text-brand-300">
                  {r.listing.title}
                </Link>
                <span className="shrink-0 text-xs text-gray-400 dark:text-stone-500">
                  {REPORT_REASON_LABELS[r.reason]} · {formatRelative(r.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
