export const EMAIL_TYPES = [
  "creator_notification",
  "respondent_confirmation",
  "weekly_digest",
] as const;

export type EmailType = (typeof EMAIL_TYPES)[number];
