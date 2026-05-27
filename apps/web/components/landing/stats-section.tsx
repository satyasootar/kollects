"use client";

import * as React from "react";
import { motion, useInView } from "motion/react";

const STATS = [
  {
    value: 37000000,
    suffix: "",
    label: "hours returned to clinicians",
    color: "#ffffff",
  },
  {
    value: 2400000,
    suffix: "",
    label: "patient visits supported each week",
    color: "#f6ee6b", // Yellow highlight from reference
  },
  {
    value: 200,
    suffix: "+",
    label: "clinical specialties choose Kolletcs",
    color: "#ffffff",
  },
];

function StatCard({
  value,
  suffix,
  label,
  color,
  delay,
}: {
  value: number;
  suffix: string;
  label: string;
  color: string;
  delay: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    if (!isInView) return;
    const duration = 1500;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const t = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.round(t * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    const timeout = setTimeout(() => requestAnimationFrame(animate), delay * 1000);
    return () => clearTimeout(timeout);
  }, [isInView, value, delay]);

  // Format large numbers with spaces like the reference (e.g. 37 000 000)
  const formatted = displayValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  return (
    <motion.div
      ref={ref}
      className="rounded-[2rem] p-12 flex flex-col justify-between min-h-[320px] shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
      style={{ backgroundColor: color }}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <p className="text-lg text-[#1a1a1a] mb-auto">{label}</p>
      
      <div className="mt-8">
        <div className="text-[3.5rem] leading-none font-serif text-[#1a1a1a] tracking-tight">
          {formatted}{suffix}
        </div>
      </div>
    </motion.div>
  );
}

export function StatsSection() {
  return (
    <section className="px-6 py-32 max-w-7xl mx-auto bg-[#f0efe3]">
      <div className="text-center mb-20">
        <motion.p
          className="text-sm font-medium text-[#737373] uppercase tracking-[0.2em] mb-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          + Global scale
        </motion.p>
        <motion.h2
          className="text-[4rem] leading-[1.05] font-serif text-[#1a1a1a] tracking-tight mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          Real world impact felt by <br /> creators around the globe
        </motion.h2>
        <motion.p
          className="text-lg text-[#4a4a4a]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          Pressure tested, assessed and approved by the toughest audience: creators like you.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {STATS.map((stat, i) => (
          <StatCard key={stat.label} {...stat} delay={i * 0.15} />
        ))}
      </div>
    </section>
  );
}
