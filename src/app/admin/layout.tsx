import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center gap-2">
        <ShieldCheck className="h-6 w-6 text-brand-600 dark:text-brand-300" />
        <h1 className="text-2xl font-bold">Panel de administración</h1>
      </div>
      <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-line dark:border-stone-800 text-sm">
        {[
          { href: "/admin", label: "Resumen" },
          { href: "/admin/usuarios", label: "Usuarios" },
          { href: "/admin/publicaciones", label: "Publicaciones" },
          { href: "/admin/reportes", label: "Denuncias" },
          { href: "/admin/verificaciones", label: "Verificaciones" },
          { href: "/admin/soporte", label: "Soporte" },
          { href: "/admin/sistema", label: "Sistema" },
        ].map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="whitespace-nowrap border-b-2 border-transparent px-3 py-2 font-medium text-gray-600 dark:text-stone-300 hover:border-line dark:hover:border-stone-600 hover:text-gray-900 dark:hover:text-stone-100"
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
