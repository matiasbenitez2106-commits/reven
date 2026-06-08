import Link from "next/link";
import { ShieldCheck, Tag, Lock, ArrowRight, UserPlus, ShoppingBag } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { searchListings } from "@/lib/listings";
import { searchSchema } from "@/lib/validations";
import { ListingCard } from "@/components/listings/ListingCard";
import { HomeSearch } from "@/components/search/HomeSearch";

// Contenido dependiente de la DB: render por request (listings siempre frescos)
export const dynamic = "force-dynamic";

export default async function Home() {
  const [result, categories] = await Promise.all([
    searchListings(searchSchema.parse({})),
    prisma.category.findMany({ orderBy: { order: "asc" }, select: { slug: true, name: true } }),
  ]);

  const items = result.items.slice(0, 12);

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-gray-200 bg-gradient-to-b from-brand-50 to-white">
        <div className="mx-auto max-w-4xl px-4 py-14 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Comprá y vendé usado, <span className="text-brand-600">entre personas reales</span>
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-gray-600">
            Trato es la comunidad de compraventa entre particulares verificados de Argentina.
            Publicá gratis, sin comisiones.
          </p>
          <HomeSearch />
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-600">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-brand-600" /> Identidad verificada
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Tag className="h-4 w-4 text-brand-600" /> Sin comisiones
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Lock className="h-4 w-4 text-brand-600" /> Datos encriptados
            </span>
          </div>
        </div>
      </section>

      {/* Categorías */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/buscar?category=${c.slug}`}
              className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm text-gray-700 transition hover:border-brand-300 hover:text-brand-700"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Cómo funciona (onboarding) */}
      <section className="border-y border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <h2 className="text-center text-xl font-bold">Cómo funciona</h2>
          <p className="mt-1 text-center text-sm text-gray-500">
            Empezá a comprar y vender en 3 pasos.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                n: 1,
                icon: UserPlus,
                title: "Creá tu cuenta",
                text: "Registrate gratis con tu email en menos de un minuto.",
              },
              {
                n: 2,
                icon: ShieldCheck,
                title: "Verificá tu identidad",
                text: "Subí tu DNI y una selfie. Así generamos una comunidad de confianza.",
              },
              {
                n: 3,
                icon: ShoppingBag,
                title: "Publicá o comprá",
                text: "Publicá gratis sin comisiones, o contactá vendedores por el chat.",
              },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.n} className="flex flex-col items-center text-center">
                  <div className="relative">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                      {s.n}
                    </span>
                  </div>
                  <h3 className="mt-3 font-semibold">{s.title}</h3>
                  <p className="mt-1 max-w-xs text-sm text-gray-500">{s.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Recientes */}
      <section className="mx-auto max-w-6xl px-4 pb-12 pt-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Publicaciones recientes</h2>
          <Link href="/buscar" className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">
            Ver todas <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="card p-12 text-center text-gray-500">
            <p>Todavía no hay publicaciones. ¡Sé el primero!</p>
            <Link
              href="/publicar"
              className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Publicar un artículo
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {items.map((item) => (
              <ListingCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
