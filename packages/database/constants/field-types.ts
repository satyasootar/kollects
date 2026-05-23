export const FIELD_TYPES = [
  "short_text",
  "long_text",
  "email",
  "number",
  "date",
  "single_select",
  "multi_select",
  "checkbox",
  "rating",
  "url",
  "phone",
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];
