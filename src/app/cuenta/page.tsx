import { redirect } from "next/navigation";
import Link from "next/link";
import { Package, ShieldCheck, MapPin, Mail, Heart, MessageCircle, Pencil, Crown } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/auth";
import { activePlan } from "@/lib/subscriptions";
import { Avatar } from "@/components/ui/Avatar";
import { VerificationBadge } from "@/components/VerificationBadge";
import { ProBadge } from "@/components/ProBadge";
import { DeleteAccountButton } from "@/components/account/DeleteAccountButton";

export const metadata = { title: "Mi cuenta" };

export default async function AccountPage() {
  const user = await getCurrentDbUser();
  if (!user) redirect("/ingresar");

  const [activeCount, soldCount, favCount] = await Promise.all([
    prisma.listing.count({ where: { sellerId: user.id, status: "ACTIVE" } }),
    prisma.listing.count({ where: { sellerId: user.id, status: "SOLD" } }),
    prisma.favorite.count({ where: { userId: user.id } }),
  ]);

  const plan = activePlan(user.proPlan, user.proUntil);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Mi cuenta</h1>

      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar firstName={user.firstName} lastName={user.lastName} src={user.avatarUrl} size={56} />
            <div>
              <p className="text-lg font-semibold">
                {user.firstName} {user.lastName}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <VerificationBadge status={user.verification} />
                {plan && <ProBadge plan={plan} />}
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Miembro desde {new Date(user.createdAt).getFullYear()}
              </p>
            </div>
          </div>
          <Link
            href="/cuenta/editar"
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            <Pencil className="h-3.5 w-3.5" /> Editar
          </Link>
        </div>

        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Mail className="h-4 w-4 text-gray-400" /> {user.email}
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="h-4 w-4 text-gray-400" /> {user.city}, {user.province}
          </div>
        </dl>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link href="/mis-publicaciones" className="card flex items-center gap-3 p-4 hover:bg-gray-50">
          <Package className="h-5 w-5 text-brand-600" />
          <div>
            <p className="text-sm font-medium">Mis publicaciones</p>
            <p className="text-xs text-gray-500">
              {activeCount} activas · {soldCount} vendidas
            </p>
          </div>
        </Link>
        <Link href="/favoritos" className="card flex items-center gap-3 p-4 hover:bg-gray-50">
          <Heart className="h-5 w-5 text-red-500" />
          <div>
            <p className="text-sm font-medium">Favoritos</p>
            <p className="text-xs text-gray-500">{favCount} guardados</p>
          </div>
        </Link>
        <Link href="/mensajes" className="card flex items-center gap-3 p-4 hover:bg-gray-50">
          <MessageCircle className="h-5 w-5 text-brand-600" />
          <span className="text-sm font-medium">Mensajes</span>
        </Link>
        <Link href="/verificacion" className="card flex items-center gap-3 p-4 hover:bg-gray-50">
          <ShieldCheck className="h-5 w-5 text-brand-600" />
          <span className="text-sm font-medium">Verificación de identidad</span>
        </Link>
        <Link href="/suscripcion" className="card flex items-center gap-3 p-4 hover:bg-gray-50">
          <Crown className="h-5 w-5 text-indigo-600" />
          <div>
            <p className="text-sm font-medium">Suscripción de vendedor</p>
            <p className="text-xs text-gray-500">
              {plan ? `Plan ${plan === "PRO_PLUS" ? "PRO+" : "PRO"} activo` : "Hacete PRO"}
            </p>
          </div>
        </Link>
      </div>

      {user.verification !== "VERIFIED" && (
        <p className="mt-4 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
          Verificá tu identidad para publicar y contactar vendedores.{" "}
          <Link href="/verificacion" className="font-medium underline">
            Verificar ahora
          </Link>
        </p>
      )}

      <div className="mt-8">
        <DeleteAccountButton />
      </div>
    </div>
  );
}
