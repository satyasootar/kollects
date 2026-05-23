import { RESERVED_SLUGS } from "../constants/reserved-slugs";

/**
 * Regex for valid slug format.
 * Rules: 4-64 chars, lowercase alphanumeric + hyphens, cannot start/end with hyphen.
 */
export const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{2,62}[a-z0-9]$/;

/**
 * Check if a slug is a reserved word.
 */
export function isReservedSlug(slug: string): boolean {
  return (RESERVED_SLUGS as readonly string[]).includes(slug.toLowerCase());
}

/**
 * Validate a slug string against format rules and reserved words.
 */
export function isValidSlug(slug: string): {
  valid: boolean;
  error?: string;
} {
  if (!slug || slug.length < 4) {
    return { valid: false, error: "Slug must be at least 4 characters" };
  }

  if (slug.length > 64) {
    return { valid: false, error: "Slug must be at most 64 characters" };
  }

  if (!SLUG_REGEX.test(slug)) {
    return {
      valid: false,
      error:
        "Slug must contain only lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen",
    };
  }

  if (isReservedSlug(slug)) {
    return { valid: false, error: `"${slug}" is a reserved word` };
  }

  return { valid: true };
}

/**
 * Convert a text string into a URL-safe slug.
 * - Lowercases the text
 * - Replaces spaces and special characters with hyphens
 * - Collapses multiple hyphens
 * - Trims leading/trailing hyphens
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // remove non-word chars (except spaces and hyphens)
    .replace(/[\s_]+/g, "-") // replace spaces and underscores with hyphens
    .replace(/-+/g, "-") // collapse multiple hyphens
    .replace(/^-+|-+$/g, ""); // trim leading/trailing hyphens
}
