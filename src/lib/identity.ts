// Proveedor de verificación de identidad — PLUGGABLE.
//
// MVP: proveedor "mock" que simula liveness + comparación facial.
// Producción: implementar runOnfido() (o AWS Rekognition) y setear IDENTITY_PROVIDER.
//
// El endpoint /api/verification llama a runIdentityCheck() y no necesita conocer
// los detalles del proveedor.

export type IdentityDecision = "VERIFIED" | "PENDING" | "REJECTED";

export interface IdentityCheckInput {
  dniNumber: string;
  dniFront: string; // data URI
  dniBack: string; // data URI
  selfie: string; // data URI
}

export interface IdentityCheckResult {
  provider: string;
  providerRef: string;
  livenessScore: number; // 0..1
  matchScore: number; // 0..1 (similitud selfie vs foto del DNI)
  decision: IdentityDecision;
}

export async function runIdentityCheck(
  input: IdentityCheckInput
): Promise<IdentityCheckResult> {
  const provider = (process.env.IDENTITY_PROVIDER || "mock").toLowerCase();
  if (provider === "onfido") return runOnfido(input);
  return runMock(input);
}

/**
 * Proveedor MOCK para el MVP. Simula un resultado verosímil.
 * El resultado final se controla con IDENTITY_AUTO_DECISION:
 *   - "verified" (default): aprueba automáticamente.
 *   - "manual":            deja en PENDING para revisión por un admin.
 *   - "rejected":          rechaza (útil para probar ese estado).
 */
async function runMock(_input: IdentityCheckInput): Promise<IdentityCheckResult> {
  const auto = (process.env.IDENTITY_AUTO_DECISION || "verified").toLowerCase();
  const decision: IdentityDecision =
    auto === "manual" ? "PENDING" : auto === "rejected" ? "REJECTED" : "VERIFIED";

  // Simula scores plausibles
  const livenessScore = round(0.9 + Math.random() * 0.09);
  const matchScore =
    decision === "REJECTED"
      ? round(0.3 + Math.random() * 0.2)
      : round(0.85 + Math.random() * 0.13);

  return {
    provider: "mock",
    providerRef: `mock_${Date.now().toString(36)}`,
    livenessScore,
    matchScore,
    decision,
  };
}

/**
 * Stub para integración real con Onfido.
 * Pasos típicos:
 *   1. Crear applicant.
 *   2. Subir documentos (front/back) y la live photo (selfie).
 *   3. Lanzar un workflow run / check.
 *   4. Resolver vía webhook -> actualizar Verification.status.
 * Docs: https://documentation.onfido.com/
 */
async function runOnfido(_input: IdentityCheckInput): Promise<IdentityCheckResult> {
  if (!process.env.ONFIDO_API_TOKEN) {
    throw new Error("ONFIDO_API_TOKEN no configurado.");
  }
  // TODO: implementar llamadas reales a la API de Onfido.
  // Hasta entonces, dejamos el check en revisión manual.
  return {
    provider: "onfido",
    providerRef: `onfido_pending_${Date.now().toString(36)}`,
    livenessScore: 0,
    matchScore: 0,
    decision: "PENDING",
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
