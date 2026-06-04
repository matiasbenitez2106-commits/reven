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
        <ShieldCheck className="h-6 w-6 text-brand-600" />
        <h1 className="text-2xl font-bold">Panel de administración</h1>
      </div>
      <nav className="mb-6 flex gap-1 border-b border-gray-200 text-sm">
        <Link href="/admin" className="border-b-2 border-transparent px-3 py-2 font-medium text-gray-600 hover:border-gray-300 hover:text-gray-900">
          Resumen
        </Link>
        <Link href="/admin/reportes" className="border-b-2 border-transparent px-3 py-2 font-medium text-gray-600 hover:border-gray-300 hover:text-gray-900">
          Denuncias
        </Link>
        <Link href="/admin/verificaciones" className="border-b-2 border-transparent px-3 py-2 font-medium text-gray-600 hover:border-gray-300 hover:text-gray-900">
          Verificaciones
        </Link>
      </nav>
      {children}
    </div>
  );
}
