"use client";

// Lectura del código de barras PDF417 del DORSO del DNI argentino (en el navegador).
// El PDF417 contiene los datos reales del documento → permite corroborar que el
// número y el nombre coinciden con lo declarado (anti-fraude). Es ASISTIVO: si no
// se puede leer (foto borrosa, recorte), se cae al flujo manual + revisión.

export interface DniData {
  dniNumber: string;
  lastName: string;
  firstName: string;
  gender?: string;
}

/**
 * Parsea el contenido del PDF417 del DNI argentino.
 * Formatos conocidos (campos separados por "@"):
 *  - Nuevo: tramite@APELLIDO@NOMBRE@SEXO@DNI@ejemplar@nacimiento@emision
 *  - Viejo: DNI@APELLIDO@NOMBRE@SEXO@...
 */
export function parseArgDni(text: string): DniData | null {
  if (!text || !text.includes("@")) return null;
  const parts = text.split("@").map((s) => s.trim());
  if (parts.length < 4) return null;

  // Heurística de apellido/nombre: los dos primeros campos alfabéticos.
  const alpha = parts.filter((p) => /[A-Za-zÁÉÍÓÚÑáéíóúñ]/.test(p) && !/^\d+$/.test(p));
  // El nro de DNI: primer campo de 7-8 dígitos (ignora el nro de trámite, más largo).
  let dniNumber = "";
  for (const p of parts) {
    if (/^\d{7,8}$/.test(p)) {
      dniNumber = p;
      break;
    }
  }
  if (!dniNumber) return null;

  const lastName = alpha[0] ?? "";
  const firstName = alpha[1] ?? "";
  const genderField = parts.find((p) => /^[MFX]$/i.test(p));
  return {
    dniNumber,
    lastName,
    firstName,
    gender: genderField ? genderField.toUpperCase() : undefined,
  };
}

/** Intenta leer el PDF417 de una imagen (data URI). Devuelve null si no puede. */
export async function readDniBarcode(dataUrl: string): Promise<DniData | null> {
  try {
    const { BrowserPDF417Reader } = await import("@zxing/library");
    const reader = new BrowserPDF417Reader();
    const result = await reader.decodeFromImageUrl(dataUrl);
    return parseArgDni(result.getText());
  } catch {
    return null; // no se pudo leer → flujo manual
  }
}

/** Compara nombres de forma laxa (acentos, orden, mayúsculas). */
export function nameLooselyMatches(a: string, b: string): boolean {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z\s]/g, "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  const ta = new Set(norm(a));
  const tb = norm(b);
  if (!tb.length || !ta.size) return false;
  const common = tb.filter((t) => ta.has(t)).length;
  return common >= 1; // al menos un nombre/apellido en común
}
