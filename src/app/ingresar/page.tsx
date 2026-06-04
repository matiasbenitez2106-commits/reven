import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = { title: "Ingresar" };

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/");

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12">
      <h1 className="text-2xl font-bold">Ingresar</h1>
      <p className="mt-1 text-sm text-gray-500">
        ¿No tenés cuenta?{" "}
        <Link href="/registrarse" className="font-medium text-brand-600 hover:underline">
          Creá una gratis
        </Link>
      </p>

      <div className="card mt-6 p-6">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>

      <div className="mt-4 rounded-lg bg-brand-50 p-3 text-xs text-brand-800">
        <p className="font-medium">Cuenta de prueba (seed):</p>
        <p>demo@reven.ar · demo1234 — usuario verificado</p>
      </div>
    </div>
  );
}
