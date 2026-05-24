import { z } from "zod";
import { publicProcedure, router } from "../../trpc";
import { db, eq, and, desc, isNull } from "@repo/database";
import { formsTable } from "@repo/database/models/form";

export const publicExploreRouter = router({
  list: publicProcedure
    .meta({ openapi: { method: "GET", path: "/public/explore", tags: ["Public Explore"], summary: "List public forms for explore feed" } })
    .input(z.object({
      cursor: z.number().optional().default(0),
      limit: z.number().min(1).max(50).default(20),
    }))
    .output(z.any())
    .query(async ({ input }) => {
      // CRITICAL: MUST only query status = 'published' AND visibility = 'public'
      const forms = await db
        .select({
          id: formsTable.id,
          slug: formsTable.slug,
          title: formsTable.title,
          description: formsTable.description,
          coverImageUrl: formsTable.coverImageUrl,
          themeId: formsTable.themeId,
          totalSubmissions: formsTable.totalSubmissions,
          createdAt: formsTable.createdAt,
        })
        .from(formsTable)
        .where(
          and(
            eq(formsTable.status, "published"),
            eq(formsTable.visibility, "public"),
            isNull(formsTable.deletedAt) // Explicitly ensure it's not soft-deleted
          )
        )
        .orderBy(desc(formsTable.totalSubmissions), desc(formsTable.createdAt))
        .limit(input.limit)
        .offset(input.cursor);

      return {
        items: forms,
        nextCursor: forms.length === input.limit ? input.cursor + input.limit : null,
      };
    }),
});
