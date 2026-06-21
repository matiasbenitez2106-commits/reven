"use client";

import { useState } from "react";
import { PaymentType } from "@prisma/client";
import { Sparkles, Loader2, AlertCircle } from "lucide-react";
import { BOOST_PLANS } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

const ORDER: PaymentType[] = ["BOOST_3", "FEATURED_7", "FEATURED_14"];

export function BoostPlans({ listingId }: { listingId: string }) {
  const [loading, setLoading] = useState<PaymentType | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function choose(type: PaymentType) {
    setLoading(type);
    setError(null);
    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, type }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "No se pudo iniciar el pago.");
      }
      const j = await res.json();
      window.location.href = j.redirectUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado.");
      setLoading(null);
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {ORDER.map((type) => {
          const plan = BOOST_PLANS[type];
          const highlight = type === "FEATURED_7";
          return (
            <div
              key={type}
              className={`relative flex flex-col rounded-xl border p-5 ${
                highlight ? "border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40" : "border-line dark:border-stone-800 bg-surface dark:bg-stone-900"
              }`}
            >
              {highlight && (
                <span className="absolute -top-2 right-4 rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-semibold text-amber-950">
                  Popular
                </span>
              )}
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                <h3 className="font-semibold">{plan.label}</h3>
              </div>
              <p className="mt-2 text-2xl font-extrabold">{formatPrice(plan.price)}</p>
              <p className="mt-1 flex-1 text-sm text-gray-500 dark:text-stone-400">{plan.description}</p>
              <button
                onClick={() => choose(type)}
                disabled={loading !== null}
                className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {loading === type ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Destacar {plan.days} días
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
