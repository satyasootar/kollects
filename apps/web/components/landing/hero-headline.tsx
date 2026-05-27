"use client";

import * as React from "react";
import { motion } from "motion/react";

export function HeroHeadline() {
  return (
    <div className="text-center max-w-4xl mx-auto">
      <motion.h1
        className="text-[5rem] leading-[1.05] tracking-tight text-[#1a1a1a] font-serif"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        Journeys that <br /> drive results
      </motion.h1>

      <motion.p
        className="mt-8 text-xl text-[#4a4a4a] max-w-2xl mx-auto leading-relaxed"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        Kolletcs is the AI-native system behind every customer interaction — deciding what to do next, generating creative variations to test, constantly learning, and optimizing performance across your entire lifecycle.
      </motion.p>
    </div>
  );
}
