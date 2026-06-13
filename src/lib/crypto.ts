import crypto from "crypto";

// Encriptación simétrica AES-256-GCM para datos sensibles de verificación
// (Nº de DNI, URLs de imágenes de documentos, etc.).
//
// ENCRYPTION_KEY debe ser una clave de 32 bytes en hex (64 caracteres).
// Generala con:  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // recomendado para GCM

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "ENCRYPTION_KEY no está definida. Es necesaria para guardar datos de verificación de forma segura."
    );
  }
  const key = Buffer.from(raw, "hex");
  if (key.length !== 32) {
    throw new Error(
      "ENCRYPTION_KEY debe ser una clave de 32 bytes en hexadecimal (64 caracteres)."
    );
  }
  return key;
}

/**
 * Encripta un texto plano. Devuelve un string "iv:authTag:ciphertext" en base64.
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

/**
 * Desencripta un string generado por encrypt(). Devuelve el texto plano.
 */
export function decrypt(payload: string): string {
  const key = getKey();
  const [ivB64, tagB64, dataB64] = payload.split(":");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Formato de dato encriptado inválido.");
  }
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(tagB64, "base64");
  const data = Buffer.from(dataB64, "base64");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString("utf8");
}

/** Encripta opcionalmente (null-safe). */
export function encryptNullable(value: string | null | undefined): string | null {
  return value ? encrypt(value) : null;
}

/** Desencripta opcionalmente (null-safe). */
export function decryptNullable(value: string | null | undefined): string | null {
  return value ? decrypt(value) : null;
}

/**
 * Hash determinístico (HMAC-SHA256 con la clave secreta) para comparar valores
 * sensibles sin guardarlos en claro. A diferencia de `encrypt`, el mismo input
 * siempre da el mismo output → sirve para detectar duplicados (p.ej. "este DNI
 * ya tiene cuenta"). El HMAC con clave evita que un Nº de DNI (baja entropía)
 * se pueda fuerza-brutear desde el hash sin conocer la clave.
 */
export function hashSensitive(value: string): string {
  return crypto.createHmac("sha256", getKey()).update(value.trim()).digest("hex");
}
