import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Wordmark de trato: "trat" en Bricolage Grotesque + la "o" como sello de
// verificado (círculo salvia con check crema). Identidad "Curado salvia".
const SIZES = {
  sm: { text: "text-lg", badge: "h-[17px] w-[17px] ml-[1px] mt-[3px]", icon: "h-[11px] w-[11px]" },
  md: { text: "text-2xl", badge: "h-[21px] w-[21px] ml-[1px] mt-[4px]", icon: "h-[13px] w-[13px]" },
  lg: { text: "text-4xl", badge: "h-[31px] w-[31px] ml-[2px] mt-[6px]", icon: "h-[19px] w-[19px]" },
} as const;

export function Logo({
  size = "md",
  className,
}: {
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const s = SIZES[size];
  return (
    <span
      className={cn(
        "inline-flex items-center font-display font-bold tracking-tight text-ink dark:text-stone-100",
        s.text,
        className
      )}
    >
      trat
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full bg-brand-600 text-cream",
          s.badge
        )}
        aria-hidden="true"
      >
        <Check strokeWidth={3.5} className={s.icon} />
      </span>
      <span className="sr-only">o</span>
    </span>
  );
}
