import * as React from "react";
import { cn } from "@/lib/utils";

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

const sizes = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-7xl",
  /** Edge to edge with generous gutters; capped only on very large monitors. */
  xl: "max-w-[120rem]",
  full: "max-w-full",
};

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(({ className, size = "lg", ...props }, ref) => (
  <div ref={ref} className={cn("mx-auto w-full px-5 sm:px-8 lg:px-12 2xl:px-16", sizes[size], className)} {...props} />
));
Container.displayName = "Container";

export { Container };
