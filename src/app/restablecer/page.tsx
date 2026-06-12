import { Suspense } from "react";
import { ResetForm } from "@/components/auth/ResetForm";

export const metadata = { title: "Nueva contraseña" };

export default function ResetPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold">Crear nueva contraseña</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-stone-400">Elegí una contraseña segura (mín. 8 caracteres).</p>
      <div className="card mt-6 p-6">
        <Suspense>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
