export const API_SCOPES = [
  "forms:read",
  "forms:write",
  "responses:read",
  "analytics:read",
] as const;

export type ApiScope = (typeof API_SCOPES)[number];
