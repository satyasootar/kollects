"use client";

import * as React from "react";
import { motion } from "motion/react";

export function NeomorphicForm() {
  return (
    <motion.div
      className="w-full max-w-sm rounded-[2rem] p-10 mx-auto"
      style={{
        backgroundColor: "#f0efe3",
        boxShadow: "12px 12px 24px #d1d0c5",
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mb-8">
        <h3 className="text-2xl font-serif text-[#1a1a1a] mb-2">Sign up</h3>
        <p className="text-sm text-[#737373]">Join the beta today.</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-xs font-medium text-[#737373] ml-2 mb-2 uppercase tracking-widest">
            Name
          </label>
          <input
            type="text"
            placeholder="John Doe"
            className="w-full h-12 px-4 rounded-xl text-sm bg-[#f0efe3] text-[#1a1a1a] placeholder:text-[#a3a3a3] outline-none"
            style={{
              boxShadow: "inset 4px 4px 8px #d1d0c5",
            }}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#737373] ml-2 mb-2 uppercase tracking-widest">
            Email
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            className="w-full h-12 px-4 rounded-xl text-sm bg-[#f0efe3] text-[#1a1a1a] placeholder:text-[#a3a3a3] outline-none"
            style={{
              boxShadow: "inset 4px 4px 8px #d1d0c5",
            }}
          />
        </div>

        <button
          className="w-full h-12 mt-4 rounded-xl text-sm font-bold text-[#1a1a1a] hover:scale-[0.98] transition-transform active:scale-95"
          style={{
            backgroundColor: "#f0efe3",
            boxShadow: "6px 6px 12px #d1d0c5",
          }}
        >
          Submit
        </button>
      </div>
    </motion.div>
  );
}
