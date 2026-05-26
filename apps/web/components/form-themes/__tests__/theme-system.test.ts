import { themeConfigSchema, type ThemeConfig } from "../_types";
import {
  loadTheme,
  DEFAULT_LIGHT_THEME,
  registerTheme,
} from "../_registry";

describe("ThemeConfig schema", () => {
  it("validates the default-light theme", () => {
    expect(() => themeConfigSchema.parse(DEFAULT_LIGHT_THEME)).not.toThrow();
  });

  it("rejects a theme with invalid id", () => {
    const invalid = { ...DEFAULT_LIGHT_THEME, id: "INVALID ID" };
    expect(() => themeConfigSchema.parse(invalid)).toThrow();
  });

  it("rejects a theme with missing colors", () => {
    const invalid = { ...DEFAULT_LIGHT_THEME, colors: {} };
    expect(() => themeConfigSchema.parse(invalid)).toThrow();
  });

  it("rejects a theme with invalid category", () => {
    const invalid = { ...DEFAULT_LIGHT_THEME, category: "invalid-cat" };
    expect(() => themeConfigSchema.parse(invalid)).toThrow();
  });

  it("accepts all valid categories", () => {
    const categories = [
      "marvel", "dc", "os", "nature", "city", "custom",
      "startup", "tech", "anime", "game", "event", "community",
    ];
    for (const cat of categories) {
      const theme = { ...DEFAULT_LIGHT_THEME, category: cat };
      expect(() => themeConfigSchema.parse(theme)).not.toThrow();
    }
  });

  it("accepts all valid questionEnter animations", () => {
    const anims = [
      "slide-up", "slide-side", "fade", "type-on",
      "comic-pop", "boot-up", "leaf-fall", "rain-in", "snow-in",
    ];
    for (const anim of anims) {
      const theme = {
        ...DEFAULT_LIGHT_THEME,
        motion: { ...DEFAULT_LIGHT_THEME.motion, questionEnter: anim },
      };
      expect(() => themeConfigSchema.parse(theme)).not.toThrow();
    }
  });
});

describe("Theme registry", () => {
  it("returns default-light for unknown theme id", async () => {
    const theme = await loadTheme("nonexistent-theme");
    expect(theme.id).toBe("default-light");
  });

  it("loads a registered theme", async () => {
    const mockTheme: ThemeConfig = {
      ...DEFAULT_LIGHT_THEME,
      id: "test.mock",
      name: "Mock Theme",
    };
    registerTheme("test.mock", () =>
      Promise.resolve({ default: mockTheme }),
    );

    const loaded = await loadTheme("test.mock");
    expect(loaded.id).toBe("test.mock");
    expect(loaded.name).toBe("Mock Theme");
  });

  it("falls back to default-light on invalid theme config", async () => {
    registerTheme("test.invalid", () =>
      Promise.resolve({ default: { id: "INVALID" } as any }),
    );

    const loaded = await loadTheme("test.invalid");
    expect(loaded.id).toBe("default-light");
  });
});
