// Utilidades de imagen del lado del cliente (browser).
// Importar solo desde componentes "use client".

/** Lee un File como data URI sin procesar. */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Redimensiona/comprime una imagen a un data URI JPEG.
 * Mantiene proporción y limita el lado mayor a maxDim.
 */
export async function resizeImage(
  file: File,
  maxDim = 1280,
  quality = 0.82
): Promise<string> {
  const dataUrl = await fileToDataUrl(file);
  return resizeDataUrl(dataUrl, maxDim, quality);
}

/** Redimensiona un data URI existente (p.ej. capturado de la cámara). */
export function resizeDataUrl(
  dataUrl: string,
  maxDim = 1280,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > height && width > maxDim) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else if (height > maxDim) {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("No se pudo procesar la imagen"));
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}
