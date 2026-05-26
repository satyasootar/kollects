import { z } from "zod";
import { resetPasswordSchema } from "@repo/database/schemas/auth";

/**
 * Client-only extension of resetPasswordSchema that adds confirmPassword.
 * Never modify @repo/database — extend locally.
 */
export const resetPasswordClientSchema = resetPasswordSchema.extend({
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type ResetPasswordClientInput = z.infer<typeof resetPasswordClientSchema>;
