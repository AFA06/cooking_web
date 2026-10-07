import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "premium" | "free" | "new" | "founding";
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variants = {
      default:
        "bg-amber-100 text-amber-900 border border-amber-200",
      premium:
        "bg-gradient-to-r from-amber-600 to-amber-800 text-white border-none shadow-sm",
      free: "bg-emerald-100 text-emerald-800 border border-emerald-200",
      new: "bg-rose-100 text-rose-800 border border-rose-200",
      founding:
        "bg-gradient-to-r from-amber-500 to-orange-600 text-white border-none shadow-sm",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge };