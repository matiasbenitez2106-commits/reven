"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { ImagePlus, X, Star, Loader2, AlertCircle } from "lucide-react";
import { resizeImage } from "@/lib/image-client";
import { MAX_LISTING_IMAGES } from "@/lib/constants";

export interface UploadedImage {
  url: string;
  publicId?: string | null;
}

export function ImageUploader({
  value,
  onChange,
}: {
  value: UploadedImage[];
  onChange: (v: UploadedImage[]) => void;
}) {
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (files: File[]) => {
      setError(null);
      const room = MAX_LISTING_IMAGES - value.length;
      if (room <= 0) {
        setError(`Podés subir hasta ${MAX_LISTING_IMAGES} fotos.`);
        return;
      }
      const toUse = files.slice(0, room);
      setUploading((u) => u + toUse.length);
      const results: UploadedImage[] = [];
      for (const file of toUse) {
        try {
          const dataUrl = await resizeImage(file, 1600, 0.85);
          const res = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: dataUrl, folder: "listings" }),
          });
          if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            setError(j.error || "No se pudo subir una imagen.");
            continue;
          }
          const j = await res.json();
          results.push({ url: j.url, publicId: j.publicId });
        } catch {
          setError("Error procesando una imagen.");
        } finally {
          setUploading((u) => u - 1);
        }
      }
      if (results.length) onChange([...value, ...results]);
    },
    [value, onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    disabled: value.length >= MAX_LISTING_IMAGES,
  });

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function makeCover(index: number) {
    const copy = [...value];
    const [item] = copy.splice(index, 1);
    copy.unshift(item);
    onChange(copy);
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {value.map((img, i) => (
          <div key={img.url} className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
            {i === 0 && (
              <span className="absolute left-1 top-1 rounded bg-brand-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
                Portada
              </span>
            )}
            <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/40 to-transparent p-1 opacity-0 transition group-hover:opacity-100">
              {i !== 0 ? (
                <button
                  type="button"
                  onClick={() => makeCover(i)}
                  title="Usar como portada"
                  className="rounded bg-white/90 p-1 text-gray-700 hover:bg-white"
                >
                  <Star className="h-3.5 w-3.5" />
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={() => remove(i)}
                title="Quitar"
                className="rounded bg-white/90 p-1 text-red-600 hover:bg-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}

        {value.length < MAX_LISTING_IMAGES && (
          <div
            {...getRootProps()}
            className={`flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-center text-xs ${
              isDragActive ? "border-brand-400 bg-brand-50 text-brand-600" : "border-gray-300 text-gray-400 hover:border-brand-300"
            }`}
          >
            <input {...getInputProps()} />
            {uploading > 0 ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Subiendo...</span>
              </>
            ) : (
              <>
                <ImagePlus className="h-6 w-6" />
                <span>Agregar foto</span>
              </>
            )}
          </div>
        )}
      </div>

      <p className="mt-2 text-xs text-gray-400">
        {value.length}/{MAX_LISTING_IMAGES} fotos · Arrastrá y soltá, o tocá para subir. La
        primera es la portada.
      </p>
      {error && (
        <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5" /> {error}
        </p>
      )}
    </div>
  );
}
