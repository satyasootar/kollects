import * as React from "react";
import { cn } from "~/lib/utils";
import { Illustration, type IllustrationName } from "./illustration";

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  illustration?: IllustrationName;
  headline: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ illustration, headline, description, action, className, ...props }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4 text-center", className)} {...props}>
      {illustration && (
        <Illustration name={illustration} className="mb-8 max-w-[200px] md:max-w-[280px]" />
      )}
      <h2 className="text-display-md text-foreground">{headline}</h2>
      {description && (
        <p className="mt-3 text-base text-muted-foreground max-w-md">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
