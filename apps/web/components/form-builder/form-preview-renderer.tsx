"use client";

import * as React from "react";
import type { ThemeConfig } from "~/components/form-themes";
import { cn } from "~/lib/utils";
import { Info } from "lucide-react";

interface FormPreviewRendererProps {
  fields: any[];
  formTitle: string;
  formDescription?: string;
  coverImageUrl?: string | null;
  themeConfig?: ThemeConfig | null;
  className?: string;
}

function getGoogleFontUrl(fontFamily: string) {
  if (!fontFamily) return null;
  const match = fontFamily.match(/'([^']+)'/);
  if (match && match[1]) {
    const fontName = match[1];
    if (fontName === "Comic Sans MS" || fontName.toLowerCase().includes("system")) return null;
    return `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, "+")}:wght@400;500;600;700&display=swap`;
  }
  return null;
}

/**
 * Renders a form with its fields using a given theme config.
 * Used in Theme Designer live preview and Multi-device Preview.
 */
export function FormPreviewRenderer({
  fields,
  formTitle,
  formDescription,
  coverImageUrl,
  themeConfig,
  className,
}: FormPreviewRendererProps) {
  // Use theme config or fallback defaults
  const colors = themeConfig?.colors ?? {
    background: "#ffffff",
    surface: "#f9fafb",
    foreground: "#111827",
    foregroundSoft: "#6b7280",
    accent: "#0d2e2a",
    accentForeground: "#ffffff",
    border: "#e5e7eb",
    success: "#10b981",
    danger: "#ef4444",
  };

  const fonts = themeConfig?.fonts ?? {
    display: "system-ui, sans-serif",
    body: "system-ui, sans-serif",
    weights: { display: 700, body: 400 },
    scale: { hero: 2.25, question: 1.25, body: 1, helper: 0.875 },
  };

  const shape = themeConfig?.shape ?? {
    radius: 10,
    radiusLg: 16,
    border: { width: 1, style: "solid" as const, color: colors.border },
    shadow: "0 1px 2px rgba(0,0,0,0.05)",
    shadowFocus: "0 0 0 2px rgba(0,0,0,0.1)",
  };

  const displayFontUrl = React.useMemo(() => getGoogleFontUrl(fonts.display), [fonts.display]);
  const bodyFontUrl = React.useMemo(() => getGoogleFontUrl(fonts.body), [fonts.body]);

  return (
    <>
      {displayFontUrl && <link href={displayFontUrl} rel="stylesheet" />}
      {bodyFontUrl && displayFontUrl !== bodyFontUrl && <link href={bodyFontUrl} rel="stylesheet" />}
      <div
        className={cn("rounded-2xl overflow-hidden border border-border shadow-sm", className)}
        style={{ background: colors.background }}
      >
      {/* Cover image */}
      {coverImageUrl && (
        <div className="w-full h-40 overflow-hidden">
          <img
            src={coverImageUrl}
            alt="Form cover"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-6 space-y-5">
        {/* Form title */}
        <div>
          <h2
            style={{
              color: colors.foreground,
              fontFamily: fonts.display,
              fontWeight: fonts.weights.display,
              fontSize: `${fonts.scale.hero * 0.7}rem`,
              letterSpacing: themeConfig?.fonts?.letterSpacing?.hero,
              textTransform: themeConfig?.fonts?.textTransform as any,
            }}
          >
            {formTitle || "Untitled Form"}
          </h2>
          {formDescription && (
            <p
              className="mt-1"
              style={{
                color: colors.foregroundSoft,
                fontFamily: fonts.body,
                fontSize: `${fonts.scale.helper}rem`,
              }}
            >
              {formDescription}
            </p>
          )}
        </div>

        {/* Fields */}
        {fields.length === 0 ? (
          <div
            className="py-12 text-center rounded-xl border-2 border-dashed"
            style={{ borderColor: colors.border, color: colors.foregroundSoft }}
          >
            <p style={{ fontFamily: fonts.body, fontSize: `${fonts.scale.body * 0.9}rem` }}>
              No fields added yet
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {fields.map((field: any) => (
              <PreviewField
                key={field.id}
                field={field}
                colors={colors}
                fonts={fonts}
                shape={shape}
              />
            ))}
          </div>
        )}

        {/* Submit button */}
        {fields.length > 0 && (
          <button
            className="px-5 py-2.5 font-medium text-sm cursor-default"
            style={{
              background: colors.accent,
              color: colors.accentForeground,
              borderRadius: `${shape.radius}px`,
              fontFamily: fonts.body,
            }}
          >
            Submit
          </button>
        )}
      </div>
      </div>
    </>
  );
}

// ─── Individual Field Previews ──────────────────────────────────────────────────
function PreviewField({
  field,
  colors,
  fonts,
  shape,
}: {
  field: any;
  colors: any;
  fonts: any;
  shape: any;
}) {
  const inputStyle: React.CSSProperties = {
    background: colors.surface,
    border: `${shape.border.width}px ${shape.border.style} ${colors.border}`,
    borderRadius: `${shape.radius}px`,
    padding: "8px 12px",
    fontFamily: fonts.body,
    fontSize: `${fonts.scale.body * 0.85}rem`,
    color: colors.foregroundSoft,
    width: "100%",
  };

  return (
    <div>
      <label
        className="block mb-1.5"
        style={{
          color: colors.foreground,
          fontFamily: fonts.body,
          fontSize: `${fonts.scale.body * 0.85}rem`,
          fontWeight: 500,
        }}
      >
        {field.label}
        {field.required && (
          <span style={{ color: colors.danger }} className="ml-0.5">*</span>
        )}
        {field.helpText && (
          <span
            title={field.helpText}
            className="ml-2 inline-flex cursor-help opacity-50 hover:opacity-100 transition-opacity"
          >
            <Info className="size-4 inline-block" />
          </span>
        )}
      </label>

      {renderFieldInput(field, inputStyle, colors, shape, fonts)}
    </div>
  );
}

function renderFieldInput(
  field: any,
  inputStyle: React.CSSProperties,
  colors: any,
  shape: any,
  fonts: any,
) {
  const placeholder = field.placeholder || "";

  switch (field.type) {
    case "long_text":
      return (
        <div style={{ ...inputStyle, height: "80px" }}>
          {placeholder}
        </div>
      );

    case "checkbox":
      return (
        <div className="flex items-center gap-2">
          <div
            className="shrink-0"
            style={{
              width: "18px",
              height: "18px",
              borderRadius: `${Math.min(shape.radius, 4)}px`,
              border: `${shape.border.width}px ${shape.border.style} ${colors.border}`,
              background: colors.surface,
            }}
          />
          <span
            style={{
              color: colors.foregroundSoft,
              fontFamily: fonts.body,
              fontSize: `${fonts.scale.body * 0.85}rem`,
            }}
          >
            {placeholder || "Checkbox"}
          </span>
        </div>
      );

    case "rating":
      return (
        <div className="flex gap-1">
          {Array.from({ length: field.settings?.ratingMax ?? 5 }).map((_, i) => (
            <span key={i} style={{ color: colors.border, fontSize: "1.25rem" }}>★</span>
          ))}
        </div>
      );

    case "single_select":
    case "multi_select":
      if (field.options && field.options.length > 0) {
        return (
          <div className="space-y-2">
            {field.options.map((opt: any, i: number) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className="shrink-0"
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: field.type === "single_select" ? "50%" : `${Math.min(shape.radius, 4)}px`,
                    border: `${shape.border.width}px ${shape.border.style} ${colors.border}`,
                    background: colors.surface,
                  }}
                />
                <span
                  style={{
                    color: colors.foreground,
                    fontFamily: fonts.body,
                    fontSize: `${fonts.scale.body * 0.85}rem`,
                  }}
                >
                  {opt.label}
                </span>
              </div>
            ))}
          </div>
        );
      }
      return <div style={{ ...inputStyle, height: "40px" }}>{placeholder || "Select an option..."}</div>;

    default:
      return <div style={{ ...inputStyle, height: "40px" }}>{placeholder}</div>;
  }
}
