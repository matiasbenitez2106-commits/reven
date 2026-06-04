"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { AlertCircle, MapPin, Check } from "lucide-react";
import { listingSchema, type ListingInput } from "@/lib/validations";
import { AR_PROVINCES, CONDITION_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { ImageUploader, type UploadedImage } from "./ImageUploader";

interface Props {
  categories: { id: string; name: string }[];
  listingId?: string;
  initial?: Partial<ListingInput> & { images?: UploadedImage[] };
}

export function ListingForm({ categories, listingId, initial }: Props) {
  const router = useRouter();
  const isEdit = Boolean(listingId);
  const [images, setImages] = useState<UploadedImage[]>(initial?.images ?? []);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    initial?.latitude != null && initial?.longitude != null
      ? { lat: initial.latitude, lng: initial.longitude }
      : null
  );
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ListingInput>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: initial?.title ?? "",
      description: initial?.description ?? "",
      price: initial?.price ?? undefined,
      categoryId: initial?.categoryId ?? "",
      condition: initial?.condition ?? undefined,
      province: initial?.province ?? "",
      city: initial?.city ?? "",
      neighborhood: initial?.neighborhood ?? "",
      latitude: initial?.latitude ?? null,
      longitude: initial?.longitude ?? null,
      images: initial?.images ?? [],
    },
  });

  // Mantiene sincronizadas las imágenes con el form (para validación)
  useEffect(() => {
    setValue("images", images, { shouldValidate: false });
  }, [images, setValue]);

  function useMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        setValue("latitude", lat);
        setValue("longitude", lng);
      },
      () => setServerError("No pudimos obtener tu ubicación.")
    );
  }

  async function onValid(data: ListingInput) {
    setServerError(null);
    const payload = { ...data, images, latitude: coords?.lat ?? null, longitude: coords?.lng ?? null };
    const res = await fetch(isEdit ? `/api/listings/${listingId}` : "/api/listings", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setServerError(j.error || "No se pudo guardar la publicación.");
      return;
    }
    const j = await res.json();
    router.push(`/articulos/${isEdit ? listingId : j.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onValid)} className="space-y-6">
      {serverError && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {serverError}
        </div>
      )}

      {/* Fotos */}
      <section className="card p-5">
        <h2 className="mb-3 font-semibold">Fotos</h2>
        <ImageUploader value={images} onChange={setImages} />
        {errors.images && <p className="field-error">{errors.images.message as string}</p>}
      </section>

      {/* Datos del artículo */}
      <section className="card space-y-4 p-5">
        <h2 className="font-semibold">Datos del artículo</h2>

        <div>
          <label className="label" htmlFor="title">Título</label>
          <input id="title" className="input" placeholder="Ej: Bicicleta rodado 29" {...register("title")} />
          {errors.title && <p className="field-error">{errors.title.message}</p>}
        </div>

        <div>
          <label className="label" htmlFor="description">Descripción</label>
          <textarea
            id="description"
            rows={5}
            className="input"
            placeholder="Contá el estado, antigüedad, motivo de venta, etc."
            {...register("description")}
          />
          {errors.description && <p className="field-error">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="price">Precio (ARS)</label>
            <input id="price" type="number" min={0} step={1} className="input" placeholder="0" {...register("price")} />
            {errors.price && <p className="field-error">{errors.price.message}</p>}
          </div>
          <div>
            <label className="label" htmlFor="categoryId">Categoría</label>
            <select id="categoryId" className="input" defaultValue={initial?.categoryId ?? ""} {...register("categoryId")}>
              <option value="" disabled>Elegí...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.categoryId && <p className="field-error">{errors.categoryId.message}</p>}
          </div>
          <div>
            <label className="label" htmlFor="condition">Condición</label>
            <select id="condition" className="input" defaultValue={initial?.condition ?? ""} {...register("condition")}>
              <option value="" disabled>Elegí...</option>
              {Object.entries(CONDITION_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            {errors.condition && <p className="field-error">{errors.condition.message}</p>}
          </div>
        </div>
      </section>

      {/* Ubicación */}
      <section className="card space-y-4 p-5">
        <h2 className="font-semibold">Ubicación</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="province">Provincia</label>
            <select id="province" className="input" defaultValue={initial?.province ?? ""} {...register("province")}>
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
          <div>
            <label className="label" htmlFor="neighborhood">Barrio (opcional)</label>
            <input id="neighborhood" className="input" placeholder="Ej: Centro" {...register("neighborhood")} />
          </div>
        </div>
        <button
          type="button"
          onClick={useMyLocation}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
        >
          {coords ? <Check className="h-4 w-4 text-green-600" /> : <MapPin className="h-4 w-4" />}
          {coords ? "Ubicación capturada" : "Usar mi ubicación actual (mejora la búsqueda por cercanía)"}
        </button>
      </section>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {isEdit ? "Guardar cambios" : "Publicar artículo"}
        </Button>
      </div>
    </form>
  );
}
