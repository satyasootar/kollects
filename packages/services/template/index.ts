import { db, eq } from "@repo/database";
import { formTemplatesTable } from "@repo/database/models/form-template";
import { TRPCError } from "@trpc/server";

export class TemplateService {
  async listSystemTemplates() {
    return db.select().from(formTemplatesTable).where(eq(formTemplatesTable.isSystem, true));
  }

  async getById(templateId: string) {
    const [template] = await db
      .select()
      .from(formTemplatesTable)
      .where(eq(formTemplatesTable.id, templateId))
      .limit(1);
    if (!template) throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
    return template;
  }
}
