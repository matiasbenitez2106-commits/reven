import crypto from "crypto";
import { PaymentType, SubscriptionPlan } from "@prisma/client";
import { BOOST_PLANS, SUBSCRIPTION_PLANS } from "./constants";

// Integración con MercadoPago (Checkout Pro) — PLUGGABLE.
// Sin MP_ACCESS_TOKEN funciona en modo "mock" (aprueba al instante) para poder
// probar el flujo de destacados sin credenciales.

export function isMpConfigured(): boolean {
  return !!process.env.MP_ACCESS_TOKEN;
}

/**
 * Valida la firma de un webhook de MercadoPago (header `x-signature`).
 *
 * MP firma un "manifest" `id:<data.id>;request-id:<x-request-id>;ts:<ts>;` con HMAC-SHA256
 * usando la clave secreta del webhook (MP_WEBHOOK_SECRET, la "Clave secreta" del panel).
 *
 * - Si NO hay MP_WEBHOOK_SECRET configurado, no podemos validar: devolvemos true (modo
 *   mock/dev) y avisamos. Igual el webhook re-consulta el estado real a la API de MP.
 * - Si SÍ está configurado, exigimos firma válida (rechaza spam/forjados).
 */
export function verifyMpWebhook(req: Request): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) {
    if (isMpConfigured()) {
      console.warn("MP_WEBHOOK_SECRET no configurado: no se valida la firma del webhook de MercadoPago.");
    }
    return true;
  }

  const signature = req.headers.get("x-signature");
  const requestId = req.headers.get("x-request-id");
  if (!signature) return false;

  // x-signature: "ts=1700000000,v1=hexhash"
  const parts: Record<string, string> = {};
  for (const kv of signature.split(",")) {
    const idx = kv.indexOf("=");
    if (idx === -1) continue;
    parts[kv.slice(0, idx).trim()] = kv.slice(idx + 1).trim();
  }
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  // data.id tal como vino en la URL de notificación (alfanumérico → minúsculas).
  const url = new URL(req.url);
  const dataId = (url.searchParams.get("data.id") || url.searchParams.get("id") || "").toLowerCase();

  const manifest = `id:${dataId};request-id:${requestId ?? ""};ts:${ts};`;
  const computed = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  // Comparación en tiempo constante.
  try {
    const a = Buffer.from(computed, "hex");
    const b = Buffer.from(v1, "hex");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

interface CheckoutArgs {
  paymentId: string;
  type: PaymentType;
  listingId: string;
  listingTitle: string;
  payerEmail: string;
  baseUrl: string;
}

export interface CheckoutResult {
  redirectUrl: string;
  preferenceId: string | null;
  mock: boolean;
}

export async function createCheckout(args: CheckoutArgs): Promise<CheckoutResult> {
  const plan = BOOST_PLANS[args.type];

  // ── Modo mock (sin credenciales): aprueba vía endpoint interno ──
  if (!isMpConfigured()) {
    return {
      redirectUrl: `${args.baseUrl}/api/payments/mock-approve?paymentId=${args.paymentId}`,
      preferenceId: null,
      mock: true,
    };
  }

  // ── MercadoPago real: crear preferencia de Checkout Pro ──
  const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      items: [
        {
          id: args.type,
          title: `Reven · ${plan.label}`,
          description: `Destacar: ${args.listingTitle}`,
          quantity: 1,
          currency_id: "ARS",
          unit_price: plan.price,
        },
      ],
      payer: { email: args.payerEmail },
      external_reference: args.paymentId,
      back_urls: {
        success: `${args.baseUrl}/articulos/${args.listingId}/destacar?status=success`,
        failure: `${args.baseUrl}/articulos/${args.listingId}/destacar?status=failure`,
        pending: `${args.baseUrl}/articulos/${args.listingId}/destacar?status=pending`,
      },
      auto_return: "approved",
      notification_url: `${args.baseUrl}/api/mercadopago/webhook`,
    }),
  });

  if (!res.ok) {
    throw new Error(`MercadoPago error: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return {
    redirectUrl: data.init_point ?? data.sandbox_init_point,
    preferenceId: data.id ?? null,
    mock: false,
  };
}

// ── Suscripciones (MercadoPago "preapproval" = pago recurrente) ──

export async function createSubscriptionCheckout(args: {
  plan: SubscriptionPlan;
  payerEmail: string;
  baseUrl: string;
  externalReference: string; // "userId:plan"
}): Promise<CheckoutResult> {
  const cfg = SUBSCRIPTION_PLANS[args.plan];

  if (!isMpConfigured()) {
    return {
      redirectUrl: `${args.baseUrl}/api/subscriptions/mock-approve?plan=${args.plan}`,
      preferenceId: null,
      mock: true,
    };
  }

  const res = await fetch("https://api.mercadopago.com/preapproval", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      reason: `Reven ${cfg.label} (suscripción mensual)`,
      external_reference: args.externalReference,
      payer_email: args.payerEmail,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: cfg.price,
        currency_id: "ARS",
      },
      back_url: `${args.baseUrl}/suscripcion?status=success`,
      status: "pending",
    }),
  });
  if (!res.ok) {
    throw new Error(`MercadoPago preapproval error: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return {
    redirectUrl: data.init_point,
    preferenceId: data.id ?? null,
    mock: false,
  };
}

export async function fetchMpPreapproval(
  id: string
): Promise<{ status: string; externalReference: string | null } | null> {
  if (!isMpConfigured()) return null;
  const res = await fetch(`https://api.mercadopago.com/preapproval/${id}`, {
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return { status: data.status, externalReference: data.external_reference ?? null };
}

// Consulta el estado de un pago en MercadoPago (usado por el webhook)
export async function fetchMpPayment(
  mpPaymentId: string
): Promise<{ status: string; externalReference: string | null } | null> {
  if (!isMpConfigured()) return null;
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${mpPaymentId}`, {
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return { status: data.status, externalReference: data.external_reference ?? null };
}
