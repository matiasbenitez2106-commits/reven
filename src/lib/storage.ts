import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

// Almacenamiento de imágenes.
// - Si Cloudinary está configurado (CLOUDINARY_*), sube ahí.
// - Si no, en desarrollo guarda en /public/uploads (fallback para correr sin claves).
//
// ⚠️ El fallback local NO es seguro para imágenes de verificación de identidad en
// producción. En producción configurá Cloudinary (idealmente con entrega privada)
// o S3 con buckets privados.

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export interface UploadResult {
  url: string;
  publicId: string | null;
}

/**
 * Sube una imagen a partir de un Data URI (data:image/...;base64,XXXX).
 * @param dataUri  Imagen en formato data URI
 * @param folder   Carpeta lógica (p.ej. "listings" o "verification")
 */
export async function uploadImage(
  dataUri: string,
  folder = "reven"
): Promise<UploadResult> {
  if (isCloudinaryConfigured()) {
    const res = await cloudinary.uploader.upload(dataUri, {
      folder: `reven/${folder}`,
      resource_type: "image",
      transformation: [{ quality: "auto", fetch_format: "auto" }],
    });
    return { url: res.secure_url, publicId: res.public_id };
  }

  // Fallback local (solo desarrollo)
  return saveLocally(dataUri, folder);
}

async function saveLocally(dataUri: string, folder: string): Promise<UploadResult> {
  const match = dataUri.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Data URI de imagen inválido.");
  }
  const mime = match[1];
  const base64 = match[2];
  const ext = mime.split("/")[1].replace("jpeg", "jpg").replace("svg+xml", "svg");
  const buffer = Buffer.from(base64, "base64");

  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await fs.mkdir(dir, { recursive: true });

  const filename = `${crypto.randomUUID()}.${ext}`;
  await fs.writeFile(path.join(dir, filename), buffer);

  return { url: `/uploads/${folder}/${filename}`, publicId: null };
}

/** Borra una imagen de Cloudinary por su publicId (no-op para fallback local). */
export async function deleteImage(publicId: string | null): Promise<void> {
  if (publicId && isCloudinaryConfigured()) {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      console.error("No se pudo borrar la imagen de Cloudinary:", err);
    }
  }
}
