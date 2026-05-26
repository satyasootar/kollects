import * as React from "react";
import { Illustration } from "~/components/chrome";
import { TintCard } from "~/components/chrome";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[55fr_45fr]">
      <div className="flex flex-col items-center justify-center px-6 py-12">
        <a href="#auth-form" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-3 focus:py-2 focus:bg-foreground focus:text-background focus:rounded-lg">
          Skip to form
        </a>
        <div id="auth-form" className="w-full max-w-sm">
          {children}
        </div>
      </div>
      <div className="hidden md:flex flex-col items-center justify-center bg-tint-mint p-12 gap-8">
        <Illustration name="ship-form" tint="mint" />
        <TintCard tint="forest" className="max-w-xs text-center">
          <p className="text-sm font-medium italic">&ldquo;Built our entire onboarding form in 12 minutes.&rdquo;</p>
          <p className="mt-2 text-xs opacity-70">&mdash; solo founder, design tools</p>
        </TintCard>
      </div>
    </div>
  );
}
