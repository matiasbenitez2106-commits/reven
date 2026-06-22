"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AlertCircle, Camera, Check } from "lucide-react";
import { profileSchema, type ProfileInput } from "@/lib/validations";
import { AR_PROVINCES } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { resizeImage } from "@/lib/image-client";

export function EditProfileForm({
  initial,
}: {
  initial: {
    firstName: string;
    lastName: string;
    province: string;
    city: string;
    avatarUrl: string | null;
  };
}) {
  const router = useRouter();
  const { update } = useSession();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initial.avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: initial.firstName,
      lastName: initial.lastName,
      province: initial.province,
      city: initial.city,
    },
  });

  async function onAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const dataUrl = await resizeImage(file, 512, 0.85);
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl, folder: "avatars" }),
      });
      if (!res.ok) throw new Error();
      const j = await res.json();
      setAvatarUrl(j.url);
    } catch {
      setError("No se pudo subir la foto.");
    } finally {
      setUploading(false);
    }
  }

  async function onValid(data: ProfileInput) {
    setError(null);
    setSaved(false);
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, avatarUrl }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "No se pudo guardar.");
      return;
    }
    await update();
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onValid)} className="card space-y-4 p-6">
      <h2 className="font-semibold">Editar perfil</h2>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-950/40 p-3 text-sm text-green-700 dark:text-green-300">
          <Check className="h-4 w-4 shrink-0" /> Cambios guardados.
        </div>
      )}

      <div className="flex items-center gap-4">
        <Avatar firstName={initial.firstName} lastName={initial.lastName} src={avatarUrl} size={64} />
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line dark:border-stone-700 px-3 py-2 text-sm hover:bg-surface-hover dark:hover:bg-stone-800">
          <Camera className="h-4 w-4" />
          {uploading ? "Subiendo..." : "Cambiar foto"}
          <input type="file" accept="image/*" className="hidden" onChange={onAvatar} />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="firstName">Nombre</label>
          <input id="firstName" className="input" {...register("firstName")} />
          {errors.firstName && <p className="field-error">{errors.firstName.message}</p>}
        </div>
        <div>
          <label className="label" htmlFor="lastName">Apellido</label>
          <input id="lastName" className="input" {...register("lastName")} />
          {errors.lastName && <p className="field-error">{errors.lastName.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="province">Provincia</label>
          <select id="province" className="input" {...register("province")}>
            {AR_PROVINCES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          {errors.province && <p className="field-error">{errors.province.message}</p>}
        </div>
        <div>
          <label className="label" htmlFor="city">Ciudad</label>
          <input id="city" className="input" {...register("city")} />
          {errors.city && <p className="field-error">{errors.city.message}</p>}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" loading={isSubmitting}>Guardar cambios</Button>
      </div>
    </form>
  );
}
