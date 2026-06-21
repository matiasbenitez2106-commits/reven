"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import { AR_PROVINCES } from "@/lib/constants";
import { Button } from "@/components/ui/Button";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [acceptError, setAcceptError] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(data: RegisterInput) {
    setError(null);
    if (!accepted) {
      setAcceptError(true);
      return;
    }
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "No se pudo crear la cuenta.");
      return;
    }

    // Auto-login tras registrarse
    const login = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });
    if (login?.error) {
      router.push("/ingresar");
      return;
    }
    router.push("/verificacion");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="firstName">Nombre</label>
          <input id="firstName" className="input" {...register("firstName")} />
          {errors.firstName && <p className="field-error">{errors.firstName.message}</p>}
        </div>
        <div>
          <label className="label" htmlFor="lastName">Apellido</label>
          <input id="lastName" className="input" {...register("lastName")} />
          {errors.lastName && <p className="field-error">{errors.lastName.message}</p>}
        </div>
      </div>

      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" type="email" className="input" {...register("email")} />
        {errors.email && <p className="field-error">{errors.email.message}</p>}
      </div>

      <div>
        <label className="label" htmlFor="password">Contraseña</label>
        <input id="password" type="password" className="input" {...register("password")} />
        {errors.password && <p className="field-error">{errors.password.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="province">Provincia</label>
          <select id="province" className="input" defaultValue="" {...register("province")}>
            <option value="" disabled>Elegí...</option>
            {AR_PROVINCES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          {errors.province && <p className="field-error">{errors.province.message}</p>}
        </div>
        <div>
          <label className="label" htmlFor="city">Ciudad</label>
          <input id="city" className="input" placeholder="Ej: Rosario" {...register("city")} />
          {errors.city && <p className="field-error">{errors.city.message}</p>}
        </div>
      </div>

      <div>
        <label className="flex items-start gap-2 text-sm text-gray-600 dark:text-stone-300">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => {
              setAccepted(e.target.checked);
              if (e.target.checked) setAcceptError(false);
            }}
            className="mt-0.5 h-4 w-4 rounded border-line dark:border-stone-700 text-brand-600 dark:text-brand-300 focus:ring-brand-500"
          />
          <span>
            Soy mayor de 18 años y acepto los{" "}
            <Link href="/terminos" target="_blank" className="text-brand-600 dark:text-brand-300 hover:underline">
              Términos y Condiciones
            </Link>{" "}
            y la{" "}
            <Link href="/privacidad" target="_blank" className="text-brand-600 dark:text-brand-300 hover:underline">
              Política de Privacidad
            </Link>
            .
          </span>
        </label>
        {acceptError && (
          <p className="field-error">Tenés que aceptar los términos para crear la cuenta.</p>
        )}
      </div>

      <Button type="submit" loading={isSubmitting} className="w-full">
        Crear cuenta
      </Button>
    </form>
  );
}
