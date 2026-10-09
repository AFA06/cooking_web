import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg" | "xl";
  /** Render the child element (usually a link) with button styling. */
  asChild?: boolean;
  loading?: boolean;
}

const base =
  "inline-flex items-center justify-center rounded-xl font-semibold whitespace-nowrap transition-[background-color,color,border-color,transform] duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-2 focus-visible:ring-offset-amber-50 disabled:pointer-events-none disabled:opacity-50";

const variants = {
  primary: "bg-amber-700 text-white hover:bg-amber-800",
  secondary: "bg-sage-100 text-sage-900 hover:bg-sage-200",
  outline: "border border-amber-300 bg-transparent text-amber-950 hover:border-amber-950",
  ghost: "text-amber-950 hover:bg-amber-100",
  destructive: "bg-red-600 text-white hover:bg-red-700",
};

const sizes = {
  sm: "h-10 gap-1.5 px-4 text-sm",
  md: "h-11 gap-2 px-5 text-[0.95rem]",
  lg: "h-12 gap-2 px-6 text-base",
  xl: "h-14 gap-2.5 px-8 text-lg",
};

const Spinner = () => (
  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", asChild = false, loading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp ref={ref} className={cn(base, variants[variant], sizes[size], className)} disabled={disabled || loading} {...props}>
        {asChild ? (
          children
        ) : (
          <>
            {loading && <Spinner />}
            {children}
          </>
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button };
