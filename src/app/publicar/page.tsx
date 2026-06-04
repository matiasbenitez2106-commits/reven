import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { getCurrentDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ListingForm } from "@/components/listings/ListingForm";

export const metadata = { title: "Publicar artículo" };

export default async function PublishPage() {
  const user = await getCurrentDbUser();
  if (!user) redirect("/ingresar?callbackUrl=/publicar");

  if (user.verification !== "VERIFIED") {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <div className="card flex flex-col items-center gap-3 p-8 text-center">
          <ShieldAlert className="h-12 w-12 text-yellow-500" />
          <h1 className="text-xl font-bold">Verificá tu identidad para publicar</h1>
          <p className="text-sm text-gray-500">
            Para mantener la comunidad segura, solo las personas verificadas pueden
            publicar artículos. Es rápido.
          </p>
          <Link
            href="/verificacion"
            className="mt-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Verificar mi identidad
          </Link>
        </div>
      </div>
    );
  }

  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Publicar artículo</h1>
      <p className="mt-1 text-sm text-gray-500">Es gratis y sin comisiones por venta.</p>
      <div className="mt-6">
        <ListingForm categories={categories} />
      </div>
    </div>
  );
}
