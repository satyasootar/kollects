"use client";

import * as React from "react";
import { motion } from "motion/react";

const FIELDS = [
  { label: "Your name", placeholder: "John Doe", width: "100%" },
  { label: "Email", placeholder: "you@email.com", width: "100%" },
  { label: "Rating", placeholder: "★★★★★", width: "60%" },
];

function useTypewriter(text: string, start: boolean, speed = 30) {
  const [displayed, setDisplayed] = React.useState("");

  React.useEffect(() => {
    if (!start) {
      setDisplayed("");
      return;
    }
    let i = 0;
    setDisplayed("");
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, start, speed]);

  return displayed;
}

function FieldRow({
  label,
  placeholder,
  width,
  index,
}: {
  label: string;
  placeholder: string;
  width: string;
  index: number;
}) {
  const [drawComplete, setDrawComplete] = React.useState(false);
  const typedText = useTypewriter(placeholder, drawComplete);
  const delay = index * 0.3;

  return (
    <div className="space-y-1.5" style={{ width }}>
      {/* Label */}
      <motion.span
        className="block text-xs font-medium text-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.2, duration: 0.3 }}
      >
        {label}
      </motion.span>

      {/* Field outline via SVG */}
      <div className="relative h-10">
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 400 40"
          preserveAspectRatio="none"
          fill="none"
        >
          <motion.rect
            x="1"
            y="1"
            width="398"
            height="38"
            rx="8"
            ry="8"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-border"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              delay,
              duration: 0.6,
              ease: [0.22, 1, 0.36, 1],
            }}
            onAnimationComplete={() => setDrawComplete(true)}
          />
        </svg>
        {/* Placeholder text */}
        <div className="absolute inset-0 flex items-center px-3">
          <span className="text-sm text-muted-foreground font-mono">
            {typedText}
            {drawComplete && typedText.length < placeholder.length && (
              <span className="animate-pulse">|</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

export function HeroFormCard() {
  const [submitVisible, setSubmitVisible] = React.useState(false);

  return (
    <motion.div
      className="relative bg-card border border-border rounded-2xl p-6 shadow-sm max-w-sm mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{ willChange: "transform" }}
    >
      {/* Form title */}
      <motion.h3
        className="text-sm font-semibold text-foreground mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        Feedback Form
      </motion.h3>

      {/* Fields */}
      <div className="space-y-4">
        {FIELDS.map((field, i) => (
          <FieldRow
            key={field.label}
            {...field}
            index={i}
          />
        ))}
      </div>

      {/* Submit button */}
      <div className="mt-5">
        <svg
          className="w-28 h-10"
          viewBox="0 0 112 40"
          fill="none"
        >
          <motion.rect
            x="1"
            y="1"
            width="110"
            height="38"
            rx="20"
            ry="20"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-foreground"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              delay: FIELDS.length * 0.3,
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
            }}
            onAnimationComplete={() => setSubmitVisible(true)}
          />
          {submitVisible && (
            <motion.rect
              x="1"
              y="1"
              width="110"
              height="38"
              rx="20"
              ry="20"
              className="fill-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </svg>
        {submitVisible && (
          <motion.span
            className="absolute text-xs font-medium text-background"
            style={{
              bottom: "29px",
              left: "24px",
              paddingLeft: "16px",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.2 }}
          >
            Submit →
          </motion.span>
        )}
      </div>
    </motion.div>
  );
}
