import Link from "next/link";
import {
  Flag,
  ShieldCheck,
  Package,
  Users,
  Crown,
  DollarSign,
  Ban,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { REPORT_REASON_LABELS, SUBSCRIPTION_PLANS } from "@/lib/constants";
import { formatPrice, formatRelative } from "@/lib/utils";

export const metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const now = new Date();
  const last30 = new Date(now.getTime() - 30 * 86400000);
  const last7 = new Date(now.getTime() - 7 * 86400000);

  const [
    pendingReports,
    pendingVerifs,
    totalUsers,
    verifiedUsers,
    suspendedUsers,
    newUsers7,
    activeListings,
    soldListings,
    newListings7,
    proActive,
    revenueAgg,
    revenue30Agg,
    proCount,
    proPlusCount,
    recentReports,
    recentUsers,
  ] = await Promise.all([
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.user.count({ where: { verification: "PENDING" } }),
    prisma.user.count(),
    prisma.user.count({ where: { verification: "VERIFIED" } }),
    prisma.user.count({ where: { suspendedAt: { not: null } } }),
    prisma.user.count({ where: { createdAt: { gte: last7 } } }),
    prisma.listing.count({ where: { status: "ACTIVE" } }),
    prisma.listing.count({ where: { status: "SOLD" } }),
    prisma.listing.count({ where: { status: { not: "DELETED" }, createdAt: { gte: last7 } } }),
    prisma.user.count({ where: { proUntil: { gt: now } } }),
    // Ingresos REALES por destacados: pagos aprobados, excluyendo los simulados (mock).
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "APPROVED", NOT: { mpPaymentId: { startsWith: "mock" } } },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: "APPROVED",
        updatedAt: { gte: last30 },
        NOT: { mpPaymentId: { startsWith: "mock" } },
      },
    }),
    prisma.user.count({ where: { proPlan: "PRO", proUntil: { gt: now } } }),
    prisma.user.count({ where: { proPlan: "PRO_PLUS", proUntil: { gt: now } } }),
    prisma.report.findMany({
      where: { status: "PENDING" },
      include: { listing: { select: { id: true, title: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, firstName: true, lastName: true, createdAt: true, verification: true },
    }),
  ]);

  const revenueTotal = revenueAgg._sum.amount ?? 0;
  const revenue30 = revenue30Agg._sum.amount ?? 0;
  // Ingreso recurrente mensual estimado por suscripciones activas (PRO/PRO+).
  const mrr =
    proCount * SUBSCRIPTION_PLANS.PRO.price + proPlusCount * SUBSCRIPTION_PLANS.PRO_PLUS.price;
  const activeUsers = totalUsers - suspendedUsers;

  // Tarjetas de acción (las que requieren atención van primero y se resaltan)
  const actionCards = [
    { label: "Denuncias pendientes", value: pendingReports, icon: Flag, href: "/admin/reportes", alert: pendingReports > 0 },
    { label: "Verificaciones pendientes", value: pendingVerifs, icon: ShieldCheck, href: "/admin/verificaciones", alert: pendingVerifs > 0 },
  ];

  const stats = [
    { label: "Usuarios", value: totalUsers, sub: `+${newUsers7} esta semana`, icon: Users, href: "/admin/usuarios" },
    { label: "Usuarios activos", value: activeUsers, sub: `${suspendedUsers} suspendidos`, icon: CheckCircle2, href: "/admin/usuarios" },
    { label: "Verificados", value: verifiedUsers, sub: `${totalUsers ? Math.round((verifiedUsers / totalUsers) * 100) : 0}% del total`, icon: CheckCircle2, href: "/admin/usuarios" },
    { label: "Publicaciones activas", value: activeListings, sub: `+${newListings7} esta semana`, icon: Package, href: "/admin/publicaciones?estado=ACTIVE" },
    { label: "Vendidas", value: soldListings, sub: "marcadas como vendidas", icon: TrendingUp, href: "/admin/publicaciones?estado=SOLD" },
    { label: "Suscriptores PRO", value: proActive, sub: "con plan vigente", icon: Crown, href: "/admin/usuarios" },
    { label: "Cuentas suspendidas", value: suspendedUsers, sub: "sin acceso", icon: Ban, href: "/admin/usuarios" },
  ];

  return (
    <div className="space-y-6">
      {/* Acciones que requieren atención */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {actionCards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.label} href={c.href} className={`card p-4 ${c.alert ? "ring-2 ring-red-300 dark:ring-red-800" : ""}`}>
              <Icon className={`h-5 w-5 ${c.alert ? "text-red-600 dark:text-red-400" : "text-gray-400 dark:text-stone-500"}`} />
              <p className="mt-2 text-2xl font-bold">{c.value}</p>
              <p className="text-xs text-gray-500 dark:text-stone-400">{c.label}</p>
            </Link>
          );
        })}

        {/* Ingresos por destacados (pagos únicos reales, sin simulados) */}
        <div className="card bg-brand-50 dark:bg-brand-900/30 p-4">
          <DollarSign className="h-5 w-5 text-brand-600 dark:text-brand-300" />
          <p className="mt-2 text-2xl font-bold text-brand-800 dark:text-brand-200">
            {formatPrice(revenueTotal)}
          </p>
          <p className="text-xs text-gray-600 dark:text-stone-300">
            Destacados (total) · {formatPrice(revenue30)} últimos 30 días
          </p>
        </div>

        {/* Ingreso recurrente por suscripciones (MRR estimado) */}
        <div className="card bg-indigo-50 dark:bg-indigo-950/40 p-4">
          <Crown className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <p className="mt-2 text-2xl font-bold text-indigo-800 dark:text-indigo-200">
            {formatPrice(mrr)}<span className="text-sm font-normal">/mes</span>
          </p>
          <p className="text-xs text-gray-600 dark:text-stone-300">
            Suscripciones activas · {proCount} PRO · {proPlusCount} PRO+
          </p>
        </div>
      </div>

      {/* Métricas generales */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} href={s.href} className="card p-4 transition hover:shadow-md">
              <div className="flex items-center gap-2 text-gray-400 dark:text-stone-500">
                <Icon className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">{s.label}</span>
              </div>
              <p className="mt-2 text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-stone-400">{s.sub}</p>
            </Link>
          );
        })}
      </div>

      {/* Listas: denuncias + usuarios recientes */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Denuncias recientes</h2>
            <Link href="/admin/reportes" className="text-sm text-brand-600 dark:text-brand-300 hover:underline">
              Ver todas
            </Link>
          </div>
          {recentReports.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400 dark:text-stone-500">No hay denuncias pendientes 🎉</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-stone-800">
              {recentReports.map((r) => (
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

        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Usuarios nuevos</h2>
            <Link href="/admin/usuarios" className="text-sm text-brand-600 dark:text-brand-300 hover:underline">
              Ver todos
            </Link>
          </div>
          {recentUsers.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400 dark:text-stone-500">Todavía no hay usuarios.</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-stone-800">
              {recentUsers.map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <Link href={`/usuarios/${u.id}`} className="min-w-0 truncate hover:text-brand-600 dark:hover:text-brand-300">
                    {u.firstName} {u.lastName}
                  </Link>
                  <span className="shrink-0 text-xs text-gray-400 dark:text-stone-500">
                    {u.verification === "VERIFIED" ? "✓ verificado" : "sin verificar"} · {formatRelative(u.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
