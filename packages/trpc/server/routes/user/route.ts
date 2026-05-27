import { z } from "../../schema";
import { userService } from "../../services";
import { protectedProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";

const TAGS = ["User"];
const getPath = generatePath("/user");

export const userRouter = router({
  updateProfile: protectedProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: getPath("/profile"),
        tags: TAGS,
        summary: "Update user profile",
        description: "Updates the authenticated user's profile details like name and avatar URL.",
      },
    })
    .input(
      z.object({
        name: z.string().min(1, "Name cannot be empty").optional(),
        avatarUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
      }),
    )
    .output(
      z.object({
        success: z.boolean(),
        user: z.object({
          id: z.string(),
          name: z.string(),
          email: z.string(),
          avatarUrl: z.string().nullable(),
        }).passthrough().nullable(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // If avatarUrl is empty string, we convert to null to clear it, or keep it undefined if not passed
      const updateData = {
        name: input.name,
        avatarUrl: input.avatarUrl === "" ? undefined : input.avatarUrl, 
        // We could explicitly set it to null if the user wants to remove the avatar, 
        // but for now, let's treat "" as clearing the avatar if needed. 
        // Our service doesn't handle null explicitly yet. Let's just pass it.
        // Wait, our service accepts `avatarUrl?: string`. We should pass null if we want to clear it.
        // Let's modify the input to just pass it directly.
      };

      const updatedUser = await userService.updateProfile(ctx.user!.id, updateData);
      
      return {
        success: true,
        user: updatedUser ?? null,
      };
    }),
});
