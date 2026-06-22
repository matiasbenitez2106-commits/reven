import Link from "next/link";
import { BadgeCheck, XCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { consumeAuthToken } from "@/lib/tokens";
import { SessionRefresh } from "@/components/SessionRefresh";

export const metadata = { title: "Verificar email" };
export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams?.token;
  let ok = false;

  if (token) {
    const userId = await consumeAuthToken(token, "EMAIL_VERIFY");
    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: { emailVerified: new Date() },
      });
      ok = true;
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <div className="card flex flex-col items-center gap-3 p-8 text-center">
        {ok ? (
          <>
            <SessionRefresh />
            <BadgeCheck className="h-12 w-12 text-green-600 dark:text-green-400" />
            <h1 className="text-xl font-bold">¡Email verificado!</h1>
            <p className="text-sm text-gray-500 dark:text-stone-400">
              Tu email quedó confirmado. Ya podés usar trato con normalidad.
            </p>
          </>
        ) : (
          <>
            <XCircle className="h-12 w-12 text-red-500" />
            <h1 className="text-xl font-bold">No pudimos verificar el email</h1>
            <p className="text-sm text-gray-500 dark:text-stone-400">
              El link es inválido o ya venció. Iniciá sesión y pedí reenviar el email de
              verificación desde el aviso superior.
            </p>
          </>
        )}
        <div className="mt-2 flex gap-3">
          <Link href="/" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            Ir al inicio
          </Link>
          <Link href="/ingresar" className="rounded-lg border border-line dark:border-stone-700 px-4 py-2 text-sm font-medium hover:bg-surface-hover dark:hover:bg-stone-800">
            Ingresar
          </Link>
        </div>
      </div>
    </div>
  );
}
