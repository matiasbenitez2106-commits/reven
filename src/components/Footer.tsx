"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Logo } from "./Logo";

export function Footer() {
  const { data: session } = useSession();
  const loggedIn = !!session?.user;

  return (
    <footer className="mt-16 border-t border-line dark:border-stone-800 bg-surface dark:bg-stone-900">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link href="/" className="inline-flex items-center" aria-label="trato — inicio">
              <Logo size="sm" />
            </Link>
            <p className="mt-2 max-w-xs text-sm text-gray-500 dark:text-stone-400">
              Comprá y vendé lo que quieras, entre personas verificadas. Sin comisiones.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
            <div>
              <p className="font-medium text-gray-900 dark:text-stone-100">trato</p>
              <ul className="mt-2 space-y-1 text-gray-500 dark:text-stone-400">
                <li><Link href="/buscar" className="hover:text-brand-700 dark:hover:text-brand-300">Explorar</Link></li>
                <li><Link href="/publicar" className="hover:text-brand-700 dark:hover:text-brand-300">Publicar</Link></li>
                <li><Link href="/contacto" className="hover:text-brand-700 dark:hover:text-brand-300">Contacto / Soporte</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-stone-100">Cuenta</p>
              <ul className="mt-2 space-y-1 text-gray-500 dark:text-stone-400">
                {loggedIn ? (
                  <>
                    <li><Link href="/cuenta" className="hover:text-brand-700 dark:hover:text-brand-300">Mi cuenta</Link></li>
                    <li><Link href="/mis-publicaciones" className="hover:text-brand-700 dark:hover:text-brand-300">Mis publicaciones</Link></li>
                  </>
                ) : (
                  <>
                    <li><Link href="/ingresar" className="hover:text-brand-700 dark:hover:text-brand-300">Ingresar</Link></li>
                    <li><Link href="/registrarse" className="hover:text-brand-700 dark:hover:text-brand-300">Crear cuenta</Link></li>
                  </>
                )}
                <li><Link href="/verificacion" className="hover:text-brand-700 dark:hover:text-brand-300">Verificación</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-stone-100">Legal</p>
              <ul className="mt-2 space-y-1 text-gray-500 dark:text-stone-400">
                <li><Link href="/terminos" className="hover:text-brand-700 dark:hover:text-brand-300">Términos y Condiciones</Link></li>
                <li><Link href="/privacidad" className="hover:text-brand-700 dark:hover:text-brand-300">Política de Privacidad</Link></li>
                <li className="pt-1 text-gray-400 dark:text-stone-500">Identidad verificada · Datos encriptados</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-2 border-t border-line dark:border-stone-800 pt-6 text-xs text-gray-400 dark:text-stone-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} trato · Hecho en Argentina 🇦🇷</p>
          <p className="flex gap-3">
            <Link href="/terminos" className="hover:text-brand-700 dark:hover:text-brand-300">Términos</Link>
            <Link href="/privacidad" className="hover:text-brand-700 dark:hover:text-brand-300">Privacidad</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
