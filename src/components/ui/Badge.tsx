import { cn } from "@/lib/utils";

type Color = "gray" | "green" | "yellow" | "red" | "blue" | "brand";

const colors: Record<Color, string> = {
  gray: "bg-surface-sunken dark:bg-stone-800 text-gray-700 dark:text-stone-200",
  green: "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300",
  yellow: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300",
  red: "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300",
  blue: "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300",
  brand: "bg-brand-100 dark:bg-brand-800/40 text-brand-800 dark:text-brand-200",
};

export function Badge({
  children,
  color = "gray",
  className,
}: {
  children: React.ReactNode;
  color?: Color;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        colors[color],
        className
      )}
    >
      {children}
    </span>
  );
}
