"use client";

import * as React from "react";
import type { ThemeConfig } from "./_types";

interface FormThemeProviderProps {
  theme: ThemeConfig;
  children: React.ReactNode;
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

export function FormThemeProvider({ theme, children }: FormThemeProviderProps) {
  const cssVars = React.useMemo(() => {
    const vars: Record<string, string> = {
      "--theme-bg": theme.colors.background,
      "--theme-surface": theme.colors.surface,
      "--theme-surface-muted": theme.colors.surfaceMuted,
      "--theme-border": theme.colors.border,
      "--theme-foreground": theme.colors.foreground,
      "--theme-foreground-soft": theme.colors.foregroundSoft,
      "--theme-accent": theme.colors.accent,
      "--theme-accent-foreground": theme.colors.accentForeground,
      "--theme-success": theme.colors.success,
      "--theme-danger": theme.colors.danger,
      "--theme-radius": `${theme.shape.radius}px`,
      "--theme-radius-lg": `${theme.shape.radiusLg}px`,
      "--theme-shadow": theme.shape.shadow,
      "--theme-shadow-focus": theme.shape.shadowFocus,
      "--theme-border-width": `${theme.shape.border.width}px`,
      "--theme-border-style": theme.shape.border.style,
      "--theme-border-color": theme.shape.border.color,
      "--theme-font-display": theme.fonts.display,
      "--theme-font-body": theme.fonts.body,
      "--theme-transition-ms": `${theme.motion.transitionMs}ms`,
      "--theme-easing": theme.motion.easing,
    };
    if (theme.fonts.mono) vars["--theme-font-mono"] = theme.fonts.mono;
    if (theme.colors.backgroundOverlay) {
      vars["--theme-bg-overlay"] = theme.colors.backgroundOverlay;
    }
    if (theme.motion.cursor) vars["--theme-cursor"] = theme.motion.cursor;
    return vars;
  }, [theme]);

  const displayFontUrl = React.useMemo(() => getGoogleFontUrl(theme.fonts.display), [theme.fonts.display]);
  const bodyFontUrl = React.useMemo(() => getGoogleFontUrl(theme.fonts.body), [theme.fonts.body]);

  return (
    <>
      {displayFontUrl && <link href={displayFontUrl} rel="stylesheet" />}
      {bodyFontUrl && displayFontUrl !== bodyFontUrl && <link href={bodyFontUrl} rel="stylesheet" />}
      <div
        data-theme={theme.id}
        data-color-scheme={theme.colorScheme}
        data-question-layout={theme.chrome.questionLayout}
        data-progress-bar={theme.chrome.progressBar}
        style={cssVars as React.CSSProperties}
        className="min-h-screen"
      >
        {children}
      </div>
    </>
  );
}
