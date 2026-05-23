export const FORM_STATUSES = ["draft", "published", "archived"] as const;

export type FormStatus = (typeof FORM_STATUSES)[number];
