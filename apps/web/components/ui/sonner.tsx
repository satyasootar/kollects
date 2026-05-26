"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="bottom-right"
      richColors={false}
      closeButton
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "bg-card border border-border rounded-2xl shadow-[0_24px_60px_-20px_oklch(0.22_0.04_180/0.18)] text-foreground",
          success: "!bg-tint-mint !text-tint-mint-ink !border-tint-mint",
          info: "!bg-tint-sky !text-tint-sky-ink !border-tint-sky",
          warning: "!bg-tint-butter !text-tint-butter-ink !border-tint-butter",
          error: "!bg-tint-blush !text-tint-blush-ink !border-tint-blush",
          closeButton: "!border-border",
        },
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          "--width": "360px",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
