import { db, eq, and, desc, sql } from "@repo/database";
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
      total: totalRes[0]?.count ? Number(totalRes[0].count) : 0,
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
        await tx.update(formsTable)
          .set({ totalSubmissions: sql`${formsTable.totalSubmissions} - 1` })
          .where(and(eq(formsTable.id, response.formId), sql`${formsTable.totalSubmissions} > 0`));
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

    let csvResult = "";
    
    // Using dynamic import so we don't break existing imports if they weren't exposed
    const { generateCsvHeaders, generateCsvRows } = await import("./csv-export");
    
    csvResult += generateCsvHeaders(fields);

    const limit = 500;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      // Get all completed responses with answers in chunks
      const responses = await db.query.formResponsesTable.findMany({
        where: and(
          eq(formResponsesTable.formId, formId),
          eq(formResponsesTable.isComplete, true)
        ),
        with: {
          answers: true,
        },
        orderBy: [desc(formResponsesTable.submittedAt)],
        limit,
        offset,
      });

      if (responses.length === 0) {
        hasMore = false;
        break;
      }

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

      const rowsChunk = generateCsvRows(fields, exportData);
      if (rowsChunk) {
        csvResult += "\n" + rowsChunk;
      }

      offset += limit;
      if (responses.length < limit) {
        hasMore = false;
      }
    }

    return csvResult;
  }
}
