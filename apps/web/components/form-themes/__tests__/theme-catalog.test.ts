import { themeConfigSchema } from "../_types";

// Import all theme configs directly for validation
import defaultLight from "../themes/default-light";
import ironman from "../themes/marvel-ironman";
import captainamerica from "../themes/marvel-captainamerica";
import hulk from "../themes/marvel-hulk";
import batman from "../themes/dc-batman";
import superman from "../themes/dc-superman";
import windowsxp from "../themes/os-windowsxp";
import macos from "../themes/os-macos";
import linuxTerminal from "../themes/os-linux-terminal";
import forest from "../themes/nature-forest";
import osaka from "../themes/city-osaka";
import mumbai from "../themes/city-mumbai";

const ALL_THEMES = [
  defaultLight, ironman, captainamerica, hulk,
  batman, superman, windowsxp, macos, linuxTerminal, forest, osaka, mumbai,
];

describe("Theme Catalog — all 12 themes validate", () => {
  it.each(ALL_THEMES.map((t) => [t.id, t]))(
    "%s validates against schema",
    (_id, theme) => {
      expect(() => themeConfigSchema.parse(theme)).not.toThrow();
    },
  );

  it("all themes have unique IDs", () => {
    const ids = ALL_THEMES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("covers all required categories", () => {
    const categories = new Set(ALL_THEMES.map((t) => t.category));
    expect(categories.has("marvel")).toBe(true);
    expect(categories.has("dc")).toBe(true);
    expect(categories.has("os")).toBe(true);
    expect(categories.has("nature")).toBe(true);
    expect(categories.has("city")).toBe(true);
  });
});
