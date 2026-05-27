"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";

export function CTASection() {
  const [email, setEmail] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <section className="px-6 py-40 text-center bg-[#f0efe3]">
      <motion.h2
        className="text-[4.5rem] leading-[1.05] tracking-tight text-[#1a1a1a] font-serif mb-6"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        Ready to build?
      </motion.h2>
      <motion.p
        className="text-xl text-[#4a4a4a] mb-12 max-w-xl mx-auto"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2, duration: 0.8 }}
      >
        Join the AI-native system behind every customer interaction. Start building for free.
      </motion.p>

      <motion.form
        className="relative max-w-lg mx-auto"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        onSubmit={handleSubmit}
      >
        {/* Pulse rings on focus */}
        <AnimatePresence>
          {isFocused && (
            <>
              <motion.div
                className="absolute inset-0 rounded-[2rem] border-2 border-[#4d65ff]/20 pointer-events-none"
                initial={{ scale: 1, opacity: 0.4 }}
                animate={{ scale: 1.08, opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
              />
            </>
          )}
        </AnimatePresence>

        <div className="relative bg-white border border-[#e5e5e5] rounded-[2rem] p-8 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.05)]">
          <h3 className="text-lg font-serif text-[#1a1a1a] mb-2 text-left">
            Get started
          </h3>
          
          <div className="relative mb-6">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="name@company.com"
              className="w-full h-14 rounded-xl border border-[#e5e5e5] bg-[#fafafa] px-4 text-base text-[#1a1a1a] placeholder:text-[#a3a3a3] outline-none focus:ring-2 focus:ring-[#4d65ff]/20 focus:border-[#4d65ff] transition-all"
            />
          </div>

          <div className="relative">
            <button
              type="submit"
              className="w-full bg-[#4d65ff] text-white rounded-xl h-14 px-6 text-base font-medium hover:bg-[#3b4ecc] active:scale-[0.98] transition-all duration-200"
            >
              {submitted ? "🎉 Welcome aboard!" : "Request access"}
            </button>
          </div>
        </div>
      </motion.form>
    </section>
  );
}
