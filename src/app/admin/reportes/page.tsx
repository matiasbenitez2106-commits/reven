import Link from "next/link";
import { Flag, ImageOff, FileText } from "lucide-react";
import { ReportStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { REPORT_REASON_LABELS } from "@/lib/constants";
import { formatRelative } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { AdminReportActions } from "@/components/admin/AdminReportActions";

export const metadata = { title: "Denuncias · Admin" };

const STATUS: Record<ReportStatus, { label: string; color: "yellow" | "blue" | "gray" | "green" }> = {
  PENDING: { label: "Pendiente", color: "yellow" },
  REVIEWED: { label: "Revisada", color: "blue" },
  DISMISSED: { label: "Desestimada", color: "gray" },
  ACTIONED: { label: "Con acción", color: "green" },
};

export default async function AdminReportsPage() {
  const reports = await prisma.report.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          status: true,
          images: { orderBy: { position: "asc" }, take: 1 },
          seller: { select: { id: true, firstName: true, lastName: true } },
        },
      },
      reporter: { select: { firstName: true, lastName: true, email: true } },
    },
    take: 100,
  });

  if (reports.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-2 p-12 text-center text-gray-500 dark:text-stone-400">
        <Flag className="h-10 w-10 text-gray-300 dark:text-stone-600" />
        <p>No hay denuncias.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((r) => {
        const thumb = r.listing.images[0]?.url ?? null;
        return (
          <div key={r.id} className="card p-4">
            <div className="flex gap-4">
              <Link href={`/articulos/${r.listing.id}`} className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-sunken dark:bg-stone-800">
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumb} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-300 dark:text-stone-600">
                    <ImageOff className="h-6 w-6" />
                  </div>
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/articulos/${r.listing.id}`} className="truncate font-medium hover:text-brand-600 dark:hover:text-brand-300">
                    {r.listing.title}
                  </Link>
                  <Badge color={STATUS[r.status].color}>{STATUS[r.status].label}</Badge>
                  {r.listing.status === "DELETED" && <Badge color="red">Publicación eliminada</Badge>}
                </div>
                <p className="mt-1 text-sm font-medium text-red-700 dark:text-red-300">
                  {REPORT_REASON_LABELS[r.reason]}
                </p>
                {r.details && <p className="mt-0.5 text-sm text-gray-600 dark:text-stone-300">“{r.details}”</p>}
                <p className="mt-1 text-xs text-gray-400 dark:text-stone-500">
                  Denunciado por {r.reporter.firstName} {r.reporter.lastName} ({r.reporter.email}) ·{" "}
                  {formatRelative(r.createdAt)}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <AdminReportActions reportId={r.id} listingId={r.listing.id} />
                  <Link
                    href={`/admin/identidad/${r.listing.seller.id}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-line dark:border-stone-700 bg-surface dark:bg-stone-900 px-3 py-1.5 text-xs font-medium hover:bg-surface-hover dark:hover:bg-stone-800"
                    title="Datos de identidad del vendedor para entregar a la autoridad"
                  >
                    <FileText className="h-3.5 w-3.5" /> Identidad del vendedor
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
