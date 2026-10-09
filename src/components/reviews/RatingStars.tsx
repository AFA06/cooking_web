import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Five stars filled to the nearest half. Decorative on its own: pair it with the number in text. */
export function RatingStars({ value, size = "md", className }: { value: number; size?: "sm" | "md" | "lg"; className?: string }) {
  const dimension = { sm: "h-3.5 w-3.5", md: "h-[1.1rem] w-[1.1rem]", lg: "h-6 w-6" }[size];
  const rounded = Math.round(value * 2) / 2;
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-hidden="true">
      {[1, 2, 3, 4, 5].map((position) => {
        const fill = rounded >= position ? 100 : rounded >= position - 0.5 ? 50 : 0;
        return (
          <span key={position} className={cn("relative", dimension)}>
            <Star className={cn("absolute inset-0 text-amber-300", dimension)} strokeWidth={1.75} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill}%` }}>
              <Star className={cn("fill-clay-400 text-clay-400", dimension)} strokeWidth={1.75} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

export function formatRating(value: number): string {
  return value.toFixed(1).replace(".", ",");
}
