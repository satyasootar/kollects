"use client";

import * as React from "react";
import { cn } from "~/lib/utils";
import { useReducedMotion } from "~/hooks/use-reduced-motion";

export const ILLUSTRATIONS = [
  "ship-form", "collect", "analyze", "share",
  "empty-mailbox", "celebration", "locked", "broken",
] as const;

export type IllustrationName = (typeof ILLUSTRATIONS)[number];

interface IllustrationProps extends React.HTMLAttributes<HTMLDivElement> {
  name: IllustrationName;
  tint?: "mint" | "peach" | "blush" | "butter" | "sky" | "lilac";
}

export function Illustration({ name, tint = "mint", className, ...props }: IllustrationProps) {
  const reducedMotion = useReducedMotion();

  return (
    <div
      className={cn(
        "max-w-[280px] md:max-w-[360px] mx-auto",
        !reducedMotion && "animate-in fade-in slide-in-from-bottom-2 duration-400",
        className,
      )}
      {...props}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/illustrations/illust-${name}.svg`}
        alt=""
        className={cn("size-full", `text-tint-${tint}-ink`)}
      />
    </div>
  );
}
