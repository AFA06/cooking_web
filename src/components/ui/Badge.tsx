import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "premium" | "free" | "new" | "founding";
}

const variants = {
  default: "bg-amber-100 text-amber-900",
  premium: "bg-amber-700 text-white",
  free: "bg-emerald-100 text-emerald-800",
  new: "bg-rose-100 text-rose-800",
  founding: "bg-amber-950 text-amber-50",
};

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(({ className, variant = "default", ...props }, ref) => (
  <span
    ref={ref}
    className={cn("inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-semibold tracking-wide", variants[variant], className)}
    {...props}
  />
));
Badge.displayName = "Badge";

export { Badge };
