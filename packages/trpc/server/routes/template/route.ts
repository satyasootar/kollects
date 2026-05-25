import { z } from "zod";
import { publicProcedure, router } from "../../trpc";
import { TemplateService } from "@repo/services/template";

const templateService = new TemplateService();

export const templateRouter = router({
  listSystem: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/templates/system",
        tags: ["Templates"],
        summary: "List all system templates",
      },
    })
    .output(z.any())
    .query(async () => {
      return templateService.listSystemTemplates();
    }),
});
