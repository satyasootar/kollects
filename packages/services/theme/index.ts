import { db, eq, and } from "@repo/database";
import { themesTable } from "@repo/database/models/theme";
import { createThemeSchema, updateThemeSchema } from "@repo/database/schemas/theme";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export class ThemeService {
  async listSystemThemes() {
    return db.select().from(themesTable).where(eq(themesTable.isSystem, true));
  }

  async getById(themeId: string) {
    const [theme] = await db.select().from(themesTable).where(eq(themesTable.id, themeId)).limit(1);
    if (!theme) throw new TRPCError({ code: "NOT_FOUND", message: "Theme not found" });
    return theme;
  }
}
