"use client";

import { useState } from "react";
import { SubscriptionPlan } from "@prisma/client";
import { Crown, Check, Loader2, AlertCircle } from "lucide-react";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

const ORDER: SubscriptionPlan[] = ["PRO", "PRO_PLUS"];

export function PlanCards({ currentPlan }: { currentPlan: SubscriptionPlan | null }) {
  const [loading, setLoading] = useState<SubscriptionPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function subscribe(plan: SubscriptionPlan) {
    setLoading(plan);
    setError(null);
    try {
      const res = await fetch("/api/subscriptions/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "No se pudo iniciar la suscripción.");
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
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {ORDER.map((plan) => {
          const cfg = SUBSCRIPTION_PLANS[plan];
          const isCurrent = currentPlan === plan;
          const highlight = plan === "PRO_PLUS";
          return (
            <div
              key={plan}
              className={`relative flex flex-col rounded-xl border p-5 ${
                highlight ? "border-indigo-300 bg-indigo-50" : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <Crown className={highlight ? "h-5 w-5 text-indigo-600" : "h-5 w-5 text-gray-500"} />
                <h3 className="text-lg font-bold">{cfg.label}</h3>
                {isCurrent && (
                  <span className="ml-auto rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    Plan actual
                  </span>
                )}
              </div>
              <p className="mt-2 text-2xl font-extrabold">
                {formatPrice(cfg.price)}
                <span className="text-sm font-normal text-gray-500">/mes</span>
              </p>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-gray-600">
                {cfg.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" /> {perk}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => subscribe(plan)}
                disabled={loading !== null || isCurrent}
                className={`mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium text-white disabled:opacity-50 ${
                  highlight ? "bg-indigo-600 hover:bg-indigo-700" : "bg-brand-600 hover:bg-brand-700"
                }`}
              >
                {loading === plan ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isCurrent ? "Tu plan actual" : currentPlan ? `Cambiar a ${cfg.label}` : "Suscribirme"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
