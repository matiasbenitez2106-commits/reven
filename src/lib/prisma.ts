import { PrismaClient } from "@prisma/client";

// Códigos de error de conexión que conviene reintentar.
// Útil con bases serverless (Neon free) que "duermen" y tardan en despertar:
// el primer intento puede fallar con P1001 y el reintento ya conecta.
const RETRYABLE = new Set(["P1001", "P1002", "P1008", "P1017"]);
const MAX_ATTEMPTS = 4;

function createPrisma() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  }).$extends({
    query: {
      async $allOperations({ args, query }) {
        let lastError: unknown;
        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
          try {
            return await query(args);
          } catch (error) {
            const code = (error as { code?: string })?.code;
            if (code && RETRYABLE.has(code) && attempt < MAX_ATTEMPTS - 1) {
              lastError = error;
              // backoff creciente: ~0.8s, 1.5s, 2.5s
              await new Promise((r) => setTimeout(r, 800 + attempt * 800));
              continue;
            }
            throw error;
          }
        }
        throw lastError;
      },
    },
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrisma> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
