"use client";

import * as React from "react";
import { motion } from "motion/react";
import Link from "next/link";

export function CTASection() {
  return (
    <section className="bg-[#1a1a1a] px-6 pt-32 pb-20">
      {/* Light Rounded CTA Box */}
      <motion.div
        className="max-w-6xl mx-auto bg-[#f0efe3] rounded-[3rem] p-16 md:p-24 text-center shadow-2xl relative"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <h2 className="text-4xl md:text-6xl font-serif text-[#1a1a1a] mb-6 tracking-tight">
          Ready to <span className="text-[#e78a53]">Master</span> your forms?
        </h2>
        <p className="text-xl text-[#4a4a4a] mb-10 max-w-xl mx-auto leading-relaxed">
          Join a builder community that practices, pushes, and grows with you, every day.
        </p>
        <Link href="/signup">
          <button className="bg-[#1a1a1a] text-[#f0efe3] px-8 py-4 rounded-full font-medium hover:scale-105 active:scale-95 transition-all shadow-xl text-lg">
            Get Started Free
          </button>
        </Link>
      </motion.div>

      {/* 4-Column Footer */}
      <div className="max-w-6xl mx-auto mt-40 text-left grid grid-cols-1 md:grid-cols-4 gap-12 text-[#f0efe3]">
        {/* Col 1: Logo & Copyright */}
        <div className="flex flex-col justify-between h-full">
          <div>
            <Link href="/" className="text-2xl font-bold font-serif tracking-tight flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#f0efe3] text-[#1a1a1a] flex items-center justify-center text-xs font-sans font-black">K</div>
              Kolletcs
            </Link>
          </div>
          <div className="mt-16 md:mt-0">
            <p className="text-sm font-medium">Developed by Kolletcs Team</p>
            <p className="text-sm text-[#737373] mt-2">© 2026 Kolletcs. All rights reserved.</p>
          </div>
        </div>

        {/* Col 2: Products */}
        <div>
          <h4 className="font-bold mb-8 text-xs tracking-[0.2em] uppercase text-[#f0efe3]">Products</h4>
          <ul className="space-y-4 text-sm font-medium text-[#a3a3a3]">
            <li><Link href="#" className="hover:text-white transition-colors">Forms</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Themes</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Integrations</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Enterprise</Link></li>
          </ul>
        </div>

        {/* Col 3: Resources */}
        <div>
          <h4 className="font-bold mb-8 text-xs tracking-[0.2em] uppercase text-[#f0efe3]">Resources</h4>
          <ul className="space-y-4 text-sm font-medium text-[#a3a3a3]">
            <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Pricing Policy</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Refund Policy</Link></li>
          </ul>
        </div>

        {/* Col 4: Social */}
        <div>
          <h4 className="font-bold mb-8 text-xs tracking-[0.2em] uppercase text-[#f0efe3]">Social</h4>
          <ul className="space-y-4 text-sm font-medium text-[#a3a3a3]">
            <li><Link href="#" className="hover:text-white transition-colors">X.com</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">GitHub</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">LinkedIn</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Instagram</Link></li>
          </ul>
        </div>
      </div>
    </section>
  );
}
