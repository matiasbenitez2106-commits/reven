import { cn } from "@/lib/utils";

const SIZES = {
  sm: { text: "text-lg",  o: "h-[19px] w-[19px] ml-[-1px] mt-[3px]" },
  md: { text: "text-2xl", o: "h-[26px] w-[26px] ml-[-1px] mt-[4px]" },
  lg: { text: "text-4xl", o: "h-[40px] w-[40px] ml-[-2px] mt-[5px]" },
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
      className={cn("inline-flex items-center text-ink dark:text-stone-100", s.text, className)}
      style={{ fontFamily: '"Helvetica Neue", Arial, system-ui, sans-serif', fontWeight: 900, letterSpacing: "-0.05em", lineHeight: 1 }}
    >
      trat
      <img
        src="/brand/o-check-sticker.png"
        alt=""
        aria-hidden="true"
        className={cn("inline-block shrink-0 object-contain", s.o)}
        style={{ transform: "rotate(-6deg)", filter: "drop-shadow(1px 3px 3px rgba(0,0,0,.28))" }}
      />
      <span className="sr-only">o</span>
    </span>
  );
}
