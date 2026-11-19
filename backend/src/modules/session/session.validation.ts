import { z } from "zod";
import mongoose from "mongoose";

export const sessionZodSchema = z.object({
  userId: z.custom<mongoose.Types.ObjectId>(),

  tokenHash: z.string(),

  prevTokenHash: z.string().optional(),

  rotatedAt: z.date().optional(),

  expiresAt: z.date(),

  userAgent: z.string().optional(),

  ipAddress: z.string().optional(),

  isActive: z.boolean().default(true),
});

export type ISession = z.infer<typeof sessionZodSchema>;
