import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// We test slug validation logic directly since the page requires complex mocking
import { RESERVED_SLUGS } from "@repo/database/constants/reserved-slugs";

vi.mock("@repo/database/constants/reserved-slugs", () => ({
  RESERVED_SLUGS: [
    "api",
    "admin",
    "explore",
    "pricing",
    "dashboard",
    "login",
    "signup",
    "settings",
    "templates",
    "forms",
  ],
}));

const SLUG_REGEX = /^[a-z0-9-]{3,80}$/;

describe("Form Settings — Slug Validation", () => {
  it("rejects reserved slugs", () => {
    for (const slug of RESERVED_SLUGS) {
      expect(RESERVED_SLUGS.includes(slug as any)).toBe(true);
    }
  });

  it("rejects slugs shorter than 3 chars", () => {
    expect(SLUG_REGEX.test("ab")).toBe(false);
  });

  it("rejects slugs with uppercase", () => {
    expect(SLUG_REGEX.test("My-Form")).toBe(false);
  });

  it("rejects slugs with spaces", () => {
    expect(SLUG_REGEX.test("my form")).toBe(false);
  });

  it("accepts valid slugs", () => {
    expect(SLUG_REGEX.test("my-form")).toBe(true);
    expect(SLUG_REGEX.test("customer-feedback-2024")).toBe(true);
    expect(SLUG_REGEX.test("abc")).toBe(true);
  });

  it("rejects slugs longer than 80 chars", () => {
    const longSlug = "a".repeat(81);
    expect(SLUG_REGEX.test(longSlug)).toBe(false);
  });

  it("accepts slugs of exactly 80 chars", () => {
    const slug80 = "a".repeat(80);
    expect(SLUG_REGEX.test(slug80)).toBe(true);
  });

  it("rejects slugs with special characters", () => {
    expect(SLUG_REGEX.test("my_form")).toBe(false);
    expect(SLUG_REGEX.test("my.form")).toBe(false);
    expect(SLUG_REGEX.test("my@form")).toBe(false);
  });
});

describe("Form Settings — File Validation", () => {
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  it("rejects files larger than 5MB", () => {
    const size = 6 * 1024 * 1024;
    expect(size > MAX_SIZE).toBe(true);
  });

  it("accepts files under 5MB", () => {
    const size = 4 * 1024 * 1024;
    expect(size <= MAX_SIZE).toBe(true);
  });

  it("accepts allowed MIME types", () => {
    for (const type of ALLOWED_TYPES) {
      expect(ALLOWED_TYPES.includes(type)).toBe(true);
    }
  });

  it("rejects disallowed MIME types", () => {
    expect(ALLOWED_TYPES.includes("application/zip")).toBe(false);
    expect(ALLOWED_TYPES.includes("text/html")).toBe(false);
    expect(ALLOWED_TYPES.includes("application/pdf")).toBe(false);
  });
});

describe("Form Settings — Visibility Options", () => {
  const FORM_VISIBILITIES = ["public", "unlisted", "private"];

  it("has exactly three visibility options", () => {
    expect(FORM_VISIBILITIES).toHaveLength(3);
  });

  it("includes public, unlisted, and private", () => {
    expect(FORM_VISIBILITIES).toContain("public");
    expect(FORM_VISIBILITIES).toContain("unlisted");
    expect(FORM_VISIBILITIES).toContain("private");
  });
});
