import * as React from "react";
import { cn } from "~/lib/utils";

interface EditorialCardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

/**
 * Editorial card — the default chrome card with rounded-2xl, hairline border, and optional hover lift.
 * DESIGN.md §3.3
 */
export function EditorialCard({
  interactive = false,
  className,
  children,
  ...props
}: EditorialCardProps) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-2xl p-6 transition-all duration-200",
        interactive &&
          "hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-12px_oklch(0.22_0.04_180/0.15)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface SurfaceCardProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Surface card — data-dense variant with tighter padding and smaller radius.
 * DESIGN.md §3.3
 */
export function SurfaceCard({ className, children, ...props }: SurfaceCardProps) {
  return (
    <div
      className={cn("bg-card border border-border/80 rounded-xl p-4", className)}
      {...props}
    >
      {children}
    </div>
  );
}
