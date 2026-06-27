import { Mail, Inbox } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatRelative } from "@/lib/utils";
import { AdminSupportActions } from "@/components/admin/AdminSupportActions";

export const metadata = { title: "Soporte · Admin" };
export const dynamic = "force-dynamic";

const TOPIC_LABEL: Record<string, { label: string; cls: string }> = {
  SOPORTE: { label: "Soporte", cls: "bg-brand-100 dark:bg-brand-800/40 text-brand-700 dark:text-brand-300" },
  PRIVACIDAD: { label: "Privacidad", cls: "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300" },
  DENUNCIA: { label: "Denuncia", cls: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300" },
  OTRO: { label: "Otro", cls: "bg-surface-sunken dark:bg-stone-800 text-gray-600 dark:text-stone-300" },
};

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: { estado?: string };
}) {
  const showClosed = searchParams.estado === "cerrados";
  const messages = await prisma.supportMessage.findMany({
    where: { status: showClosed ? "CLOSED" : "OPEN" },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <div className="mb-4 flex items-center gap-1.5 text-sm">
        <a
          href="/admin/soporte"
          className={`rounded-full px-3 py-1 font-medium ${!showClosed ? "bg-brand-600 text-white" : "border border-line dark:border-stone-800 text-gray-600 dark:text-stone-300"}`}
        >
          Abiertos
        </a>
        <a
          href="/admin/soporte?estado=cerrados"
          className={`rounded-full px-3 py-1 font-medium ${showClosed ? "bg-brand-600 text-white" : "border border-line dark:border-stone-800 text-gray-600 dark:text-stone-300"}`}
        >
          Resueltos
        </a>
      </div>

      {messages.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 p-12 text-center text-gray-400 dark:text-stone-500">
          <Inbox className="h-10 w-10" />
          <p>{showClosed ? "No hay mensajes resueltos." : "No hay mensajes pendientes 🎉"}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {messages.map((m) => {
            const t = TOPIC_LABEL[m.topic] ?? TOPIC_LABEL.OTRO;
            return (
              <li key={m.id} className="card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${t.cls}`}>
                      {t.label}
                    </span>
                    <span className="font-medium">{m.name}</span>
                    <a
                      href={`mailto:${m.email}?subject=Re: tu consulta en trato`}
                      className="inline-flex items-center gap-1 text-xs text-brand-700 dark:text-brand-300 hover:underline"
                    >
                      <Mail className="h-3.5 w-3.5" /> {m.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 dark:text-stone-500">{formatRelative(m.createdAt)}</span>
                    <AdminSupportActions id={m.id} closed={m.status === "CLOSED"} />
                  </div>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm text-gray-700 dark:text-stone-200">{m.message}</p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
