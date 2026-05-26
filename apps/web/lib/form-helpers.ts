import type { FieldValues, UseFormSetError, Path } from "react-hook-form";
import { extractFieldErrors } from "~/lib/api-error";

export function applyServerFieldErrors<T extends FieldValues>(
  err: unknown,
  setError: UseFormSetError<T>,
): boolean {
  const fieldErrors = extractFieldErrors(err);
  if (!fieldErrors) return false;
  for (const [name, messages] of Object.entries(fieldErrors)) {
    if (messages && messages.length > 0) {
      setError(name as Path<T>, { type: "server", message: messages[0] });
    }
  }
  return true;
}
