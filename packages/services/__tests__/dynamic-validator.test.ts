import { describe, it, expect } from "vitest";
import { buildValidationSchema } from "../submission/dynamic-validator";
import { type SelectFormField } from "@repo/database/models/form-field";

describe("Dynamic Zod Validator", () => {
  it("should validate short_text and long_text with min/max and pattern", () => {
    const fields: SelectFormField[] = [
      {
        id: "field1",
        type: "short_text",
        required: true,
        validations: { minLength: 2, maxLength: 5 },
      } as any,
      {
        id: "field2",
        type: "long_text",
        required: false,
        validations: { pattern: "^[a-z]+$" },
      } as any,
    ];

    const schema = buildValidationSchema(fields);

    expect(schema.safeParse({ field1: "a" }).success).toBe(false); // Too short
    expect(schema.safeParse({ field1: "abcdef" }).success).toBe(false); // Too long
    expect(schema.safeParse({ field1: "abc" }).success).toBe(true); // Valid, field2 is optional

    expect(schema.safeParse({ field1: "abc", field2: "123" }).success).toBe(false); // Fails pattern
    expect(schema.safeParse({ field1: "abc", field2: "abc" }).success).toBe(true); // Valid
  });

  it("should validate emails correctly", () => {
    const fields: SelectFormField[] = [
      { id: "emailField", type: "email", required: true } as any,
    ];
    const schema = buildValidationSchema(fields);

    expect(schema.safeParse({ emailField: "not-an-email" }).success).toBe(false);
    expect(schema.safeParse({ emailField: "test@example.com" }).success).toBe(true);
  });

  it("should validate numbers with min/max bounds", () => {
    const fields: SelectFormField[] = [
      {
        id: "numField",
        type: "number",
        required: true,
        validations: { min: 10, max: 100 },
      } as any,
    ];
    const schema = buildValidationSchema(fields);

    expect(schema.safeParse({ numField: 5 }).success).toBe(false);
    expect(schema.safeParse({ numField: 105 }).success).toBe(false);
    expect(schema.safeParse({ numField: "50" }).success).toBe(false); // Must be a number type
    expect(schema.safeParse({ numField: 50 }).success).toBe(true);
  });

  it("should enforce single_select options", () => {
    const fields: SelectFormField[] = [
      {
        id: "selectField",
        type: "single_select",
        required: true,
        options: [{ label: "A", value: "a" }, { label: "B", value: "b" }],
      } as any,
    ];
    const schema = buildValidationSchema(fields);

    expect(schema.safeParse({ selectField: "c" }).success).toBe(false);
    expect(schema.safeParse({ selectField: "a" }).success).toBe(true);
  });

  it("should enforce multi_select options", () => {
    const fields: SelectFormField[] = [
      {
        id: "multiSelect",
        type: "multi_select",
        required: true,
        options: [{ label: "Apple", value: "apple" }, { label: "Banana", value: "banana" }],
      } as any,
    ];
    const schema = buildValidationSchema(fields);

    expect(schema.safeParse({ multiSelect: "apple" }).success).toBe(false); // Must be array
    expect(schema.safeParse({ multiSelect: ["apple", "cherry"] }).success).toBe(false); // 'cherry' invalid
    expect(schema.safeParse({ multiSelect: ["apple", "banana"] }).success).toBe(true);
  });

  it("should validate boolean checkbox", () => {
    const fields: SelectFormField[] = [
      { id: "checkboxField", type: "checkbox", required: true } as any,
    ];
    const schema = buildValidationSchema(fields);

    expect(schema.safeParse({ checkboxField: "true" }).success).toBe(false);
    expect(schema.safeParse({ checkboxField: true }).success).toBe(true);
  });

  it("should validate ratings", () => {
    const fields: SelectFormField[] = [
      { id: "ratingField", type: "rating", required: true, settings: { maxRating: 10 } } as any,
    ];
    const schema = buildValidationSchema(fields);

    expect(schema.safeParse({ ratingField: 0 }).success).toBe(false); // < 1
    expect(schema.safeParse({ ratingField: 11 }).success).toBe(false); // > 10
    expect(schema.safeParse({ ratingField: 5.5 }).success).toBe(false); // Not an int
    expect(schema.safeParse({ ratingField: 5 }).success).toBe(true);
  });
});
