import { db, eq } from "@repo/database";
import { formsTable } from "@repo/database/models/form";
import { nanoid } from "nanoid";

export class SlugService {
  /**
   * Reserved keywords that cannot be used as custom slugs
   */
  private reservedSlugs = new Set([
    "api",
    "auth",
    "admin",
    "login",
    "register",
    "dashboard",
    "settings",
    "forms",
    "workspace",
    "templates",
    "pricing",
    "about",
    "contact",
    "privacy",
    "terms",
  ]);

  /**
   * Converts a title string into a URL-safe slug.
   * e.g. "My Cool Form!" -> "my-cool-form"
   */
  private generateBaseSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "") // Remove all non-word, non-space, non-hyphen chars
      .replace(/[\s-]+/g, "-") // Replace spaces and hyphens with a single hyphen
      .replace(/^-+|-+$/g, ""); // Remove leading and trailing hyphens
  }

  /**
   * Checks if a slug is available in the database.
   */
  async checkAvailability(slug: string): Promise<boolean> {
    if (this.reservedSlugs.has(slug)) {
      return false;
    }

    const [existing] = await db
      .select({ id: formsTable.id })
      .from(formsTable)
      .where(eq(formsTable.slug, slug))
      .limit(1);

    return !existing;
  }

  /**
   * Validates a custom slug provided by the user.
   */
  validateCustomSlug(slug: string): { valid: boolean; error?: string } {
    if (slug.length < 3 || slug.length > 50) {
      return { valid: false, error: "Slug must be between 3 and 50 characters" };
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      return { valid: false, error: "Slug can only contain lowercase letters, numbers, and hyphens" };
    }

    if (this.reservedSlugs.has(slug)) {
      return { valid: false, error: "This slug is reserved and cannot be used" };
    }

    return { valid: true };
  }

  /**
   * Automatically generates a unique slug for a given title.
   * If the title results in an empty string (e.g. all special characters), it falls back to a random nanoid.
   * If the base slug exists, it appends an incrementing counter or random characters.
   */
  async generateSlug(title: string): Promise<string> {
    let baseSlug = this.generateBaseSlug(title);

    // Fallback to completely random if baseSlug is empty
    if (!baseSlug || baseSlug.length < 2) {
      baseSlug = nanoid(10).toLowerCase();
    }

    // Direct match check
    let isAvailable = await this.checkAvailability(baseSlug);
    if (isAvailable) {
      return baseSlug;
    }

    // Collision detected, try appending numbers up to 10 times
    for (let i = 1; i <= 10; i++) {
      const suffixedSlug = `${baseSlug}-${i}`;
      isAvailable = await this.checkAvailability(suffixedSlug);
      if (isAvailable) {
        return suffixedSlug;
      }
    }

    // If still colliding after 10 tries, append a random string
    const fallbackSlug = `${baseSlug}-${nanoid(6).toLowerCase()}`;
    return fallbackSlug;
  }
}
