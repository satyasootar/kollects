import { TRPCClientError } from "@repo/trpc/client";
import { toast } from "~/lib/toast";

export type FieldErrors = Record<string, string[]>;

export function extractFieldErrors(err: unknown): FieldErrors | null {
  if (err instanceof TRPCClientError) {
    const data = (err as any).data ?? {};
    return data?.zodError?.fieldErrors ?? null;
  }
  return null;
}

export function handleTrpcError(err: unknown, opts?: { silent401?: boolean }): void {
  if (!(err instanceof TRPCClientError)) {
    toast.error("Something went wrong.");
    return;
  }
  const code = ((err as any).data?.code as string) ?? "";
  switch (code) {
    case "UNAUTHORIZED":
      if (opts?.silent401) return;
      toast.error("Please log in to continue.");
      break;
    case "FORBIDDEN":
      toast.error(err.message || "Access denied.");
      break;
    case "NOT_FOUND":
      toast.error(err.message || "Not found.");
      break;
    case "BAD_REQUEST":
      if (!extractFieldErrors(err)) toast.error(err.message || "Invalid input.");
      break;
    case "TOO_MANY_REQUESTS":
      toast.warning(err.message || "Slow down — try again in a moment.");
      break;
    case "CONFLICT":
      toast.error(err.message || "Conflict — already exists.");
      break;
    default:
      toast.error(err.message || "Something went wrong.");
  }
}
