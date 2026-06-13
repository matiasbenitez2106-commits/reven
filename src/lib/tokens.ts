import crypto from "crypto";
import { TokenType } from "@prisma/client";
import { prisma } from "./prisma";

// Tiempo de vida de cada tipo de token
const TTL_MS: Record<TokenType, number> = {
  EMAIL_VERIFY: 24 * 60 * 60 * 1000, // 24 horas
  PASSWORD_RESET: 60 * 60 * 1000, // 1 hora
};

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Crea un token de un solo uso y guarda su HASH en la base.
 * Devuelve el token en claro (para el link del email).
 */
export async function createAuthToken(userId: string, type: TokenType): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + TTL_MS[type]);

  // Invalida tokens previos sin usar del mismo tipo para ese usuario
  await prisma.authToken.deleteMany({ where: { userId, type, usedAt: null } });
  await prisma.authToken.create({ data: { userId, type, tokenHash, expiresAt } });

  return token;
}

/**
 * Valida y CONSUME un token (marca usado). Devuelve el userId o null si es
 * inválido, expirado o ya usado.
 */
export async function consumeAuthToken(
  token: string,
  type: TokenType
): Promise<string | null> {
  if (!token) return null;
  const tokenHash = hashToken(token);

  const record = await prisma.authToken.findUnique({ where: { tokenHash } });
  if (!record || record.type !== type || record.usedAt || record.expiresAt < new Date()) {
    return null;
  }

  // Consumo ATÓMICO: la condición `usedAt: null` en el WHERE garantiza que solo
  // una de varias requests concurrentes pueda marcarlo usado (evita la carrera
  // que permitiría usar un token de un solo uso más de una vez).
  const res = await prisma.authToken.updateMany({
    where: { id: record.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (res.count === 0) return null; // otra request ya lo consumió
  return record.userId;
}
