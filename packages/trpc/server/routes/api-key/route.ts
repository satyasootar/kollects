import { z } from "zod";
import { protectedProcedure, scopedProcedure, router } from "../../trpc";
import { db, eq, and } from "@repo/database";
import { apiKeysTable, auditLogsTable } from "@repo/database/models/system";
import { generateApiKey } from "@repo/services/auth/api-key";

export const apiKeyRouter = router({
  list: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/api-keys",
        tags: ["API Keys"],
        summary: "List all active API keys",
      },
    })
    .output(z.any())
    .query(async ({ ctx }) => {
      const keys = await db
        .select({
          id: apiKeysTable.id,
          name: apiKeysTable.name,
          keyPrefix: apiKeysTable.keyPrefix,
          scopes: apiKeysTable.scopes,
          lastUsedAt: apiKeysTable.lastUsedAt,
          expiresAt: apiKeysTable.expiresAt,
          createdAt: apiKeysTable.createdAt,
        })
        .from(apiKeysTable)
        .where(
          and(
            eq(apiKeysTable.userId, ctx.user.id),
            eq(apiKeysTable.isActive, true)
          )
        );
      return keys;
    }),

  create: scopedProcedure("write:all")
    .meta({
      openapi: {
        method: "POST",
        path: "/api-keys",
        tags: ["API Keys"],
        summary: "Create a new API key",
      },
    })
    .input(
      z.object({
        name: z.string().min(1).max(100),
        scopes: z.array(z.string()).default(["read:all", "write:all"]),
      })
    )
    .output(z.any())
    .mutation(async ({ ctx, input }) => {
      const { fullKey, keyHash, keyPrefix } = generateApiKey();

      const [key] = await db
        .insert(apiKeysTable)
        .values({
          userId: ctx.user.id,
          name: input.name,
          keyHash,
          keyPrefix,
          scopes: input.scopes,
        })
        .returning({
          id: apiKeysTable.id,
          name: apiKeysTable.name,
        });

      await db.insert(auditLogsTable).values({
        userId: ctx.user.id,
        action: "create_api_key",
        entityType: "api_key",
        entityId: key.id,
        ipAddress: ctx.ipHash || null,
        metadata: { name: input.name, scopes: input.scopes },
      });

      // ONLY time full key is ever returned
      return {
        ...key,
        fullKey,
      };
    }),

  revoke: scopedProcedure("write:all")
    .meta({
      openapi: {
        method: "DELETE",
        path: "/api-keys/{id}",
        tags: ["API Keys"],
        summary: "Revoke an API key",
      },
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .mutation(async ({ ctx, input }) => {
      await db
        .update(apiKeysTable)
        .set({ isActive: false })
        .where(
          and(
            eq(apiKeysTable.id, input.id),
            eq(apiKeysTable.userId, ctx.user.id)
          )
        );
        
      await db.insert(auditLogsTable).values({
        userId: ctx.user.id,
        action: "revoke_api_key",
        entityType: "api_key",
        entityId: input.id,
        ipAddress: ctx.ipHash || null,
      });
        
      return { success: true };
    }),
});
