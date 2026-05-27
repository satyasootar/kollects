/**
 * Phase 1 — Token verification test.
 * Reads globals.css and asserts all DESIGN.md §2.1 tokens are present.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const css = readFileSync(resolve(__dirname, "../../app/globals.css"), "utf-8");

describe("Design tokens (DESIGN.md §2.1)", () => {
  describe("Light mode (:root) — core surfaces", () => {
    it.each([
      "--background",
      "--foreground",
      "--card",
      "--card-foreground",
      "--popover",
      "--popover-foreground",
      "--primary",
      "--primary-foreground",
      "--secondary",
      "--secondary-foreground",
      "--muted",
      "--muted-foreground",
      "--accent",
      "--accent-foreground",
      "--destructive",
      "--border",
      "--input",
      "--ring",
    ])("defines %s", (token) => {
      // Tokens can be oklch(...) values or var(...) references
      expect(css).toMatch(new RegExp(`${token}:\\s*(oklch|var)`));
    });
  });

  describe("Pastel tint palette", () => {
    it.each([
      "--tint-mint",
      "--tint-peach",
      "--tint-blush",
      "--tint-butter",
      "--tint-sky",
      "--tint-lilac",
      "--tint-mint-ink",
      "--tint-peach-ink",
      "--tint-blush-ink",
      "--tint-butter-ink",
      "--tint-sky-ink",
      "--tint-lilac-ink",
    ])("defines %s", (token) => {
      expect(css).toMatch(new RegExp(`${token}:\\s*oklch`));
    });
  });

  describe("Status palette", () => {
    it.each([
      "--status-draft",
      "--status-published",
      "--status-archived",
      "--status-private",
      "--status-unlisted",
    ])("defines %s", (token) => {
      expect(css).toMatch(new RegExp(`${token}:\\s*oklch`));
    });
  });

  describe("Doodle ink", () => {
    it.each(["--doodle", "--doodle-soft"])("defines %s", (token) => {
      expect(css).toMatch(new RegExp(`${token}:\\s*oklch`));
    });
  });

  describe("Easing constants (DESIGN.md §2.6)", () => {
    it.each(["--ease-out-quint", "--ease-soft", "--ease-pen"])(
      "defines %s",
      (token) => {
        expect(css).toMatch(new RegExp(`${token}:\\s*cubic-bezier`));
      },
    );
  });

  describe("Tailwind color registrations (@theme inline)", () => {
    it.each([
      "--color-tint-mint",
      "--color-tint-mint-ink",
      "--color-tint-peach",
      "--color-tint-peach-ink",
      "--color-tint-blush",
      "--color-tint-blush-ink",
      "--color-tint-butter",
      "--color-tint-butter-ink",
      "--color-tint-sky",
      "--color-tint-sky-ink",
      "--color-tint-lilac",
      "--color-tint-lilac-ink",
      "--color-status-draft",
      "--color-status-published",
      "--color-status-archived",
      "--color-status-private",
      "--color-status-unlisted",
      "--color-doodle",
      "--color-doodle-soft",
    ])("registers %s in @theme inline", (token) => {
      expect(css).toContain(token);
    });
  });

  describe("Font family registrations", () => {
    it.each(["--font-sans", "--font-mono", "--font-display"])(
      "registers %s in @theme inline",
      (token) => {
        expect(css).toContain(token);
      },
    );
  });

  describe("Display type scale utilities", () => {
    it.each([
      ".text-display-xl",
      ".text-display-lg",
      ".text-display-md",
      ".text-caption",
      ".text-mono-sm",
    ])("defines %s utility", (cls) => {
      expect(css).toContain(cls);
    });
  });

  describe("Reduced motion guard", () => {
    it("includes prefers-reduced-motion media query", () => {
      expect(css).toContain("prefers-reduced-motion: reduce");
    });

    it("collapses animation-duration", () => {
      expect(css).toMatch(/animation-duration:\s*0\.01ms\s*!important/);
    });

    it("collapses transition-duration", () => {
      expect(css).toMatch(/transition-duration:\s*0\.01ms\s*!important/);
    });
  });

  describe("Dark mode tokens", () => {
    it("dark mode is disabled (light-only product)", () => {
      // We intentionally removed the .dark block — light mode only
      expect(css).toContain("DARK MODE — disabled");
    });
  });
});
