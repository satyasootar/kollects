import * as React from "react";
import { cn } from "~/lib/utils";

interface DotFieldProps extends React.HTMLAttributes<HTMLDivElement> {}

export function DotField({ className, ...props }: DotFieldProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 -z-10",
        "opacity-50",
        "[background-image:radial-gradient(circle,var(--border)_1px,transparent_1px)]",
        "[background-size:28px_28px]",
        "[mask-image:linear-gradient(to_bottom,black_60%,transparent)]",
        "motion-safe:animate-[dot-drift_30s_linear_infinite]",
        className,
      )}
      {...props}
    />
  );
}
