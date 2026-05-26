import * as React from "react";

export default function FormFillLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative">
      <a href="#form" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-3 focus:py-2 focus:bg-foreground focus:text-background focus:rounded-lg">
        Skip to form
      </a>
      <main id="form" className="min-h-screen">
        {children}
      </main>
      <div className="fixed bottom-3 right-3 text-[8px] font-mono text-foreground/60">
        powered by kollects.tech
      </div>
    </div>
  );
}
