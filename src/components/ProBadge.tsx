import { SubscriptionPlan } from "@prisma/client";
import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProBadge({
  plan,
  className,
}: {
  plan: SubscriptionPlan;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-semibold text-white",
        className
      )}
    >
      <Crown className="h-3.5 w-3.5" /> {plan === "PRO_PLUS" ? "PRO+" : "PRO"}
    </span>
  );
}
