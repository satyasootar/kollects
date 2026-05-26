/**
 * Phase 5 — api-error.ts unit tests.
 * Verifies every tRPC error code routes to the correct toast.
 */
import { TRPCClientError } from "@repo/trpc/client";
import { extractFieldErrors, handleTrpcError } from "~/lib/api-error";
import { toast } from "~/lib/toast";

vi.mock("~/lib/toast", () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
}));

function makeTRPCError(code: string, message = "", zodFieldErrors?: Record<string, string[]>) {
  const err = new TRPCClientError(message, {
    result: {
      error: {
        message,
        code,
        data: {
          code,
          zodError: zodFieldErrors ? { fieldErrors: zodFieldErrors } : undefined,
        },
      },
    },
  } as any);
  // Attach data directly as tRPC client does
  (err as any).data = {
    code,
    zodError: zodFieldErrors ? { fieldErrors: zodFieldErrors } : undefined,
  };
  return err;
}

describe("extractFieldErrors", () => {
  it("returns null for non-TRPCClientError", () => {
    expect(extractFieldErrors(new Error("random"))).toBeNull();
  });

  it("returns null when no zodError present", () => {
    const err = makeTRPCError("BAD_REQUEST", "bad");
    (err as any).data = { code: "BAD_REQUEST" };
    expect(extractFieldErrors(err)).toBeNull();
  });

  it("returns field errors when zodError is present", () => {
    const err = makeTRPCError("BAD_REQUEST", "Validation failed", {
      email: ["Already registered"],
    });
    const result = extractFieldErrors(err);
    expect(result).toEqual({ email: ["Already registered"] });
  });
});

describe("handleTrpcError", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows generic error for non-TRPCClientError", () => {
    handleTrpcError(new Error("oops"));
    expect(toast.error).toHaveBeenCalledWith("Something went wrong.");
  });

  it("UNAUTHORIZED → toast.error (unless silent401)", () => {
    handleTrpcError(makeTRPCError("UNAUTHORIZED", "Not logged in"));
    expect(toast.error).toHaveBeenCalledWith("Please log in to continue.");
  });

  it("UNAUTHORIZED with silent401 → no toast", () => {
    handleTrpcError(makeTRPCError("UNAUTHORIZED"), { silent401: true });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("FORBIDDEN → toast.error with message", () => {
    handleTrpcError(makeTRPCError("FORBIDDEN", "No access"));
    expect(toast.error).toHaveBeenCalledWith("No access");
  });

  it("NOT_FOUND → toast.error", () => {
    handleTrpcError(makeTRPCError("NOT_FOUND", "Form not found"));
    expect(toast.error).toHaveBeenCalledWith("Form not found");
  });

  it("BAD_REQUEST without zodError → toast.error", () => {
    const err = makeTRPCError("BAD_REQUEST", "Invalid slug");
    (err as any).data = { code: "BAD_REQUEST" };
    handleTrpcError(err);
    expect(toast.error).toHaveBeenCalledWith("Invalid slug");
  });

  it("BAD_REQUEST with zodError → no toast (handled by form)", () => {
    const err = makeTRPCError("BAD_REQUEST", "Validation", {
      email: ["Required"],
    });
    handleTrpcError(err);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("TOO_MANY_REQUESTS → toast.warning", () => {
    handleTrpcError(makeTRPCError("TOO_MANY_REQUESTS", "Slow down"));
    expect(toast.warning).toHaveBeenCalledWith("Slow down");
  });

  it("CONFLICT → toast.error", () => {
    handleTrpcError(makeTRPCError("CONFLICT", "Slug already taken"));
    expect(toast.error).toHaveBeenCalledWith("Slug already taken");
  });

  it("unknown code → toast.error with message", () => {
    handleTrpcError(makeTRPCError("INTERNAL_SERVER_ERROR", "Server broke"));
    expect(toast.error).toHaveBeenCalledWith("Server broke");
  });
});
