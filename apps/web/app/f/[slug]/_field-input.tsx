"use client";

import * as React from "react";
import type { ThemeConfig } from "~/components/form-themes";

interface FieldInputProps {
  field: any;
  answers: Record<string, any>;
  setAnswers: (a: Record<string, any>) => void;
  errors: Record<string, string>;
  theme: ThemeConfig;
}

export function FieldInput({ field, answers, setAnswers, errors, theme }: FieldInputProps) {
  const value = answers[field.id] ?? "";
  const onChange = (v: any) => setAnswers({ ...answers, [field.id]: v });
  const inputStyle: React.CSSProperties = {
    background: theme.colors.surface,
    border: `${theme.shape.border.width}px ${theme.shape.border.style} ${errors[field.id] ? theme.colors.danger : theme.colors.border}`,
    borderRadius: `${theme.shape.radius}px`,
    color: theme.colors.foreground,
    padding: "0.75rem 1rem",
    width: "100%",
    fontSize: `${theme.fonts.scale.body}rem`,
  };

  switch (field.type) {
    case "long_text":
      return (
        <textarea
          id={`input-${field.id}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyle}
          rows={4}
          placeholder={field.placeholder ?? ""}
          aria-invalid={!!errors[field.id]}
        />
      );
    case "number":
      return (
        <input
          id={`input-${field.id}`}
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyle}
          placeholder={field.placeholder ?? ""}
          aria-invalid={!!errors[field.id]}
        />
      );
    case "email":
      return (
        <input
          id={`input-${field.id}`}
          type="email"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyle}
          placeholder={field.placeholder ?? ""}
          aria-invalid={!!errors[field.id]}
        />
      );
    case "checkbox":
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            id={`input-${field.id}`}
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            aria-invalid={!!errors[field.id]}
          />
          <span style={{ fontSize: `${theme.fonts.scale.body}rem` }}>
            {field.placeholder || "Yes"}
          </span>
        </label>
      );
    case "rating": {
      const max = field.settings?.ratingMax ?? 5;
      return (
        <div className="flex gap-1">
          {Array.from({ length: max }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onChange(i + 1)}
              className="text-2xl"
              style={{ color: (value ?? 0) > i ? theme.colors.accent : theme.colors.border }}
            >
              ★
            </button>
          ))}
        </div>
      );
    }
    default:
      return (
        <input
          id={`input-${field.id}`}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyle}
          placeholder={field.placeholder ?? ""}
          aria-invalid={!!errors[field.id]}
        />
      );
  }
}
