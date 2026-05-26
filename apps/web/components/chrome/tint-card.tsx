import * as React from "react";
import { cn } from "~/lib/utils";

export type TintName = "mint" | "peach" | "blush" | "butter" | "sky" | "lilac" | "forest";

const TINT_CLASSES: Record<TintName, string> = {
  mint: "bg-tint-mint text-tint-mint-ink",
  peach: "bg-tint-peach text-tint-peach-ink",
  blush: "bg-tint-blush text-tint-blush-ink",
  butter: "bg-tint-butter text-tint-butter-ink",
  sky: "bg-tint-sky text-tint-sky-ink",
  lilac: "bg-tint-lilac text-tint-lilac-ink",
  forest: "bg-foreground text-background",
};

interface TintCardProps extends React.HTMLAttributes<HTMLDivElement> {
  tint: TintName;
  span?: string;
}

export function TintCard({ tint, span, className, children, ...props }: TintCardProps) {
  return (
    <div
      className={cn("rounded-3xl p-6 md:p-8", TINT_CLASSES[tint], span, className)}
      {...props}
    >
      {children}
    </div>
  );
}

function TintCardNumber({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("text-display-md", className)} {...props}>
      {children}
    </div>
  );
}

function TintCardCaption({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("mt-3 text-base font-medium opacity-80", className)} {...props}>
      {children}
    </p>
  );
}

TintCard.Number = TintCardNumber;
TintCard.Caption = TintCardCaption;
