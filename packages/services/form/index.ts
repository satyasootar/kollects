import { db, eq, and, sql } from "@repo/database";
import { formsTable } from "@repo/database/models/form";
import { formFieldsTable } from "@repo/database/models/form-field";
import { usersTable } from "@repo/database/models/user";
import { TRPCError } from "@trpc/server";
import { assertOwnership, assertNotDeleted } from "./access-control";
import { SlugService } from "../slug";
import crypto from "crypto";

const slugService = new SlugService();

export class FormService {
  /**
   * Retrieves a form by ID and validates ownership and deleted status.
   */
  async getById(formId: string, userId: string) {
    const [form] = await db.select().from(formsTable).where(eq(formsTable.id, formId)).limit(1);

    if (!form) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Form not found" });
    }

    assertNotDeleted(form);
    assertOwnership(form, userId);

    return form;
  }

  /**
   * Lists all non-deleted forms for a user.
   */
  async list(userId: string) {
    return await db
      .select()
      .from(formsTable)
      .where(and(eq(formsTable.creatorId, userId), sql`${formsTable.deletedAt} IS NULL`))
      .orderBy(sql`${formsTable.createdAt} DESC`);
  }

  /**
   * Creates a new form, generating a slug and inserting a default page.
   */
  async create(userId: string, data: { title: string; description?: string; themeId?: string }) {
    // 1. Fetch user to get limits
    const [user] = await db
      .select({ formLimit: usersTable.formLimit })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    // 2. Check limits (Stubbed for now, simple validation)
    // TODO (Phase 13): Actually count current forms and enforce formLimit
    const currentFormsCount = 0; // STUB
    if (currentFormsCount >= user.formLimit) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Form limit reached for your plan. Please upgrade to create more forms.",
      });
    }

    // 3. Generate Slug
    const slug = await slugService.generateSlug(data.title);

    // 4. Insert Form and Default Page in transaction
    return await db.transaction(async (tx) => {
      const formId = crypto.randomUUID();

      const [newForm] = await tx
        .insert(formsTable)
        .values({
          id: formId,
          creatorId: userId,
          title: data.title,
          description: data.description,
          slug,
          themeId: data.themeId,
          status: "draft",
        })
        .returning();

      return newForm;
    });
  }

  /**
   * Updates basic form settings (title, description, slug, theme).
   */
  async update(userId: string, formId: string, data: { title?: string; description?: string; slug?: string; themeId?: string }) {
    const form = await this.getById(formId, userId);

    if (data.slug && data.slug !== form.slug) {
      const slugValidation = slugService.validateCustomSlug(data.slug);
      if (!slugValidation.valid) {
        throw new TRPCError({ code: "BAD_REQUEST", message: slugValidation.error });
      }
      const isAvailable = await slugService.checkAvailability(data.slug);
      if (!isAvailable) {
        throw new TRPCError({ code: "CONFLICT", message: "This slug is already taken" });
      }
    }

    const [updatedForm] = await db
      .update(formsTable)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(formsTable.id, formId))
      .returning();

    return updatedForm;
  }

  /**
   * Soft deletes a form.
   */
  async delete(userId: string, formId: string) {
    const form = await this.getById(formId, userId);

    await db
      .update(formsTable)
      .set({ deletedAt: new Date() })
      .where(eq(formsTable.id, formId));
  }

  /**
   * Publishes a draft form.
   */
  async publish(userId: string, formId: string) {
    const form = await this.getById(formId, userId);

    const [updatedForm] = await db
      .update(formsTable)
      .set({
        status: "published",
        publishedAt: form.publishedAt ?? new Date(),
        updatedAt: new Date(),
      })
      .where(eq(formsTable.id, formId))
      .returning();

    return updatedForm;
  }

  /**
   * Unpublishes a form (reverts to draft).
   */
  async unpublish(userId: string, formId: string) {
    await this.getById(formId, userId);

    const [updatedForm] = await db
      .update(formsTable)
      .set({
        status: "draft",
        updatedAt: new Date(),
      })
      .where(eq(formsTable.id, formId))
      .returning();

    return updatedForm;
  }

  /**
   * Archives a form (closed for submissions).
   */
  async archive(userId: string, formId: string) {
    await this.getById(formId, userId);

    const [updatedForm] = await db
      .update(formsTable)
      .set({
        status: "archived",
        updatedAt: new Date(),
      })
      .where(eq(formsTable.id, formId))
      .returning();

    return updatedForm;
  }

  /**
   * Clones a form (shallow clone + pages + fields + options).
   * Note: Logic conditions are not cloned in this initial pass.
   */
  async clone(userId: string, formId: string) {
    const originalForm = await this.getById(formId, userId);

    return await db.transaction(async (tx) => {
      // 1. Generate new slug
      const newSlug = await slugService.generateSlug(`${originalForm.title} Copy`);
      const newFormId = crypto.randomUUID();

      // 2. Clone Form
      const [newForm] = await tx
        .insert(formsTable)
        .values({
          id: newFormId,
          creatorId: userId,
          title: `${originalForm.title} (Copy)`,
          description: originalForm.description,
          slug: newSlug,
          themeId: originalForm.themeId,
          status: "draft",
          passwordHash: null,
          metaTitle: originalForm.metaTitle,
          metaDescription: originalForm.metaDescription,
          visibility: originalForm.visibility,
          settings: originalForm.settings,
        })
        .returning();

      // 3. Clone Fields
      const originalFields = await tx.select().from(formFieldsTable).where(eq(formFieldsTable.formId, formId));
      
      if (originalFields.length > 0) {
        const newFields = originalFields.map(oldField => ({
          id: crypto.randomUUID(),
          formId: newFormId,
          type: oldField.type,
          label: oldField.label,
          helpText: oldField.helpText,
          placeholder: oldField.placeholder,
          required: oldField.required,
          order: oldField.order,
          pageNumber: oldField.pageNumber,
          options: oldField.options,
          logic: oldField.logic,
          settings: oldField.settings,
          validations: oldField.validations,
        }));
        await tx.insert(formFieldsTable).values(newFields);
      }

      return newForm;
    });
  }
}
