// Reconocimiento facial del lado del cliente (browser) con face-api.js.
// Compara la cara del DNI con la de la selfie y mide presencia/expresión.
// Los modelos se cargan del CDN una sola vez. Importar solo desde componentes "use client".

import type * as FaceApi from "@vladmandic/face-api";

let faceapi: typeof FaceApi | null = null;
let modelsLoaded = false;
const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/model";

async function ensure(): Promise<typeof FaceApi> {
  if (!faceapi) faceapi = await import("@vladmandic/face-api");
  if (!modelsLoaded) {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    ]);
    modelsLoaded = true;
  }
  return faceapi;
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

export interface FaceInfo {
  descriptor: Float32Array;
  faceScore: number; // confianza de que hay una cara (0..1)
  smile: number; // probabilidad de sonrisa (0..1)
}

/** Detecta la cara más prominente de una imagen (data URI). null si no encuentra ninguna. */
export async function describeFace(dataUrl: string): Promise<FaceInfo | null> {
  const f = await ensure();
  const img = await loadImage(dataUrl);
  const det = await f
    .detectSingleFace(img, new f.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.3 }))
    .withFaceLandmarks()
    .withFaceExpressions()
    .withFaceDescriptor();
  if (!det) return null;
  return {
    descriptor: det.descriptor,
    faceScore: det.detection.score,
    smile: det.expressions.happy,
  };
}

/** Similitud entre dos caras: 1 = idénticas, 0 = distintas. (distancia < ~0.5 = misma persona) */
export async function faceSimilarity(a: Float32Array, b: Float32Array): Promise<number> {
  const f = await ensure();
  const dist = f.euclideanDistance(a, b);
  const score = 1 - dist / 0.6;
  return Math.max(0, Math.min(1, Math.round(score * 100) / 100));
}

/** Pre-carga los modelos (para llamar apenas el usuario entra al flujo). */
export async function preloadFaceModels(): Promise<void> {
  try {
    await ensure();
  } catch {
    /* si falla, el flujo cae a revisión manual */
  }
}
