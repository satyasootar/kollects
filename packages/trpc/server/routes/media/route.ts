import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import { mediaService } from "../../services";

export const mediaRouter = router({
  /**
   * Generates a signature for the frontend to perform a direct upload to ImageKit.
   */
  getUploadAuth: protectedProcedure.query(() => {
    return mediaService.getAuthenticationParameters();
  }),
});
