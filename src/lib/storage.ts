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

/**
 * Sube una imagen SENSIBLE (DNI, selfie) con entrega PRIVADA.
 * En Cloudinary usa `type: "authenticated"`: el archivo NO es accesible por su URL
 * pública ni navegando la carpeta; solo se puede ver con una URL firmada (ver
 * `signedImageUrl`). Devuelve el publicId, que es lo que se guarda (encriptado) en la BD.
 *
 * Fallback local (sin Cloudinary): guarda en /public/uploads — solo apto para desarrollo.
 */
export async function uploadPrivateImage(
  dataUri: string,
  folder = "verification"
): Promise<UploadResult> {
  if (isCloudinaryConfigured()) {
    const res = await cloudinary.uploader.upload(dataUri, {
      folder: `reven/${folder}`,
      resource_type: "image",
      type: "authenticated", // entrega privada (requiere URL firmada)
      transformation: [{ quality: "auto" }],
    });
    return { url: res.secure_url, publicId: res.public_id };
  }
  return saveLocally(dataUri, folder);
}

/**
 * Genera una URL firmada para ver un asset privado (`type: "authenticated"`).
 * La firma se deriva del publicId + API secret, así que la URL no es adivinable.
 * Pensada para usarse solo desde endpoints restringidos a admin.
 */
export function signedImageUrl(publicId: string, ttlSeconds = 300): string {
  return cloudinary.url(publicId, {
    type: "authenticated",
    resource_type: "image",
    secure: true,
    sign_url: true,
    // La URL firmada EXPIRA (por defecto 5 min): aunque se filtre el link del
    // dossier de identidad, deja de servir el DNI poco después.
    expires_at: Math.floor(Date.now() / 1000) + ttlSeconds,
  });
}

/** ¿El valor guardado es un publicId de Cloudinary (no una URL/ruta legacy)? */
export function isCloudinaryPublicId(value: string): boolean {
  return isCloudinaryConfigured() && !/^(https?:)?\/\//.test(value) && !value.startsWith("/");
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

/**
 * Borra una imagen PÚBLICA de Cloudinary por su publicId.
 * Devuelve true si se borró o no había nada que borrar; false si la operación falló.
 */
export async function deleteImage(publicId: string | null): Promise<boolean> {
  if (!publicId || !isCloudinaryConfigured()) return true; // nada que borrar
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (err) {
    console.error("No se pudo borrar la imagen de Cloudinary:", err);
    return false;
  }
}

/**
 * Borra una imagen PRIVADA (type "authenticated") de Cloudinary por su publicId.
 * Devuelve true si se borró o no había nada que borrar; false si la operación falló.
 */
export async function deletePrivateImage(publicId: string | null): Promise<boolean> {
  if (!publicId || !isCloudinaryConfigured()) return true;
  try {
    await cloudinary.uploader.destroy(publicId, { type: "authenticated" });
    return true;
  } catch (err) {
    console.error("No se pudo borrar la imagen privada de Cloudinary:", err);
    return false;
  }
}

/**
 * Extrae el publicId de una URL de Cloudinary (para poder borrar el avatar, que
 * se guarda como URL y no como publicId). Devuelve null si no parece de Cloudinary.
 */
export function publicIdFromUrl(url: string | null | undefined): string | null {
  if (!url || !url.includes("res.cloudinary.com")) return null;
  // .../image/upload/<transformaciones?>/v123/<publicId>.<ext>
  const withVersion = url.match(/\/upload\/(?:[^/]+\/)*?v\d+\/(.+)\.[a-zA-Z0-9]+$/);
  if (withVersion) return withVersion[1]!;
  const noVersion = url.match(/\/upload\/(.+)\.[a-zA-Z0-9]+$/);
  return noVersion ? noVersion[1]!.replace(/^v\d+\//, "") : null;
}
