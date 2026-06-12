import Link from "next/link";
import { ForgotForm } from "@/components/auth/ForgotForm";

export const metadata = { title: "Recuperar contraseña" };

export default function ForgotPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold">Recuperar contraseña</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-stone-400">
        Ingresá tu email y te mandamos un link para crear una nueva contraseña.
      </p>
      <div className="card mt-6 p-6">
        <ForgotForm />
      </div>
      <p className="mt-4 text-center text-sm">
        <Link href="/ingresar" className="text-brand-600 dark:text-brand-300 hover:underline">
          Volver a ingresar
        </Link>
      </p>
    </div>
  );
}
