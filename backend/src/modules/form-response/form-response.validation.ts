import { z } from "zod";
import mongoose from "mongoose";
import { receiptStatusZod, receiptHistoryZod } from "../../utils/receipt.js";
import { assetFromUrl } from "../../config/cloudinary.js";

// A single answer. Only the value block matching the question's type is populated.
const gridValueZodSchema = z.object({
  row: z.string(),
  columns: z.array(z.string()).max(50).default([]),
});

// Only files we uploaded (our Cloudinary cloud, kollects/ folder): a respondent can't plant
// an arbitrary (phishing) link in the creator's dashboard by skipping the upload endpoint.
const fileValueZodSchema = z.object({
  url: z.string().max(1000).refine((u) => assetFromUrl(u) !== null, "File must be uploaded through Kollects"),
  name: z.string(),
  size: z.number(),
  mimeType: z.string(),
});

const formAnswerZodSchema = z.object({
  questionId: z.custom<mongoose.Types.ObjectId>(),
  questionTitleSnapshot: z.string().optional(),
  textValue: z.string().nullable().optional(),
  numberValue: z.number().nullable().optional(),
  dateValue: z.string().nullable().optional(),
  selectedOptionIds: z.array(z.string()).optional().default([]),
  scaleValue: z.number().nullable().optional(),
  gridValues: z.array(gridValueZodSchema).optional().default([]),
  fileUrls: z.array(fileValueZodSchema).optional().default([]),
  isCorrect: z.boolean().optional(),
  pointsEarned: z.number().optional(),
  skipped: z.boolean().default(false),
});

const paymentSnapshotSchema = z.object({
  selectedOptionIds: z.array(z.string()),
  selectedOptions: z.array(z.string()),
  selectedCount: z.number(),
  totalAmount: z.number(),
  message: z.string(),
  upiId: z.string(),
  status: z.enum(["pending", "paid", "failed"]),
}).optional();

export const formResponseZodSchema = z.object({
  formId: z.custom<mongoose.Types.ObjectId>(),
  respondentId: z.custom<mongoose.Types.ObjectId>().optional(),
  sessionToken: z.string(),
  respondentEmail: z.string().optional(),
  respondentName: z.string().optional(),
  ipHash: z.string().optional(),
  userAgent: z.string().optional(),
  answers: z.array(formAnswerZodSchema),
  payment: paymentSnapshotSchema,
  score: z.number().optional(),
  totalPoints: z.number().optional(),
  startedAt: z.date().optional(),
  timeTakenMs: z.number().optional(),
  isComplete: z.boolean(),
  submittedAt: z.date(),
  receipt: receiptStatusZod,
  receiptHistory: receiptHistoryZod,
});

export type IFormResponse = z.infer<typeof formResponseZodSchema>;
export type IFormAnswer = z.infer<typeof formAnswerZodSchema>;

// Request-facing schema for POST /form-responses/:formId.
const submitAnswerSchema = z.object({
  questionId: z.string().min(1),
  textValue: z.string().nullable().optional(),
  numberValue: z.number().nullable().optional(),
  dateValue: z.string().nullable().optional(),
  selectedOptionIds: z.array(z.string()).max(100).optional().default([]),
  scaleValue: z.number().nullable().optional(),
  gridValues: z.array(gridValueZodSchema).max(50).optional().default([]),
  fileUrls: z.array(fileValueZodSchema).max(10).optional().default([]),
  skipped: z.boolean().default(false),
});

export const submitFormResponseSchema = z.object({
  sessionToken: z.string().min(1),
  respondentEmail: z.string().email().optional(),
  respondentName: z.string().trim().max(60).optional(),
  // Sent by the client when the quiz timer ran out mid-attempt: submit whatever was answered.
  timedOut: z.boolean().optional(),
  answers: z.array(submitAnswerSchema).min(1).max(500),
  isComplete: z.boolean().default(true),
});

export const startAttemptSchema = z.object({ sessionToken: z.string().min(1) });

export type ISubmitFormResponse = z.infer<typeof submitFormResponseSchema>;
export type ISubmitAnswer = z.infer<typeof submitAnswerSchema>;
