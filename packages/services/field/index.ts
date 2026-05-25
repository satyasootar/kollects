import { db, eq, sql, and } from "@repo/database";
import { formsTable } from "@repo/database/models/form";
import { formFieldsTable } from "@repo/database/models/form-field";
import { TRPCError } from "@trpc/server";
import { assertOwnership, assertNotDeleted } from "../form/access-control";
import crypto from "crypto";

export class FieldService {
  /**
   * Verifies the entire ownership chain (Field -> Form -> User)
   */
  async getFieldWithOwnership(fieldId: string, userId: string) {
    const results = await db
      .select({
        field: formFieldsTable,
        form: formsTable,
      })
      .from(formFieldsTable)
      .innerJoin(formsTable, eq(formFieldsTable.formId, formsTable.id))
      .where(eq(formFieldsTable.id, fieldId))
      .limit(1);

    const match = results[0];
    if (!match) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Field not found" });
    }

    assertNotDeleted(match.form);
    assertOwnership(match.form, userId);

    return match.field;
  }

  /**
   * Verifies the form ownership.
   */
  async getFormWithOwnership(formId: string, userId: string) {
    const [form] = await db.select().from(formsTable).where(eq(formsTable.id, formId)).limit(1);

    if (!form) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Form not found" });
    }

    assertNotDeleted(form);
    assertOwnership(form, userId);

    return form;
  }

  /**
   * Creates a new field inside a form.
   */
  async create(
    userId: string,
    data: {
      formId: string;
      type:
        | "short_text"
        | "long_text"
        | "email"
        | "number"
        | "date"
        | "single_select"
        | "multi_select"
        | "checkbox"
        | "rating"
        | "url"
        | "phone";
      label: string;
      helpText?: string;
      placeholder?: string;
      required?: boolean;
      pageNumber?: number;
      options?: any[];
      validations?: any;
      settings?: any;
    },
  ) {
    // 1. Verify ownership of the form
    await this.getFormWithOwnership(data.formId, userId);

    // 2. Insert Field
    return await db.transaction(async (tx) => {
      // Get max order
      const [maxResult] = await tx
        .select({ maxOrder: sql<number>`MAX(${formFieldsTable.order})` })
        .from(formFieldsTable)
        .where(eq(formFieldsTable.formId, data.formId));

      const nextOrder = (maxResult?.maxOrder ?? -1) + 1;
      const fieldId = crypto.randomUUID();

      const [newField] = await tx
        .insert(formFieldsTable)
        .values({
          id: fieldId,
          formId: data.formId,
          type: data.type,
          label: data.label,
          helpText: data.helpText,
          placeholder: data.placeholder,
          required: data.required ?? false,
          pageNumber: data.pageNumber ?? 1,
          options: data.options ?? null,
          validations: data.validations ?? null,
          settings: data.settings ?? null,
          order: nextOrder,
        })
        .returning();

      return newField;
    });
  }

  /**
   * Updates an existing field.
   */
  async update(
    userId: string,
    fieldId: string,
    data: {
      label?: string;
      helpText?: string;
      placeholder?: string;
      required?: boolean;
      pageNumber?: number;
      options?: any[];
      validations?: any;
      settings?: any;
    },
  ) {
    await this.getFieldWithOwnership(fieldId, userId);

    const [updatedField] = await db
      .update(formFieldsTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(formFieldsTable.id, fieldId))
      .returning();

    return updatedField;
  }

  /**
   * Deletes a field.
   */
  async delete(userId: string, fieldId: string) {
    await this.getFieldWithOwnership(fieldId, userId);
    await db.delete(formFieldsTable).where(eq(formFieldsTable.id, fieldId));
  }

  /**
   * Bulk updates the order of fields in a form.
   */
  async reorder(userId: string, formId: string, fieldIds: string[]) {
    await this.getFormWithOwnership(formId, userId);

    await db.transaction(async (tx) => {
      for (let i = 0; i < fieldIds.length; i++) {
        const id = fieldIds[i];
        if (id) {
          await tx
            .update(formFieldsTable)
            .set({ order: i })
            .where(and(eq(formFieldsTable.id, id), eq(formFieldsTable.formId, formId)));
        }
      }
    });
  }
}
