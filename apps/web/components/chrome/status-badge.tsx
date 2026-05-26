import * as React from "react";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

type StatusVariant = "draft" | "published" | "archived" | "public" | "unlisted" | "private";

interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: StatusVariant;
}

export function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
  return (
    <Badge variant={status} className={cn("gap-1.5", className)} {...props}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {status}
    </Badge>
  );
}
