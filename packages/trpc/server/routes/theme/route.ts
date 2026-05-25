import { z } from "zod";
import { publicProcedure, protectedProcedure, scopedProcedure, router } from "../../trpc";
import { ThemeService } from "@repo/services/theme";

const themeService = new ThemeService();

export const themeRouter = router({
  listSystem: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/themes/system",
        tags: ["Themes"],
        summary: "List all system themes",
      },
    })
    .output(z.any())
    .query(async () => {
      return themeService.listSystemThemes();
    }),
});
