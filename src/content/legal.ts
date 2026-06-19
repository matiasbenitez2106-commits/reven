import type { LegalDocContent } from "@/components/LegalDoc";
import { PRIVACY_VIEJO, TERMS_VIEJO, UPDATED_VIEJO } from "./legal.viejo";
import { PRIVACY_NUEVO, TERMS_NUEVO, UPDATED_NUEVO } from "./legal.nuevo";

// ⚠️ TEXTOS LEGALES CON INTERRUPTOR (Paso 8 — baja en dos fases).
// Hay dos versiones completas de cada documento:
//   - legal.viejo.ts → los textos EN VIVO de hoy (baja inmediata).
//   - legal.nuevo.ts → los textos del Paso 8 (baja en 90 días, reactivación, bloqueo, robot).
// El interruptor de entorno MOSTRAR_TEXTOS_BAJA decide cuáles se muestran:
//   - ausente o distinto de "true" → se muestran los VIEJOS (por defecto; fallar cerrado).
//   - "true"                       → se muestran los NUEVOS.
// IMPORTANTE: poné MOSTRAR_TEXTOS_BAJA="true" recién cuando el robot esté ACTIVADO en
// producción (ACCOUNT_DELETION_LIVE=true), para no prometer un borrado que todavía no ocurre.
// Antes de prenderlo, actualizá la fecha de la versión nueva (UPDATED_NUEVO) a la real de publicación.
const usarNuevos = process.env.MOSTRAR_TEXTOS_BAJA === "true";

export const PRIVACY_DOC: LegalDocContent = usarNuevos ? PRIVACY_NUEVO : PRIVACY_VIEJO;
export const TERMS_DOC: LegalDocContent = usarNuevos ? TERMS_NUEVO : TERMS_VIEJO;
export const LEGAL_UPDATED: string = usarNuevos ? UPDATED_NUEVO : UPDATED_VIEJO;
