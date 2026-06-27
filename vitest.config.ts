import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Pruebas de lógica PURA (sin DB ni red). Entorno node; el alias "@" resuelve a /src
// igual que en la app, para importar los módulos de src/lib tal cual.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
