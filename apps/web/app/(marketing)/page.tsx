"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "~/components/ui/button";
import { HeroHeadline } from "~/components/landing/hero-headline";
import { HeroFormCard } from "~/components/landing/hero-form-card";
import { ThemeShowcase } from "~/components/landing/theme-showcase";
import { HowItWorks } from "~/components/landing/how-it-works";
import { StatsSection } from "~/components/landing/stats-section";
import { CTASection } from "~/components/landing/cta-section";

// Lazy-load drag demo — heavy @dnd-kit dependency
const DragDemo = dynamic(
  () => import("~/components/landing/drag-demo").then((mod) => ({ default: mod.DragDemo })),
  { ssr: false, loading: () => <div className="h-48 animate-pulse bg-muted rounded-xl" /> }
);

function HeroCTAButtons() {
  return (
    <motion.div
      className="flex items-center justify-center gap-4 mt-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <Button
        variant="default"
        size="lg"
        asChild
        className="rounded-full px-8 bg-[#4d65ff] hover:bg-[#3b4ecc] text-white"
      >
        <Link href="/signup">Request a Demo</Link>
      </Button>
      <Button variant="outline" size="lg" asChild className="rounded-full px-8">
        <Link href="/explore">See how it works</Link>
      </Button>
    </motion.div>
  );
}

export default function LandingPage() {
  const heroRef = React.useRef<HTMLElement>(null);

  // Auxia inspired warm cream background for the main page
  return (
    <div className="bg-[#f0efe3] min-h-screen text-[#1a1a1a] selection:bg-[#0b4fff] selection:text-[#f0efe3]">
      {/* ═══ HERO ═══ */}
      <section
        ref={heroRef}
        className="relative pt-32 pb-40 px-6 overflow-hidden flex flex-col items-center"
      >
        <div className="relative z-10 w-full max-w-5xl mx-auto">
          <HeroHeadline />
          <HeroCTAButtons />
          
          {/* Hero visual */}
          <div className="mt-24 relative flex justify-center w-full">
            <HeroFormCard />
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <div className="bg-[#1a1a1a] text-[#f0efe3]">
        <HowItWorks />
      </div>

      {/* ═══ INTERACTIVE DRAG DEMO ═══ */}
      <section className="px-6 py-32 max-w-5xl mx-auto bg-[#f0efe3]">
        <motion.div
          className="bg-white border border-[#e5e5e5] rounded-3xl p-10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.1)]"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <h3 className="text-2xl font-serif text-[#1a1a1a] mb-2">Try it yourself</h3>
          <p className="text-base text-[#737373] mb-8">
            Drag fields onto the canvas — just like the real editor.
          </p>
          <DragDemo />
        </motion.div>
      </section>

      {/* ═══ THEME SHOWCASE (sticky scroll) ═══ */}
      <ThemeShowcase />

      {/* ═══ STATS ═══ */}
      <StatsSection />

      {/* ═══ CTA ═══ */}
      <CTASection />
    </div>
  );
}
