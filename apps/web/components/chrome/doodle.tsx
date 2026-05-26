import * as React from "react";
import { cn } from "~/lib/utils";

export const DOODLES = [
  "arrow-loop", "arrow-curve", "arrow-down-right", "swirl", "sparkle",
  "underline-wave", "underline-rough", "checkmark-pen", "dotted-trail", "quote-mark",
] as const;

export type DoodleName = (typeof DOODLES)[number];

interface DoodleProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: DoodleName;
  decorative?: boolean;
}

export function Doodle({ name, className, decorative = true, ...props }: DoodleProps) {
  return (
    <span
      aria-hidden={decorative}
      className={cn("inline-block text-doodle opacity-80", className)}
      {...props}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/doodles/${name}.svg`} alt="" className="size-full" />
    </span>
  );
}
