import Link from "next/link";
import { Package } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link href="/" className="flex items-center gap-1 text-lg font-bold text-brand-600">
              <Package className="h-5 w-5" /> Reven
            </Link>
            <p className="mt-2 max-w-xs text-sm text-gray-500">
              Compraventa de usados entre personas verificadas. Sin comisiones.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
            <div>
              <p className="font-medium text-gray-900">Reven</p>
              <ul className="mt-2 space-y-1 text-gray-500">
                <li><Link href="/buscar" className="hover:text-brand-600">Explorar</Link></li>
                <li><Link href="/publicar" className="hover:text-brand-600">Publicar</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-gray-900">Cuenta</p>
              <ul className="mt-2 space-y-1 text-gray-500">
                <li><Link href="/ingresar" className="hover:text-brand-600">Ingresar</Link></li>
                <li><Link href="/registrarse" className="hover:text-brand-600">Crear cuenta</Link></li>
                <li><Link href="/verificacion" className="hover:text-brand-600">Verificación</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-gray-900">Seguridad</p>
              <ul className="mt-2 space-y-1 text-gray-500">
                <li>Identidad verificada</li>
                <li>Datos encriptados</li>
              </ul>
            </div>
          </div>
        </div>
        <p className="mt-8 border-t border-gray-100 pt-6 text-xs text-gray-400">
          © {new Date().getFullYear()} Reven · MVP · Hecho en Argentina 🇦🇷
        </p>
      </div>
    </footer>
  );
}
