export const FORM_VISIBILITIES = ["public", "unlisted"] as const;

export type FormVisibility = (typeof FORM_VISIBILITIES)[number];
