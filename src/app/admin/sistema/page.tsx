import { Database, HardDrive, Mail, Server, Cloud } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCloudinaryUsage } from "@/lib/storage";

export const metadata = { title: "Sistema · Admin" };
export const dynamic = "force-dynamic";

function fmtBytes(n: number): string {
  if (n <= 0) return "0 MB";
  const mb = n / (1024 * 1024);
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
  return `${mb.toFixed(1)} MB`;
}

function Bar({ pct }: { pct: number }) {
  const p = Math.min(100, Math.max(0, pct));
  const color = p > 85 ? "bg-red-500" : p > 60 ? "bg-amber-500" : "bg-brand-600";
  return (
    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-stone-800">
      <div className={`h-full ${color}`} style={{ width: `${p}%` }} />
    </div>
  );
}

export default async function AdminSystemPage() {
  const [users, listings, images, messages, support, dbSizeRows, cloud] = await Promise.all([
    prisma.user.count(),
    prisma.listing.count(),
    prisma.listingImage.count(),
    prisma.message.count(),
    prisma.supportMessage.count(),
    prisma.$queryRaw<{ size: bigint }[]>`SELECT pg_database_size(current_database()) AS size`,
    getCloudinaryUsage(),
  ]);

  const dbBytes = Number(dbSizeRows?.[0]?.size ?? 0);
  const NEON_LIMIT = 0.5 * 1024 * 1024 * 1024; // 512 MB (Neon free)
  const dbPct = (dbBytes / NEON_LIMIT) * 100;

  const cloudBytes = cloud?.storageBytes ?? 0;
  const CLOUD_STORAGE_LIMIT = 25 * 1024 * 1024 * 1024; // ~25 GB ref (Cloudinary free)
  const cloudPct = (cloudBytes / CLOUD_STORAGE_LIMIT) * 100;
  const creditsPct =
    cloud?.credits && cloud.credits.limit ? (cloud.credits.used / cloud.credits.limit) * 100 : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Server className="h-5 w-5 text-brand-600 dark:text-brand-300" /> Sistema y límites
        </h2>
        <p className="text-sm text-gray-500 dark:text-stone-400">
          Uso actual de la infraestructura y cuán cerca estamos de los límites de cada plan.
        </p>
      </div>

      {/* Base de datos */}
      <div className="card p-5">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-gray-500 dark:text-stone-400" />
          <h3 className="font-semibold">Base de datos (Neon · PostgreSQL)</h3>
        </div>
        <p className="mt-2 text-sm text-gray-600 dark:text-stone-300">
          <strong>{fmtBytes(dbBytes)}</strong> usados de ~512 MB del plan gratuito ({dbPct.toFixed(1)}%).
        </p>
        <Bar pct={dbPct} />
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-stone-400 sm:grid-cols-5">
          <span>{users} usuarios</span>
          <span>{listings} publicaciones</span>
          <span>{images} imágenes (refs)</span>
          <span>{messages} mensajes</span>
          <span>{support} soporte</span>
        </div>
      </div>

      {/* Almacenamiento de imágenes */}
      <div className="card p-5">
        <div className="flex items-center gap-2">
          <Cloud className="h-5 w-5 text-gray-500 dark:text-stone-400" />
          <h3 className="font-semibold">Almacenamiento de imágenes (Cloudinary)</h3>
        </div>
        {cloud ? (
          <>
            <p className="mt-2 text-sm text-gray-600 dark:text-stone-300">
              <strong>{fmtBytes(cloudBytes)}</strong> almacenados (~{cloudPct.toFixed(1)}% de la
              referencia gratuita de 25 GB).
            </p>
            <Bar pct={cloudPct} />
            {creditsPct != null && (
              <p className="mt-3 text-xs text-gray-500 dark:text-stone-400">
                Créditos del mes: {cloud!.credits!.used.toFixed(1)} / {cloud!.credits!.limit} (
                {creditsPct.toFixed(0)}%). Los créditos combinan almacenamiento, transformaciones y
                ancho de banda.
              </p>
            )}
          </>
        ) : (
          <p className="mt-2 text-sm text-gray-400 dark:text-stone-500">
            No se pudo leer el uso de Cloudinary (¿credenciales no configuradas?).
          </p>
        )}
      </div>

      {/* Límites de referencia */}
      <div className="card p-5">
        <div className="flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-gray-500 dark:text-stone-400" />
          <h3 className="font-semibold">Límites de los planes actuales (referencia)</h3>
        </div>
        <ul className="mt-3 space-y-2 text-sm text-gray-600 dark:text-stone-300">
          <li className="flex items-center gap-2">
            <Server className="h-4 w-4 text-gray-400 dark:text-stone-500" /> <strong>Vercel Hobby:</strong>{" "}
            1 build a la vez, 100 GB de ancho de banda/mes, funciones serverless con límite de tiempo.
            Sin tráfico comercial garantizado.
          </li>
          <li className="flex items-center gap-2">
            <Database className="h-4 w-4 text-gray-400 dark:text-stone-500" /> <strong>Neon Free:</strong>{" "}
            ~0,5 GB de almacenamiento, se suspende por inactividad (arranque en frío).
          </li>
          <li className="flex items-center gap-2">
            <Cloud className="h-4 w-4 text-gray-400 dark:text-stone-500" /> <strong>Cloudinary Free:</strong>{" "}
            25 créditos/mes (almacenamiento + transformaciones + ancho de banda).
          </li>
          <li className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-400 dark:text-stone-500" /> <strong>Resend Free:</strong>{" "}
            ~3.000 emails/mes, 100 por día.
          </li>
        </ul>
        <p className="mt-3 text-xs text-gray-400 dark:text-stone-500">
          Cuando un recurso se acerque al 80% conviene pasar al plan pago correspondiente para no
          cortar el servicio.
        </p>
      </div>
    </div>
  );
}
