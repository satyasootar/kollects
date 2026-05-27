import { registerTheme } from "../_registry";

// Register all built-in themes
registerTheme("default-light", () => import("./default-light"));
registerTheme("marvel.spidyform", () => import("./marvel-spidyform"));
registerTheme("marvel.ironman", () => import("./marvel-ironman"));
registerTheme("marvel.captainamerica", () => import("./marvel-captainamerica"));
registerTheme("marvel.hulk", () => import("./marvel-hulk"));
registerTheme("dc.batman", () => import("./dc-batman"));
registerTheme("dc.superman", () => import("./dc-superman"));
registerTheme("os.windowsxp", () => import("./os-windowsxp"));
registerTheme("os.macos", () => import("./os-macos"));
registerTheme("os.linux-terminal", () => import("./os-linux-terminal"));
registerTheme("nature.forest", () => import("./nature-forest"));
registerTheme("city.osaka", () => import("./city-osaka"));
registerTheme("city.mumbai", () => import("./city-mumbai"));
