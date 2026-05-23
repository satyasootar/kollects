import { TRPCError } from "@trpc/server";
import { type SelectForm } from "@repo/database/schema";

/**
 * Asserts that the form belongs to the specified user.
 * Throws FORBIDDEN if the user is not the owner.
 */
export function assertOwnership(form: SelectForm, userId: string) {
  if (form.creatorId !== userId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to access this form",
    });
  }
}

/**
 * Asserts that the form is not soft-deleted.
 * Throws NOT_FOUND if deletedAt is present.
 */
export function assertNotDeleted(form: SelectForm) {
  if (form.deletedAt !== null) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Form not found or has been deleted",
    });
  }
}
