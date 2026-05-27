import { db, eq, sql } from "@repo/database";
import { formsTable } from "@repo/database/models/form";
import { formFieldsTable } from "@repo/database/models/form-field";
import { formResponsesTable } from "@repo/database/models/form-response";
import { responseAnswersTable } from "@repo/database/models/response-answer";
import { TRPCError } from "@trpc/server";
import { buildValidationSchema } from "@repo/database/schemas/dynamic-validator";
import crypto from "crypto";
import { AnalyticsService } from "../analytics";

export class SubmissionService {
  /**
   * Processes a form submission, validating the payload against the dynamic schema
   * and inserting the response and answers within a transaction.
   */
  async submit(slug: string, answers: Record<string, any>, metadata?: Record<string, any>) {
    // 1. Fetch form
    const [form] = await db.select().from(formsTable).where(eq(formsTable.slug, slug)).limit(1);

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

    // Fire and forget background jobs (or await on Vercel)
    const jobsPromise = import("../jobs")
      .then(async ({ jobQueue }) => {
        await jobQueue.enqueue("ANALYTICS_UPDATE", {
          formId: form.id,
          dateStr: new Date().toISOString(),
        });
        await jobQueue.enqueue("EMAIL_NOTIFICATION", { formId: form.id, responseId });
      })
      .catch(console.error);
      
    if (process.env.VERCEL) {
      await jobsPromise;
    }

    return {
      responseId,
      successMessage: (form.settings as any)?.successMessage || "Thank you for your submission!",
    };
  }

  /**
   * Saves partial progress for multi-page forms to track drop-offs.
   */
  async saveProgress(
    slug: string,
    sessionId: string,
    currentPage: number,
    answers: Record<string, any>,
    metadata?: Record<string, any>,
  ) {
    // 1. Fetch form
    const [form] = await db.select().from(formsTable).where(eq(formsTable.slug, slug)).limit(1);

    if (!form || form.deletedAt !== null) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Form not found" });
    }

    if (form.status !== "published") return; // Ignore drafts for analytics

    // 2. Fetch fields to validate
    const fields = await db
      .select()
      .from(formFieldsTable)
      .where(eq(formFieldsTable.formId, form.id));

    // For partial saves, we validate but don't strictly reject missing required fields on future pages
    // We'll just build a partial schema or just safely parse what we can to prevent injection
    const schema = buildValidationSchema(fields);

    // We only want to save answers that are valid. We filter out invalid ones.
    const validAnswers: Record<string, any> = {};
    for (const [key, value] of Object.entries(answers)) {
      // Deeply partial validation
      try {
        const fieldSchema = schema.shape[key];
        if (fieldSchema) {
          validAnswers[key] = fieldSchema.parse(value);
        }
      } catch (e) {
        // ignore invalid fields on partial saves
      }
    }

    // Upsert response based on sessionId + formId
    // Since we don't have a strict sessionId unique constraint, we'll try to find an existing incomplete response
    // Or we just insert if it doesn't exist
    await db.transaction(async (tx) => {
      let responseId: string;
      const [existing] = await tx
        .select()
        .from(formResponsesTable)
        .where(
          sql`${formResponsesTable.formId} = ${form.id} AND ${formResponsesTable.isComplete} = false AND ${formResponsesTable.metadata}->>'sessionId' = ${sessionId}`,
        )
        .limit(1);

      if (existing) {
        responseId = existing.id;
        // Update metadata with new page
        const existingMetadata = existing.metadata || {};
        await tx
          .update(formResponsesTable)
          .set({
            metadata: { ...existingMetadata, lastCompletedPage: currentPage },
            updatedAt: new Date(),
          })
          .where(eq(formResponsesTable.id, responseId));

        // Delete old answers and reinsert
        await tx
          .delete(responseAnswersTable)
          .where(eq(responseAnswersTable.responseId, responseId));
      } else {
        responseId = crypto.randomUUID();
        await tx.insert(formResponsesTable).values({
          id: responseId,
          formId: form.id,
          ipHash: metadata?.ipHash,
          userAgent: metadata?.userAgent,
          isComplete: false,
          completionTimeSeconds: 0,
          metadata: { sessionId, lastCompletedPage: currentPage, ...metadata?.browserData },
          submittedAt: new Date(),
        });
      }

      // Insert new answers
      const answerRows = Object.keys(validAnswers).map((fieldId) => ({
        id: crypto.randomUUID(),
        responseId,
        fieldId,
        value: validAnswers[fieldId],
      }));

      if (answerRows.length > 0) {
        await tx.insert(responseAnswersTable).values(answerRows);
      }
    });
  }
}
