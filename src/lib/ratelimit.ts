import { NextResponse } from "next/server";
import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Rate limiting PLUGGABLE para endpoints sensibles.
// - Si hay Upstash Redis configurado (UPSTASH_REDIS_REST_URL + _TOKEN), usa una
//   ventana deslizante distribuida (confiable entre instancias serverless).
// - Si no, cae a un limitador EN MEMORIA por instancia (suficiente para frenar
//   abuso rápido en un MVP; se reinicia en cold starts y no comparte estado).
//
// Uso típico en un route handler:
//   const limited = await enforceRateLimit(req, "register", RATE_LIMITS.register);
//   if (limited) return limited;

export interface RateLimitConfig {
  /** Cantidad máxima de solicitudes permitidas en la ventana. */
  limit: number;
  /** Ventana en formato Upstash, p.ej. "60 s", "5 m", "1 h". */
  window: Duration;
  /** La misma ventana en milisegundos (para el fallback en memoria). */
  windowMs: number;
}

const min = (n: number) => n * 60_000;

/** Presets por tipo de acción. */
export const RATE_LIMITS = {
  login: { limit: 8, window: "5 m", windowMs: min(5) },
  register: { limit: 5, window: "1 h", windowMs: min(60) },
  passwordReset: { limit: 5, window: "1 h", windowMs: min(60) },
  emailResend: { limit: 5, window: "1 h", windowMs: min(60) },
  verification: { limit: 6, window: "1 h", windowMs: min(60) },
  report: { limit: 12, window: "10 m", windowMs: min(10) },
  message: { limit: 40, window: "1 m", windowMs: min(1) },
  contact: { limit: 20, window: "10 m", windowMs: min(10) },
  upload: { limit: 50, window: "10 m", windowMs: min(10) },
  write: { limit: 40, window: "10 m", windowMs: min(10) },
  deleteAccount: { limit: 5, window: "1 h", windowMs: min(60) },
} satisfies Record<string, RateLimitConfig>;

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number; // epoch ms
}

// ---------- Backend Upstash (opcional) ----------

let redisClient: Redis | null | undefined; // undefined = sin inicializar, null = no configurado

function getRedis(): Redis | null {
  if (redisClient !== undefined) return redisClient;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  redisClient = url && token ? new Redis({ url, token }) : null;
  return redisClient;
}

const upstashLimiters = new Map<string, Ratelimit>();

function getUpstashLimiter(cfg: RateLimitConfig): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;
  const key = `${cfg.limit}|${cfg.window}`;
  let limiter = upstashLimiters.get(key);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(cfg.limit, cfg.window),
      prefix: "reven_rl",
      analytics: false,
    });
    upstashLimiters.set(key, limiter);
  }
  return limiter;
}

// ---------- Fallback en memoria ----------

const memStore = new Map<string, number[]>(); // key -> timestamps (ms)
let lastGc = 0;

function memLimit(key: string, cfg: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const windowStart = now - cfg.windowMs;
  const hits = (memStore.get(key) ?? []).filter((t) => t > windowStart);

  const success = hits.length < cfg.limit;
  if (success) hits.push(now);
  memStore.set(key, hits);

  // Limpieza oportunista (cada ~5 min) para no acumular claves muertas
  if (now - lastGc > min(5)) {
    lastGc = now;
    const cutoff = now - min(60);
    const dead: string[] = [];
    memStore.forEach((v, k) => {
      if (v.length === 0 || (v[v.length - 1] ?? 0) < cutoff) dead.push(k);
    });
    dead.forEach((k) => memStore.delete(k));
  }

  const remaining = Math.max(0, cfg.limit - hits.length);
  const reset = (hits[0] ?? now) + cfg.windowMs;
  return { success, remaining, reset };
}

// ---------- API pública ----------

/** IP del cliente a partir de los headers del proxy (Vercel setea x-forwarded-for). */
export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/** Consume un cupo para una clave ya armada (name + identificador). */
export async function checkRateLimitByKey(
  name: string,
  identifier: string,
  cfg: RateLimitConfig
): Promise<RateLimitResult> {
  const key = `${name}:${identifier}`;
  const upstash = getUpstashLimiter(cfg);
  if (upstash) {
    try {
      const r = await upstash.limit(key);
      return { success: r.success, remaining: r.remaining, reset: r.reset };
    } catch (e) {
      // Fail-open: si Redis falla (timeout de red, etc.), caemos al límite en memoria
      // en vez de tirar abajo el endpoint por un problema de infraestructura.
      console.error("Rate limit (Upstash) falló, usando fallback en memoria:", e);
    }
  }
  return memLimit(key, cfg);
}

/**
 * Consume un cupo usando la IP del request (o `extraKey`, p.ej. el userId, si se pasa).
 */
export async function checkRateLimit(
  req: Request,
  name: string,
  cfg: RateLimitConfig,
  extraKey?: string
): Promise<RateLimitResult> {
  return checkRateLimitByKey(name, extraKey ?? getClientIp(req), cfg);
}

/**
 * Aplica el límite y devuelve una respuesta 429 si se excedió, o `null` si está OK.
 * `extraKey` permite limitar por usuario en endpoints autenticados.
 */
export async function enforceRateLimit(
  req: Request,
  name: string,
  cfg: RateLimitConfig,
  extraKey?: string
): Promise<NextResponse | null> {
  const r = await checkRateLimit(req, name, cfg, extraKey);
  if (r.success) return null;
  const retryAfter = Math.max(1, Math.ceil((r.reset - Date.now()) / 1000));
  return NextResponse.json(
    { error: "Demasiados intentos. Esperá un momento y volvé a probar." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}
