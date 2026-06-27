import { describe, it, expect } from "vitest";
import { checkRateLimitByKey, type RateLimitConfig } from "@/lib/ratelimit";

// Sin UPSTASH configurado en el entorno de test, checkRateLimitByKey cae al
// limitador EN MEMORIA (memLimit), que es justamente lo que queremos probar.
const cfg: RateLimitConfig = { limit: 3, window: "1 m", windowMs: 60_000 };

describe("rate limit en memoria (fallback sin Redis)", () => {
  it("permite hasta el límite y corta el intento siguiente", async () => {
    const id = "user-corta";
    const results = [];
    for (let i = 0; i < 4; i++) {
      results.push(await checkRateLimitByKey("test-rl", id, cfg));
    }
    expect(results.map((r) => r.success)).toEqual([true, true, true, false]);
    expect(results[3].remaining).toBe(0);
  });

  it("cuenta cada clave de forma independiente", async () => {
    // Clave nueva: no la afecta el cupo gastado por el test anterior.
    const r = await checkRateLimitByKey("test-rl", "otro-user", cfg);
    expect(r.success).toBe(true);
  });
});
