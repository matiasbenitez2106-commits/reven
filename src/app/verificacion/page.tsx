import { redirect } from "next/navigation";
import Link from "next/link";
import { BadgeCheck, Clock, ShieldX, ShieldCheck } from "lucide-react";
import { getCurrentDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VerificationFlow } from "@/components/verification/VerificationFlow";

export const metadata = { title: "Verificación de identidad" };

export default async function VerificationPage() {
  const user = await getCurrentDbUser();
  if (!user) redirect("/ingresar");

  const detail = await prisma.verification.findUnique({
    where: { userId: user.id },
    select: { rejectionReason: true, reviewedAt: true },
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-center gap-2">
        <ShieldCheck className="h-6 w-6 text-brand-600" />
        <h1 className="text-2xl font-bold">Verificación de identidad</h1>
      </div>

      {user.verification === "VERIFIED" && (
        <div className="card flex flex-col items-center gap-3 p-8 text-center">
          <BadgeCheck className="h-12 w-12 text-green-600" />
          <h2 className="text-lg font-semibold">¡Tu identidad está verificada!</h2>
          <p className="text-sm text-gray-500">
            Ya podés publicar artículos y contactar vendedores.
          </p>
          <div className="mt-2 flex gap-3">
            <Link href="/publicar" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              Publicar un artículo
            </Link>
            <Link href="/" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">
              Explorar
            </Link>
          </div>
        </div>
      )}

      {user.verification === "PENDING" && (
        <div className="card flex flex-col items-center gap-3 p-8 text-center">
          <Clock className="h-12 w-12 text-yellow-500" />
          <h2 className="text-lg font-semibold">Estamos revisando tu identidad</h2>
          <p className="max-w-sm text-sm text-gray-500">
            Recibimos tu documentación. La verificación puede demorar un poco. Te
            avisaremos cuando esté lista.
          </p>
        </div>
      )}

      {(user.verification === "UNVERIFIED" || user.verification === "REJECTED") && (
        <>
          {user.verification === "REJECTED" && (
            <div className="mb-6 flex items-start gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-700">
              <ShieldX className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-medium">Tu verificación fue rechazada.</p>
                {detail?.rejectionReason && <p>{detail.rejectionReason}</p>}
                <p className="mt-1">Podés volver a intentarlo con fotos más nítidas.</p>
              </div>
            </div>
          )}

          <div className="mb-6 rounded-lg bg-brand-50 p-4 text-sm text-brand-900">
            <p className="font-medium">¿Por qué verificamos identidad?</p>
            <p className="mt-1">
              Reven es una comunidad de personas reales. Verificar tu identidad genera
              confianza y reduce estafas. Tus datos se guardan{" "}
              <strong>encriptados</strong> y no se muestran públicamente.
            </p>
          </div>

          <VerificationFlow />
        </>
      )}
    </div>
  );
}
