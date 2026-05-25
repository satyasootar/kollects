import { describe, it, expect } from "vitest";
import { renderTemplate } from "../../email/templates";

describe("Email Templates", () => {
  it("should replace simple variables", () => {
    const template = "Hello {{name}}, welcome to {{app}}!";
    const result = renderTemplate(template, { name: "Alice", app: "KOLLECTS" });
    expect(result).toBe("Hello Alice, welcome to KOLLECTS!");
  });

  it("should handle nested properties", () => {
    const template = "Your form '{{form.title}}' received a response from {{user.email}}.";
    const variables = {
      form: { title: "Survey 2026" },
      user: { email: "test@example.com" },
    };
    const result = renderTemplate(template, variables);
    expect(result).toBe("Your form 'Survey 2026' received a response from test@example.com.");
  });

  it("should leave unmatched placeholders intact", () => {
    const template = "Hello {{missing}}!";
    const result = renderTemplate(template, {});
    expect(result).toBe("Hello {{missing}}!");
  });

  it("should generate answers table", () => {
    const template = "{{response.answersTable}}";
    const variables = {
      fields: [
        { id: "f1", label: "What is your name?" },
        { id: "f2", label: "Do you agree?" },
      ],
      response: {
        answers: [
          { fieldId: "f1", value: "Bob" },
          { fieldId: "f2", value: true },
        ],
      },
    };

    const result = renderTemplate(template, variables);
    expect(result).toContain("What is your name?");
    expect(result).toContain("Bob");
    expect(result).toContain("Do you agree?");
    expect(result).toContain("Yes");
    expect(result).toContain("<table");
  });
});
