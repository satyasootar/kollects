import { describe, it, expect, vi, beforeEach } from "vitest";
import { SlugService } from "../../../services/slug";
import { db } from "@repo/database";

// Mock the database
vi.mock("@repo/database", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@repo/database")>();
  return {
    ...actual,
    db: {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue([]),
          })),
        })),
      })),
    },
  };
});

describe("SlugService", () => {
  let slugService: SlugService;

  beforeEach(() => {
    slugService = new SlugService();
    vi.clearAllMocks();
  });

  describe("validateCustomSlug", () => {
    it("should reject slugs with invalid characters", () => {
      const result = slugService.validateCustomSlug("Invalid_Slug!");
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/lowercase letters, numbers, and hyphens/);
    });

    it("should reject slugs that are too short", () => {
      const result = slugService.validateCustomSlug("ab");
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/between 3 and 50 characters/);
    });

    it("should reject reserved slugs", () => {
      const result = slugService.validateCustomSlug("admin");
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/reserved/);
    });

    it("should accept valid slugs", () => {
      const result = slugService.validateCustomSlug("my-awesome-form-123");
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe("generateSlug", () => {
    it("should generate a clean base slug from a title", async () => {
      const slug = await slugService.generateSlug("Hello World! 123");
      expect(slug).toBe("hello-world-123");
    });

    it("should strip multiple spaces and hyphens", async () => {
      const slug = await slugService.generateSlug("My ---   Awesome   Form");
      expect(slug).toBe("my-awesome-form");
    });
  });
});
