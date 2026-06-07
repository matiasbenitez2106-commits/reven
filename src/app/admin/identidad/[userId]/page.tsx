import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { decryptNullable } from "@/lib/crypto";
import { signedImageUrl, isCloudinaryPublicId } from "@/lib/storage";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { PrintButton } from "@/components/admin/PrintButton";

export const metadata = { title: "Dossier de identidad · Admin" };

// Convierte el valor guardado (publicId privado o ruta local) en una URL visible.
function toViewable(value: string | null): string | null {
  if (!value) return null;
  return isCloudinaryPublicId(value) ? signedImageUrl(value) : value;
}

function pct(n: number | null | undefined): string {
  return n == null ? "—" : `${Math.round(n * 100)}%`;
}

// Dossier completo de identidad de un usuario, pensado para ENTREGAR A LA AUTORIDAD
// COMPETENTE (policía / justicia) ante un requerimiento legal. Solo admin.
export default async function IdentityDossierPage({
  params,
}: {
  params: { userId: string };
}) {
  const admin = await getCurrentUser(); // el layout /admin ya exige rol ADMIN
  const u = await prisma.user.findUnique({
    where: { id: params.userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      province: true,
      city: true,
      role: true,
      verification: true,
      createdAt: true,
      verificationData: {
        select: {
          dniNumberEnc: true,
          dniFrontUrlEnc: true,
          dniBackUrlEnc: true,
          selfieUrlEnc: true,
          livenessScore: true,
          matchScore: true,
          status: true,
          provider: true,
          createdAt: true,
          reviewedAt: true,
        },
      },
      listings: {
        select: { id: true, title: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (!u) notFound();

  const reports = await prisma.report.findMany({
    where: { listing: { sellerId: u.id } },
    select: {
      id: true,
      reason: true,
      details: true,
      status: true,
      createdAt: true,
      listing: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Registro de auditoría: quién accedió a datos sensibles y cuándo.
  console.warn(
    `[AUDIT] Admin ${admin?.email ?? admin?.id} accedió al dossier de identidad de ${u.id} (${u.email})`
  );

  const v = u.verificationData;
  const dni = decryptNullable(v?.dniNumberEnc ?? null);
  const images: { label: string; src: string | null }[] = [
    { label: "Frente del DNI", src: toViewable(decryptNullable(v?.dniFrontUrlEnc ?? null)) },
    { label: "Dorso del DNI", src: toViewable(decryptNullable(v?.dniBackUrlEnc ?? null)) },
    { label: "Selfie", src: toViewable(decryptNullable(v?.selfieUrlEnc ?? null)) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <Link
          href="/admin/verificaciones"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600"
        >
          <ArrowLeft className="h-4 w-4" /> Volver
        </Link>
        <PrintButton />
      </div>

      {/* Aviso de confidencialidad */}
      <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
        <p>
          <strong>Documento confidencial.</strong> Contiene datos personales sensibles. Su uso
          está restringido a la entrega a la <strong>autoridad competente</strong> (policía o
          justicia) ante un requerimiento legal. No debe entregarse a particulares.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-xl font-bold text-gray-900">Dossier de identidad</h2>
        <p className="mt-1 text-xs text-gray-400">
          Generado el {formatDate(new Date())} · Reven
        </p>

        {/* Datos de cuenta */}
        <section className="mt-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Datos de la cuenta
          </h3>
          <dl className="mt-2 grid grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
            <Row label="Nombre y apellido" value={`${u.firstName} ${u.lastName}`} />
            <Row label="Email" value={u.email} />
            <Row label="Ubicación declarada" value={`${u.city}, ${u.province}`} />
            <Row label="Miembro desde" value={formatDate(u.createdAt)} />
            <Row label="Estado de verificación" value={u.verification} />
            <Row label="ID interno" value={u.id} />
          </dl>
        </section>

        {/* Verificación de identidad */}
        <section className="mt-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Verificación de identidad
          </h3>
          {v ? (
            <>
              <dl className="mt-2 grid grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
                <Row label="Número de DNI" value={dni || "—"} />
                <Row label="Resultado" value={v.status} />
                <Row label="Liveness score" value={pct(v.livenessScore)} />
                <Row label="Match score (selfie vs DNI)" value={pct(v.matchScore)} />
                <Row label="Método" value={v.provider} />
                <Row label="Enviado" value={formatDate(v.createdAt)} />
                {v.reviewedAt && <Row label="Revisado" value={formatDate(v.reviewedAt)} />}
              </dl>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {images.map((img) => (
                  <div key={img.label}>
                    <p className="mb-1 text-xs font-medium text-gray-500">{img.label}</p>
                    {img.src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img.src}
                        alt={img.label}
                        className="w-full rounded-lg border border-gray-200"
                      />
                    ) : (
                      <div className="flex h-24 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
                        Sin imagen
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-2 text-sm text-gray-400">El usuario no completó la verificación.</p>
          )}
        </section>

        {/* Denuncias en su contra */}
        <section className="mt-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Denuncias recibidas ({reports.length})
          </h3>
          {reports.length === 0 ? (
            <p className="mt-2 text-sm text-gray-400">Sin denuncias.</p>
          ) : (
            <ul className="mt-2 space-y-2 text-sm">
              {reports.map((r) => (
                <li key={r.id} className="rounded-lg border border-gray-100 p-2">
                  <span className="font-medium">{r.listing.title}</span> · {r.reason} · {r.status}
                  {r.details && <span className="text-gray-500"> — “{r.details}”</span>}
                  <span className="block text-xs text-gray-400">{formatDate(r.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Publicaciones */}
        <section className="mt-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Publicaciones ({u.listings.length})
          </h3>
          {u.listings.length === 0 ? (
            <p className="mt-2 text-sm text-gray-400">Sin publicaciones.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {u.listings.map((l) => (
                <li key={l.id}>
                  <span className="font-medium">{l.title}</span> · {l.status} ·{" "}
                  <span className="text-gray-400">{formatDate(l.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-gray-400">{label}</dt>
      <dd className="font-medium text-gray-900">{value}</dd>
    </div>
  );
}
