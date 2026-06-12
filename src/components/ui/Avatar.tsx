import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils";

export function Avatar({
  firstName,
  lastName,
  src,
  size = 36,
  className,
}: {
  firstName: string;
  lastName?: string;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={firstName}
        width={size}
        height={size}
        className={cn("rounded-full object-cover", className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-800/40 font-semibold text-brand-700 dark:text-brand-300",
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {getInitials(firstName, lastName)}
    </div>
  );
}
