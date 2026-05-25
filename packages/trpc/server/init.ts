import { initTRPC } from "@trpc/server";
import { OpenApiMeta } from "trpc-to-openapi";
import { ZodError } from "zod";
import type { TRPCContext } from "./context";

export const t = initTRPC
  .meta<OpenApiMeta>()
  .context<TRPCContext>()
  .create({
    errorFormatter({ shape, error }) {
      return {
        ...shape,
        data: {
          ...shape.data,
          zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
        },
      };
    },
  });

export const router = t.router;
export const middleware = t.middleware;
