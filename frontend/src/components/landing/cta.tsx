import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { SectionLabel } from "./shared";
import { fadeUp, stagger } from "@/lib/animations";

export function CTA() {
  return (
    <section className="border-b border-border">
      <div className="max-w-350 mx-auto px-12 py-24 md:py-32">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="md:border md:border-border md:p-20 relative overflow-hidden"
        >
          {/* Subtle background grid */}
          <div className="absolute inset-0 bg-grid-dots opacity-30 pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-12">
            <div>
              <motion.div variants={fadeUp}>
                <SectionLabel>Start Free</SectionLabel>
              </motion.div>
              <motion.h2 variants={fadeUp} custom={1} className="mt-5 text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight leading-none">
                Ready to hear<br />your audience?
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} className="mt-6 text-muted-foreground max-w-md leading-relaxed">
                Launch your first poll, form or quiz in under 60 seconds. No credit card required.
                Just honest insights from the people who matter.
              </motion.p>
              <motion.div variants={fadeUp} custom={3} className="mt-8 flex flex-wrap gap-3">
                {["No credit card", "Free plan forever", "Real-time analytics"].map((t) => (
                  <span key={t} className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> {t}
                  </span>
                ))}
              </motion.div>
            </div>
            <motion.div variants={fadeUp} custom={2} className="w-full md:w-auto flex-shrink-0">
              <Link to="/auth/register" className="block">
                <Button
                  size="lg"
                  className="h-14 md:h-16 w-full md:w-auto px-8 md:px-12 rounded-none bg-foreground text-background hover:bg-primary text-sm md:text-base font-black uppercase tracking-widest whitespace-nowrap transition-all"
                >
                  Get Started Free <ArrowRight className="ml-3 w-5 h-5" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
