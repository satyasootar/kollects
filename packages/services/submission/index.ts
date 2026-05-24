import { db, eq, sql } from "@repo/database";
import { formsTable } from "@repo/database/models/form";
import { formFieldsTable } from "@repo/database/models/form-field";
import { formResponsesTable } from "@repo/database/models/form-response";
import { responseAnswersTable } from "@repo/database/models/response-answer";
import { TRPCError } from "@trpc/server";
import { buildValidationSchema } from "./dynamic-validator";
import crypto from "crypto";

export class SubmissionService {
  /**
   * Processes a form submission, validating the payload against the dynamic schema
   * and inserting the response and answers within a transaction.
   */
  async submit(slug: string, answers: Record<string, any>, metadata?: Record<string, any>) {
    // 1. Fetch form
    const [form] = await db
      .select()
      .from(formsTable)
      .where(eq(formsTable.slug, slug))
      .limit(1);

    if (!form || form.deletedAt !== null) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Form not found" });
    }

    // 2. Validate form state
    if (form.status !== "published") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Form is not accepting responses" });
    }

    if (form.expiresAt && Date.now() > form.expiresAt.getTime()) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Form has expired" });
    }

    if (form.responseLimit && form.totalSubmissions >= form.responseLimit) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Form has reached its response limit" });
    }

    // 3. Fetch fields
    const fields = await db
      .select()
      .from(formFieldsTable)
      .where(eq(formFieldsTable.formId, form.id));

    if (!fields || fields.length === 0) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Form has no fields" });
    }

    // 4. Build dynamic schema and validate
    const schema = buildValidationSchema(fields);
    const validationResult = schema.safeParse(answers);

    if (!validationResult.success) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Validation failed",
        cause: validationResult.error,
      });
    }

    const validAnswers = validationResult.data;

    // 5. Transaction: Insert response and answers
    const responseId = await db.transaction(async (tx) => {
      const id = crypto.randomUUID();

      // Insert response
      await tx.insert(formResponsesTable).values({
        id,
        formId: form.id,
        respondentEmail: metadata?.email,
        respondentName: metadata?.name,
        ipHash: metadata?.ipHash,
        userAgent: metadata?.userAgent,
        isComplete: true,
        completionTimeSeconds: metadata?.completionTimeSeconds || 0,
        metadata: metadata?.browserData || {},
        submittedAt: new Date(),
      });

      // Insert answers (bulk)
      const answerRows = Object.keys(validAnswers).map((fieldId) => ({
        id: crypto.randomUUID(),
        responseId: id,
        fieldId,
        value: validAnswers[fieldId],
      }));

      if (answerRows.length > 0) {
        await tx.insert(responseAnswersTable).values(answerRows);
      }

      // Increment form submission count
      await tx
        .update(formsTable)
        .set({
          totalSubmissions: sql`${formsTable.totalSubmissions} + 1`,
        })
        .where(eq(formsTable.id, form.id));

      return id;
    });

    return { responseId, successMessage: form.settings?.successMessage || "Thank you for your submission!" };
  }
}
