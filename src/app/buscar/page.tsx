import Link from "next/link";
import { SearchX, ChevronLeft, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/auth";
import { searchSchema } from "@/lib/validations";
import { searchListings } from "@/lib/listings";
import { ListingCard } from "@/components/listings/ListingCard";
import { SearchFilters } from "@/components/search/SearchFilters";
import { SortSelect } from "@/components/search/SortSelect";

export const metadata = { title: "Buscar" };

type SP = { [key: string]: string | string[] | undefined };

function hrefWithPage(raw: Record<string, string>, page: number): string {
  const params = new URLSearchParams(raw);
  params.set("page", String(page));
  return `/buscar?${params.toString()}`;
}

export default async function BuscarPage({ searchParams }: { searchParams: SP }) {
  // Normaliza a strings
  const raw: Record<string, string> = {};
  for (const [k, v] of Object.entries(searchParams)) {
    if (typeof v === "string") raw[k] = v;
  }

  const parsed = searchSchema.safeParse(raw);
  const params = parsed.success ? parsed.data : searchSchema.parse({});

  // Fallback de ubicación: perfil del usuario si pide cercanía sin coords
  if (
    (params.lat == null || params.lng == null) &&
    (params.sort === "nearest" || params.distance != null)
  ) {
    const user = await getCurrentDbUser();
    if (user?.latitude != null && user?.longitude != null) {
      params.lat = user.latitude;
      params.lng = user.longitude;
    }
  }

  const [result, categories] = await Promise.all([
    searchListings(params),
    prisma.category.findMany({ orderBy: { order: "asc" }, select: { slug: true, name: true } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <SearchFilters categories={categories} />
        </aside>

        <section>
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-sm text-gray-500 dark:text-stone-400">
              {result.total} resultado{result.total === 1 ? "" : "s"}
              {params.q ? (
                <>
                  {" "}para <span className="font-medium text-gray-700 dark:text-stone-200">“{params.q}”</span>
                </>
              ) : null}
            </p>
            <SortSelect />
          </div>

          {result.items.length === 0 ? (
            <div className="card flex flex-col items-center gap-3 p-12 text-center">
              <SearchX className="h-12 w-12 text-gray-300 dark:text-stone-600" />
              <p className="font-medium">No encontramos resultados</p>
              <p className="text-sm text-gray-500 dark:text-stone-400">Probá con otras palabras o sacá algunos filtros.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {result.items.map((item) => (
                  <ListingCard key={item.id} item={item} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  {result.page > 1 && (
                    <Link
                      href={hrefWithPage(raw, result.page - 1)}
                      className="inline-flex items-center gap-1 rounded-lg border border-line dark:border-stone-700 bg-surface dark:bg-stone-900 px-3 py-2 text-sm hover:bg-surface-hover dark:hover:bg-stone-800"
                    >
                      <ChevronLeft className="h-4 w-4" /> Anterior
                    </Link>
                  )}
                  <span className="px-2 text-sm text-gray-500 dark:text-stone-400">
                    Página {result.page} de {totalPages}
                  </span>
                  {result.hasMore && (
                    <Link
                      href={hrefWithPage(raw, result.page + 1)}
                      className="inline-flex items-center gap-1 rounded-lg border border-line dark:border-stone-700 bg-surface dark:bg-stone-900 px-3 py-2 text-sm hover:bg-surface-hover dark:hover:bg-stone-800"
                    >
                      Siguiente <ChevronRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
