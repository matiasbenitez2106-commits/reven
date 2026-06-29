import { prisma } from "@/lib/prisma";
import { ANALYTICS_EVENTS } from "@/lib/analytics";

export const metadata = { title: "Métricas" };
export const dynamic = "force-dynamic";

// "Hoy" por día de Argentina (UTC-3, sin horario de verano), no por el del server
// (UTC en Vercel): así el corte del día no se confunde. 7/30 días quedan rolling.
const AR_OFFSET_MS = 3 * 60 * 60 * 1000;

function startOfTodayAR(now: Date): Date {
  const ar = new Date(now.getTime() - AR_OFFSET_MS); // ahora en hora AR
  const arMidnight = Date.UTC(ar.getUTCFullYear(), ar.getUTCMonth(), ar.getUTCDate());
  return new Date(arMidnight + AR_OFFSET_MS); // instante UTC de la medianoche AR
}

export default async function AdminMetricsPage() {
  const now = new Date();
  const today = startOfTodayAR(now);
  const last7 = new Date(now.getTime() - 7 * 86400000);
  const last30 = new Date(now.getTime() - 30 * 86400000);

  // Una consulta agregada por ventana (groupBy por type), en paralelo.
  const [todayRows, weekRows, monthRows] = await Promise.all([
    prisma.analyticsEvent.groupBy({ by: ["type"], where: { createdAt: { gte: today } }, _count: { _all: true } }),
    prisma.analyticsEvent.groupBy({ by: ["type"], where: { createdAt: { gte: last7 } }, _count: { _all: true } }),
    prisma.analyticsEvent.groupBy({ by: ["type"], where: { createdAt: { gte: last30 } }, _count: { _all: true } }),
  ]);

  const counts = (rows: { type: string; _count: { _all: number } }[]) =>
    new Map(rows.map((r) => [r.type, r._count._all]));
  const cToday = counts(todayRows);
  const cWeek = counts(weekRows);
  const cMonth = counts(monthRows);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Embudo (eventos anónimos)</h2>
        <p className="text-sm text-gray-500 dark:text-stone-400">
          Conteo por evento — sin datos personales, solo el tipo y cuándo pasó. “Hoy” es el día de Argentina.
        </p>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line dark:border-stone-800 text-left text-xs uppercase tracking-wide text-gray-400 dark:text-stone-500">
              <th className="px-4 py-3 font-medium">Evento</th>
              <th className="px-4 py-3 text-right font-medium">Hoy</th>
              <th className="px-4 py-3 text-right font-medium">7 días</th>
              <th className="px-4 py-3 text-right font-medium">30 días</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line dark:divide-stone-800">
            {ANALYTICS_EVENTS.map((e) => (
              <tr key={e.type} className="hover:bg-surface-hover dark:hover:bg-stone-800/50">
                <td className="px-4 py-3 font-medium text-gray-700 dark:text-stone-200">{e.label}</td>
                <td className="px-4 py-3 text-right tabular-nums">{cToday.get(e.type) ?? 0}</td>
                <td className="px-4 py-3 text-right tabular-nums">{cWeek.get(e.type) ?? 0}</td>
                <td className="px-4 py-3 text-right tabular-nums">{cMonth.get(e.type) ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 dark:text-stone-500">
        El tráfico (visitas y de dónde vienen) se ve en el panel de Vercel Web Analytics.
      </p>
    </div>
  );
}
