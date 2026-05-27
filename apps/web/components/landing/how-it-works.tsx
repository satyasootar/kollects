"use client";

import * as React from "react";
import { motion, useScroll, useTransform } from "motion/react";

import { MoonStar, Sparkles, LayoutTemplate, Palette, EyeOff } from "lucide-react";

const STEPS = [
  {
    number: "01",
    title: "Forms shouldn't be boring.",
    description: "They got stuck in the 2010s. Stop settling for generic, rigid templates that don't match your brand's unique identity.",
    content: (
      <div className="space-y-3">
        {[
          { label: "Boring layout", icon: <LayoutTemplate size={14} /> },
          { label: "Limited colors", icon: <Palette size={14} /> },
          { label: "Brand mismatch", icon: <EyeOff size={14} /> }
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 bg-[#2a2a2a] border border-[#444] rounded-xl px-4 py-3"
          >
            <div className="text-[#ff4444]">{item.icon}</div>
            <span className="text-sm font-medium text-[#e5e5e5]">{item.label}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    number: "02",
    title: "Your brand is unique.",
    description: "Show it off. Choose from over 60+ beautifully crafted presets or build your own custom theme from scratch.",
    content: (
      <div className="flex flex-col gap-3">
        {[
          { name: "Darkmater Theme", icon: <MoonStar size={16} />, color: "#e78a53" },
          { name: "Cyberpunk Glow", icon: <Sparkles size={16} />, color: "#ff00c8" },
        ].map((t) => (
          <div
            key={t.name}
            className="flex items-center gap-3 bg-[#2a2a2a] border border-[#444] rounded-xl px-4 py-3"
          >
            <span className="text-[#a3a3a3]">{t.icon}</span>
            <span className="text-sm font-medium text-[#e5e5e5]">{t.name}</span>
            <div className="ml-auto w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
          </div>
        ))}
      </div>
    ),
  },
  {
    number: "03",
    title: "Publish and Collect.",
    description: "One click to launch. Gather data beautifully and watch your completion rates soar when users actually enjoy filling out your forms.",
    content: (
      <div className="space-y-3">
        <div className="bg-[#4d65ff] text-white rounded-full px-6 py-3 text-sm font-medium text-center shadow-lg cursor-pointer hover:bg-[#3b4ecc] transition-colors">
          Publish Form →
        </div>
        <div className="flex items-center justify-between bg-[#2a2a2a] border border-[#444] rounded-xl px-4 py-3">
          <span className="text-sm text-[#a3a3a3]">Completion Rate</span>
          <span className="text-sm font-bold text-[#4d65ff]">+42%</span>
        </div>
      </div>
    ),
  },
];

// Straight connecting line for the dark section
const PATH_D = "M 50,150 L 50,750";

export function HowItWorks() {
  const sectionRef = React.useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 0.8", "end 0.5"],
  });

  const pathLength = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section ref={sectionRef} className="relative px-6 py-32 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
        <div className="lg:sticky lg:top-40 self-start">
          <motion.h2
            className="text-[4rem] leading-none tracking-tight font-serif mb-6 text-white"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="text-[#a3a3a3]">Forms shouldn&apos;t be boring.</span><br/>
            Make them yours.
          </motion.h2>
        </div>

        <div className="relative">
          {/* Vertical tracking line */}
          <svg
            className="absolute left-[-40px] top-0 w-[40px] h-full pointer-events-none hidden md:block"
            viewBox="0 0 100 900"
            preserveAspectRatio="xMidYMin slice"
            fill="none"
          >
            <path d={PATH_D} stroke="#444" strokeWidth="2" strokeDasharray="4 4" />
            <motion.path
              d={PATH_D}
              stroke="#4d65ff"
              strokeWidth="3"
              strokeLinecap="round"
              style={{ pathLength }}
            />
          </svg>

          <div className="space-y-32">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.number}
                className="relative"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{
                  duration: 0.8,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <span className="text-[#4d65ff] font-mono text-sm tracking-widest mb-4 block">
                  STEP {step.number}
                </span>
                <h3 className="text-3xl font-serif text-white mb-4">
                  {step.title}
                </h3>
                <p className="text-lg text-[#a3a3a3] mb-8 leading-relaxed">
                  {step.description}
                </p>
                <div className="p-8 bg-[#1f1f1f] border border-[#333] rounded-3xl">
                  {step.content}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
