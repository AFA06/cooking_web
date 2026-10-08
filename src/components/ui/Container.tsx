import * as React from "react";
import { cn } from "@/lib/utils";

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

const sizes = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-7xl",
  xl: "max-w-[90rem]",
  full: "max-w-full",
};

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(({ className, size = "lg", ...props }, ref) => (
  <div ref={ref} className={cn("mx-auto w-full px-5 sm:px-8 lg:px-12", sizes[size], className)} {...props} />
));
Container.displayName = "Container";

export { Container };
