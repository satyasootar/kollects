import { db, eq, and, desc } from "@repo/database";
import { formsTable, formResponsesTable, responseAnswersTable, formFieldsTable } from "@repo/database/schema";
import { TRPCError } from "@trpc/server";
import { generateCsvExport } from "./csv-export";
import type { ExportResponseData } from "./csv-export";

export class ResponseService {
  /**
   * Ensure user owns the form
   */
  private async enforceFormOwnership(userId: string, formId: string) {
    const form = await db.query.formsTable.findFirst({
      where: and(
        eq(formsTable.id, formId),
        eq(formsTable.creatorId, userId)
      ),
    });

    if (!form) {
      throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission to access this form" });
    }
    
    return form;
  }

  /**
   * List responses for a specific form (paginated)
   */
  async list(userId: string, formId: string, page: number, limit: number) {
    await this.enforceFormOwnership(userId, formId);

    const offset = (page - 1) * limit;

    // We fetch completed responses
    const responses = await db.query.formResponsesTable.findMany({
      where: and(
        eq(formResponsesTable.formId, formId),
        eq(formResponsesTable.isComplete, true)
      ),
      orderBy: [desc(formResponsesTable.submittedAt)],
      limit,
      offset,
    });

    const totalRes = await db.select({ count: formResponsesTable.id }).from(formResponsesTable).where(
      and(
        eq(formResponsesTable.formId, formId),
        eq(formResponsesTable.isComplete, true)
      )
    );

    return {
      responses,
      total: totalRes.length > 0 ? Number(totalRes[0].count) : 0,
    };
  }

  /**
   * Get a single response with its answers
   */
  async getById(userId: string, responseId: string) {
    const response = await db.query.formResponsesTable.findFirst({
      where: eq(formResponsesTable.id, responseId),
      with: {
        answers: {
          with: {
            field: true,
          },
        },
      },
    });

    if (!response) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Response not found" });
    }

    await this.enforceFormOwnership(userId, response.formId);

    return response;
  }

  /**
   * Delete a response and decrement form total_submissions
   */
  async delete(userId: string, responseId: string) {
    const response = await db.query.formResponsesTable.findFirst({
      where: eq(formResponsesTable.id, responseId),
    });

    if (!response) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Response not found" });
    }

    await this.enforceFormOwnership(userId, response.formId);

    await db.transaction(async (tx) => {
      // 1. Delete answers
      await tx.delete(responseAnswersTable).where(eq(responseAnswersTable.responseId, responseId));
      
      // 2. Delete response
      await tx.delete(formResponsesTable).where(eq(formResponsesTable.id, responseId));
      
      // 3. Decrement totalSubmissions (if response was complete)
      if (response.isComplete) {
        // Find form and decrement
        const form = await tx.query.formsTable.findFirst({ where: eq(formsTable.id, response.formId) });
        if (form && form.totalSubmissions > 0) {
           await tx.update(formsTable)
             .set({ totalSubmissions: form.totalSubmissions - 1 })
             .where(eq(formsTable.id, response.formId));
        }
      }
    });
  }

  /**
   * Export all completed responses for a form as CSV
   */
  async exportCsv(userId: string, formId: string): Promise<string> {
    await this.enforceFormOwnership(userId, formId);

    // Get all fields ordered by 'order'
    const fields = await db.query.formFieldsTable.findMany({
      where: eq(formFieldsTable.formId, formId),
      orderBy: (fields, { asc }) => [asc(fields.order)],
    });

    // Get all completed responses with answers
    const responses = await db.query.formResponsesTable.findMany({
      where: and(
        eq(formResponsesTable.formId, formId),
        eq(formResponsesTable.isComplete, true)
      ),
      with: {
        answers: true,
      },
      orderBy: [desc(formResponsesTable.submittedAt)],
    });

    const exportData: ExportResponseData[] = responses.map((r) => {
      const answersMap: Record<string, any> = {};
      for (const answer of r.answers) {
        answersMap[answer.fieldId] = answer.value;
      }

      return {
        id: r.id,
        submittedAt: r.submittedAt || new Date(), // fallback if null
        completionTimeSeconds: r.completionTimeSeconds,
        ipHash: r.ipHash,
        userAgent: r.userAgent,
        answers: answersMap,
      };
    });

    return generateCsvExport(fields, exportData);
  }
}
