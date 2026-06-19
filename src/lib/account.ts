import { prisma } from "./prisma";
import { decryptNullable } from "./crypto";
import {
  deleteImage,
  deletePrivateImage,
  isCloudinaryConfigured,
  isCloudinaryPublicId,
  publicIdFromUrl,
} from "./storage";

// Helpers de ciclo de vida de datos (derecho de supresión + minimización).
// Borran tanto los registros de la base como las imágenes reales en Cloudinary,
// que NO se eliminan con el borrado en cascada de Prisma.

/** Campos encriptados de imágenes de una verificación. */
interface VerificationImageFields {
  dniFrontUrlEnc?: string | null;
  dniBackUrlEnc?: string | null;
  selfieUrlEnc?: string | null;
}

/** ¿El valor luce como un publicId de Cloudinary (no una ruta local ni una URL)? */
function looksLikeCloudinaryAsset(v: string): boolean {
  return !v.startsWith("/") && !/^https?:\/\//.test(v);
}

/**
 * Borra de Cloudinary las imágenes privadas de una verificación (DNI + selfie).
 * Best-effort (no lanza): se usa para limpiar el intento ANTERIOR al reenviar.
 * Loguea los borrados que fallen para poder auditarlos.
 */
export async function purgeVerificationImages(v: VerificationImageFields): Promise<void> {
  const ids = [v.dniFrontUrlEnc, v.dniBackUrlEnc, v.selfieUrlEnc]
    .map((enc) => decryptNullable(enc))
    .filter((val): val is string => !!val && isCloudinaryPublicId(val));
  const results = await Promise.allSettled(ids.map((id) => deletePrivateImage(id)));
  results.forEach((r, i) => {
    if (r.status === "rejected" || (r.status === "fulfilled" && r.value === false)) {
      console.error(`No se pudo purgar la imagen de verificación ${ids[i]}`);
    }
  });
}

/**
 * Elimina por completo la cuenta de un usuario y todos sus datos:
 * 1) borra de Cloudinary las imágenes SENSIBLES de verificación (DNI/selfie) de forma
 *    ESTRICTA: si no se pueden borrar, lanza y NO elimina la cuenta (no podemos prometer
 *    la supresión si las imágenes siguen en el servidor);
 * 2) borra las fotos de las publicaciones y el avatar (best-effort, con logging);
 * 3) borra el registro del usuario, lo que en cascada elimina verificación,
 *    publicaciones, mensajes, conversaciones, favoritos, denuncias, pagos,
 *    suscripción, tokens y notificaciones.
 */
export async function deleteUserAccount(
  userId: string,
  opts?: { requireNoOpenReports?: boolean }
): Promise<void> {
  // BARRERA (última, antes de destruir nada): si el llamador lo pide, re-verificamos
  // denuncias abiertas JUSTO acá. Si hay alguna, cortamos sin tocar Cloudinary ni la base
  // (cierra la ventana TOCTOU del robot). Ver docs/plan-borrado-dos-fases.md.
  if (opts?.requireNoOpenReports) {
    const open = await prisma.report.count({
      where: { status: "PENDING", listing: { sellerId: userId } },
    });
    if (open > 0) {
      throw new Error(
        `No se puede borrar: la cuenta tiene ${open} denuncia(s) abierta(s). Se mantiene para revisión.`
      );
    }
  }

  const [verification, listingImages, user] = await Promise.all([
    prisma.verification.findUnique({
      where: { userId },
      select: { dniFrontUrlEnc: true, dniBackUrlEnc: true, selfieUrlEnc: true },
    }),
    prisma.listingImage.findMany({
      where: { listing: { sellerId: userId } },
      select: { publicId: true },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { avatarUrl: true } }),
  ]);

  // 1) Imágenes sensibles de verificación → borrado ESTRICTO.
  if (verification) {
    const values = [
      verification.dniFrontUrlEnc,
      verification.dniBackUrlEnc,
      verification.selfieUrlEnc,
    ]
      .map((enc) => decryptNullable(enc))
      .filter((v): v is string => !!v);
    const cloudIds = values.filter(looksLikeCloudinaryAsset);

    if (cloudIds.length > 0 && !isCloudinaryConfigured()) {
      // Hay imágenes en Cloudinary pero no podemos operar sobre él: no mentimos sobre el borrado.
      throw new Error(
        "El almacenamiento de imágenes no está disponible; no podemos completar el borrado de tus datos ahora. Probá de nuevo más tarde."
      );
    }
    for (const id of cloudIds) {
      const ok = await deletePrivateImage(id);
      if (!ok) {
        throw new Error(
          "No se pudieron borrar todas tus imágenes de verificación. Intentá de nuevo en un momento."
        );
      }
    }
  }

  // 2) Fotos de publicaciones + avatar → best-effort (públicas, menos sensibles).
  const tasks: Promise<boolean>[] = [];
  for (const img of listingImages) {
    if (img.publicId) tasks.push(deleteImage(img.publicId));
  }
  const avatarId = publicIdFromUrl(user?.avatarUrl);
  if (avatarId) tasks.push(deleteImage(avatarId));
  const results = await Promise.allSettled(tasks);
  const failed = results.filter(
    (r) => r.status === "rejected" || (r.status === "fulfilled" && r.value === false)
  ).length;
  if (failed > 0) {
    console.error(`Borrado de cuenta ${userId}: ${failed} imágenes públicas no se pudieron borrar.`);
  }

  // 3) Borrado de la base (cascade elimina el resto de las tablas).
  await prisma.user.delete({ where: { id: userId } });
}
