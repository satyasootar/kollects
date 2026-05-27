import * as React from "react";
import Link from "next/link";
import { Button } from "~/components/ui/button";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 h-16 flex items-center justify-between px-6 bg-background/85 backdrop-blur-md border-b border-border/60">
        <Link href="/" className="text-lg font-semibold text-foreground">
          kollects.tech
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/explore" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Explore</Link>
          <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
          <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Docs</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button variant="forest" size="sm" asChild>
            <Link href="/signup">Get Started</Link>
          </Button>
        </div>
      </header>
      <main id="main-content" className="flex-1">{children}</main>
      <footer className="border-t border-border py-6 px-6 text-center">
        <p className="text-mono-sm text-muted-foreground">kollects.tech © 2026 · made with care</p>
      </footer>
    </div>
  );
}
