export const FORM_VISIBILITIES = ["public", "unlisted", "private"] as const;

export type FormVisibility = (typeof FORM_VISIBILITIES)[number];
