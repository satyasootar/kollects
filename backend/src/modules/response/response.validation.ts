import { z } from "zod";
import mongoose from "mongoose";
import { receiptStatusZod, receiptHistoryZod } from "../../utils/receipt.js";

// Must be an id string: a bare z.custom() would let objects like {"$ne": null} through to queries.
const objectIdZod = z.custom<mongoose.Types.ObjectId>((v) => mongoose.isObjectIdOrHexString(v), "Invalid id");

const answerItemZodSchema = z.object({
  questionId: objectIdZod,
  selectedOptionId: objectIdZod.nullable().optional(),
  selectedOptionIds: z.array(objectIdZod).max(100).optional().default([]),
  textResponse: z.string().nullable().optional(),
  skipped: z.boolean(),
});

export const responseZodSchema = z.object({
  pollId: z.custom<mongoose.Types.ObjectId>(),
  respondentId: z.custom<mongoose.Types.ObjectId>().optional(),
  sessionToken: z.string(),
  ipHash: z.string().optional(),
  userAgent: z.string().optional(),
  answers: z.array(answerItemZodSchema),
  isComplete: z.boolean(),
  submittedAt: z.date(),
  receipt: receiptStatusZod,
  receiptHistory: receiptHistoryZod,
});

export type IResponse = z.infer<typeof responseZodSchema>;

// Request-facing schema for POST /responses/:pollId.
// pollId comes from the route param; ipHash/userAgent/submittedAt are set server-side.
export const submitResponseSchema = z.object({
  sessionToken: z.string().min(1),
  answers: z.array(answerItemZodSchema).min(1).max(200),
  isComplete: z.boolean().default(true),
});

export type ISubmitResponse = z.infer<typeof submitResponseSchema>;
