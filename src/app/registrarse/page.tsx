import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata = { title: "Crear cuenta" };

export default async function RegisterPage() {
  const session = await getSession();
  if (session) redirect("/");

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12">
      <h1 className="text-2xl font-bold">Crear cuenta</h1>
      <p className="mt-1 text-sm text-gray-500">
        ¿Ya tenés cuenta?{" "}
        <Link href="/ingresar" className="font-medium text-brand-600 hover:underline">
          Ingresá
        </Link>
      </p>

      <div className="card mt-6 p-6">
        <RegisterForm />
      </div>

      <p className="mt-4 text-center text-xs text-gray-400">
        Al registrarte aceptás nuestros términos. Para publicar o contactar vendedores
        vas a necesitar verificar tu identidad.
      </p>
    </div>
  );
}
