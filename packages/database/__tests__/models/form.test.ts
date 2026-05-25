import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "../../index";
import { usersTable } from "../../models/user";
import { formsTable } from "../../models/form";
import { formFieldsTable } from "../../models/form-field";
import { formResponsesTable } from "../../models/form-response";
import { responseAnswersTable } from "../../models/response-answer";
import { eq } from "drizzle-orm";

describe("Form Domain Models", () => {
  let testUserId: string;
  let testFormId: string;
  let testFieldId: string;
  let testResponseId: string;

  beforeAll(async () => {
    const user = await db
      .insert(usersTable)
      .values({
        name: "Form Test User",
        email: "form-test@example.com",
      })
      .returning();
    testUserId = user[0]!.id;
  });

  afterAll(async () => {
    // Cascade deletes should handle everything
    await db.delete(usersTable).where(eq(usersTable.id, testUserId));
  });

  it("should insert a new form", async () => {
    const newForm = {
      creatorId: testUserId,
      title: "Customer Feedback Form",
      slug: "customer-feedback-test",
      status: "published" as const,
      settings: {
        showProgressBar: true,
        submitButtonText: "Send Feedback",
      },
    };

    const inserted = await db.insert(formsTable).values(newForm).returning();

    expect(inserted).toHaveLength(1);
    expect(inserted[0]!.title).toBe(newForm.title);
    expect(inserted[0]!.settings).toHaveProperty("showProgressBar", true);

    testFormId = inserted[0]!.id;
  });

  it("should insert form fields with jsonb logic and options", async () => {
    const newField = {
      formId: testFormId,
      type: "single_select" as const,
      label: "How did you hear about us?",
      order: 1,
      pageNumber: 1,
      options: [
        { label: "Google", value: "google" },
        { label: "Social Media", value: "social" },
      ],
      logic: [
        { operator: "equals", value: "social", action: "skip_to", targetId: "some-other-uuid" },
      ],
      required: true,
    };

    const inserted = await db.insert(formFieldsTable).values(newField).returning();

    expect(inserted).toHaveLength(1);
    expect(inserted[0]!.type).toBe("single_select");
    expect(inserted[0]!.options).toHaveLength(2);
    expect(inserted[0]!.logic).toHaveLength(1);

    testFieldId = inserted[0]!.id;
  });

  it("should insert a form response", async () => {
    const newResponse = {
      formId: testFormId,
      respondentEmail: "respondent@example.com",
      isComplete: true,
      completionTimeSeconds: 45,
    };

    const inserted = await db.insert(formResponsesTable).values(newResponse).returning();

    expect(inserted).toHaveLength(1);
    expect(inserted[0]!.isComplete).toBe(true);

    testResponseId = inserted[0]!.id;
  });

  it("should insert response answers as jsonb", async () => {
    const newAnswer = {
      responseId: testResponseId,
      fieldId: testFieldId,
      value: { selected: ["social"] },
    };

    const inserted = await db.insert(responseAnswersTable).values(newAnswer).returning();

    expect(inserted).toHaveLength(1);
    expect(inserted[0]!.value).toHaveProperty("selected");
  });
});
