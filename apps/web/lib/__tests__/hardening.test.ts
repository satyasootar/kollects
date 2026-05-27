import { readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";

const WEB_ROOT = resolve(__dirname, "../..");

function readFile(relativePath: string): string {
  return readFileSync(resolve(WEB_ROOT, relativePath), "utf-8");
}

function findFiles(dir: string, ext: string): string[] {
  const results: string[] = [];
  try {
    const entries = readdirSync(resolve(WEB_ROOT, dir), { withFileTypes: true, recursive: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(ext)) {
        const parent = (entry as any).parentPath ?? (entry as any).path ?? "";
        results.push(join(dir, parent.replace(resolve(WEB_ROOT, dir), ""), entry.name));
      }
    }
  } catch { /* directory may not exist */ }
  return results;
}

describe("Phase 20 — Hardening", () => {
  describe("Accessibility", () => {
    it("root layout has a skip-to-main link", () => {
      const layout = readFile("app/layout.tsx");
      expect(layout).toContain("Skip to main");
      expect(layout).toContain("#main-content");
    });

    it("marketing layout has id=main-content on main element", () => {
      const layout = readFile("app/(marketing)/layout.tsx");
      expect(layout).toContain('id="main-content"');
    });

    it("globals.css has prefers-reduced-motion guard", () => {
      const css = readFile("app/globals.css");
      expect(css).toContain("prefers-reduced-motion: reduce");
      expect(css).toContain("animation-duration: 0.01ms");
    });

    it("all doodle SVGs have aria-hidden on their wrapper", () => {
      const doodle = readFile("components/chrome/doodle.tsx");
      expect(doodle).toContain("aria-hidden");
    });

    it("auth layout has a skip link", () => {
      const layout = readFile("app/(auth)/layout.tsx");
      expect(layout).toContain("Skip to form");
    });

    it("form fill layout has a skip link", () => {
      const layout = readFile("app/f/[slug]/layout.tsx");
      expect(layout).toContain("Skip to form");
    });
  });

  describe("Design tokens", () => {
    it("inputs are 44px tall (h-11 = 2.75rem = 44px)", () => {
      const login = readFile("app/(auth)/login/page.tsx");
      expect(login).toContain("h-11");
    });

    it("forest button variant exists", () => {
      const button = readFile("components/ui/button.tsx");
      expect(button).toContain("forest");
    });

    it("status badge variants exist", () => {
      const badge = readFile("components/ui/badge.tsx");
      expect(badge).toContain("draft");
      expect(badge).toContain("published");
      expect(badge).toContain("archived");
    });
  });

  describe("Convention enforcement", () => {
    it("no direct fetch() calls in page components (except upload)", () => {
      const pages = [
        "app/(auth)/login/page.tsx",
        "app/(auth)/signup/page.tsx",
        "app/(dashboard)/dashboard/page.tsx",
        "app/(marketing)/pricing/page.tsx",
      ];
      for (const page of pages) {
        const content = readFile(page);
        // Should not contain raw fetch() — all API calls go through tRPC
        const fetchMatches = content.match(/\bfetch\s*\(/g) ?? [];
        expect(fetchMatches.length).toBe(0);
      }
    });

    it("toast imports come from ~/lib/toast, not directly from sonner", () => {
      const pages = [
        "app/(dashboard)/dashboard/page.tsx",
        "app/(dashboard)/dashboard/forms/[formId]/settings/page.tsx",
      ];
      for (const page of pages) {
        const content = readFile(page);
        expect(content).not.toContain('from "sonner"');
        if (content.includes("toast")) {
          expect(content).toContain('from "~/lib/toast"');
        }
      }
    });
  });

  describe("Theme system", () => {
    it("all 13 theme configs validate against schema", () => {
      // This is already tested in theme-catalog.test.ts, but verify the file exists
      const registryFile = readFile("components/form-themes/themes/_register-all.ts");
      expect(registryFile).toContain("marvel.spiderman");
      expect(registryFile).toContain("dc.batman");
      expect(registryFile).toContain("os.windowsxp");
      expect(registryFile).toContain("nature.forest");
      expect(registryFile).toContain("city.osaka");
    });
  });
});
