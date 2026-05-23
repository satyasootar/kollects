export interface RateLimitTier {
  action: string;
  limit: number;
  windowMs: number;
  identifier: "ip" | "ip_form" | "api_key";
}

export const RATE_LIMIT_TIERS: readonly RateLimitTier[] = [
  {
    action: "form_view",
    limit: 120,
    windowMs: 60 * 1000, // 1 minute
    identifier: "ip",
  },
  {
    action: "form_submit",
    limit: 5,
    windowMs: 60 * 1000, // 1 minute
    identifier: "ip_form",
  },
  {
    action: "form_submit_hourly",
    limit: 20,
    windowMs: 60 * 60 * 1000, // 1 hour
    identifier: "ip",
  },
  {
    action: "api_call",
    limit: 60,
    windowMs: 60 * 1000, // 1 minute
    identifier: "api_key",
  },
  {
    action: "auth_attempt",
    limit: 10,
    windowMs: 15 * 60 * 1000, // 15 minutes
    identifier: "ip",
  },
  {
    action: "password_reset",
    limit: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    identifier: "ip",
  },
] as const;
