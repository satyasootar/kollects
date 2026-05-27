"use client";

import * as React from "react";
import { motion } from "motion/react";

export function HeroHeadline() {
  return (
    <div className="text-left max-w-2xl">
      <motion.h1
        className="text-[5rem] leading-[1.05] tracking-tight text-[#1a1a1a] font-serif"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        Your form. <br /> Your rules. <br /> Your art.
      </motion.h1>

      <motion.p
        className="mt-8 text-xl text-[#4a4a4a] leading-relaxed"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        A premium, animation-rich landing page for kollects.tech, a SaaS form builder with 100+ theme presets. The design aesthetic is ChronoTask-inspired: clean white canvas, generous whitespace, product UI as the visual — no stock photos, no dark hero.
      </motion.p>
    </div>
  );
}

