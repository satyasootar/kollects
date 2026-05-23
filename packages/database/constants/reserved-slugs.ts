export const RESERVED_SLUGS = [
  "api",
  "admin",
  "explore",
  "pricing",
  "dashboard",
  "login",
  "signup",
  "settings",
  "templates",
  "forms",
] as const;

export type ReservedSlug = (typeof RESERVED_SLUGS)[number];
