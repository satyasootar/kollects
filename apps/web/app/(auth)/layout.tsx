import * as React from "react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f0efe3] flex flex-col items-center justify-center px-6 py-12 text-[#1a1a1a] selection:bg-[#0b4fff] selection:text-[#f0efe3]">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-10">
          <Link href="/" className="text-2xl font-bold font-serif tracking-tight flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[#1a1a1a] text-[#f0efe3] flex items-center justify-center text-sm font-sans font-black">K</div>
            Kolletcs
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
