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

/**
 * Validates public access to a form, enforcing visibility, status, and password checks.
 */
export async function resolvePublicForm(
  form: SelectForm,
  verifyToken?: (formId: string) => Promise<boolean> | boolean
): Promise<SelectForm> {
  // 1. Deleted forms are NEVER accessible publicly
  assertNotDeleted(form);

  // 2. Draft or Archived forms are NEVER accessible publicly (only via creator portal)
  if (form.status !== "published") {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Form is not currently accepting responses",
    });
  }

  // 3. Visibility Check
  if (form.visibility === "private") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This form is private and cannot be accessed publicly",
    });
  }

  // 3. Password Check
  if (form.passwordHash) {
    if (!verifyToken || !(await verifyToken(form.id))) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "This form is password protected",
      });
    }
  }

  return form;
}
